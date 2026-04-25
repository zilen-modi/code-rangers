import fs from 'fs';
import path from 'path';
import { getAIAdapter } from '@repo/ai-adapter';
import type { BaseAIAdapter, AIProvider } from '@repo/ai-adapter';

// ─── Provider Configuration ──────────────────────────────────────────

const PROVIDER = (process.env.TRANSLATION_PROVIDER || 'openai') as AIProvider;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const VISION_MODEL = process.env.TRANSLATION_VISION_MODEL || (PROVIDER === 'openai' ? 'gpt-4o' : 'llava');

// ─── Prompt Template ──────────────────────────────────────────────────

function buildMenuAnalysisPrompt(): string {
  return [
    `You are an expert food critic, culinary translator, and data extractor.`,
    `You are looking at an image of a food menu.`,
    ``,
    `TASK:`,
    `1. Automatically detect the original language of the menu.`,
    `2. Extract all the food items you can clearly identify.`,
    `3. Translate the name and details of the food into English.`,
    `4. Categorize each item strictly as either "veg" (vegetarian) or "non-veg" (contains meat/seafood/poultry).`,
    `5. Identify a few "recommended" dishes (set recommended: true for standout or popular dishes, false for others).`,
    ``,
    `CRITICAL INSTRUCTIONS:`,
    `- Respond ONLY with valid JSON. Do NOT wrap it in markdown code blocks (\`\`\`json) and do not provide any additional text.`,
    `- Your output MUST be an array of exactly two category objects ("veg" and "non-veg").`,
    `- Use the exact JSON structure below:`,
    ``,
    `[`,
    `  {`,
    `    "category": "veg",`,
    `    "items": [`,
    `      {`,
    `        "name": "Food Name in English",`,
    `        "details": "Description or ingredients in English",`,
    `        "recommended": true`,
    `      }`,
    `    ]`,
    `  },`,
    `  {`,
    `    "category": "non-veg",`,
    `    "items": [`,
    `      {`,
    `        "name": "Food Name in English",`,
    `        "details": "Description or ingredients in English",`,
    `        "recommended": false`,
    `      }`,
    `    ]`,
    `  }`,
    `]`
  ].join('\n');
}

// ─── Types ─────────────────────────────────────────────────────────────

export type AnalyzeMenuInput = {
  requestId: string;
  imagePath: string;
};

export type MenuItem = {
  name: string;
  details: string;
  recommended: boolean;
};

export type MenuCategory = {
  category: 'veg' | 'non-veg';
  items: MenuItem[];
};

export type AnalyzeMenuResult = {
  requestId: string;
  detectedLanguage?: string;
  menuCategories: MenuCategory[];
  metadata?: {
    provider?: string;
    model?: string;
    latencyMs?: number;
    [key: string]: unknown;
  };
};

// ─── Service ───────────────────────────────────────────────────────────

export class MenuService {
  private visionAdapter: BaseAIAdapter;

  constructor() {
    const adapterConfig = {
      apiKey: OPENAI_API_KEY || undefined,
    };

    this.visionAdapter = getAIAdapter(PROVIDER, {
      ...adapterConfig,
      defaultModel: VISION_MODEL,
      timeoutMs: 120_000,
      retries: { maxAttempts: 3, backoffMs: 1000 },
    });
  }

  async analyzeMenu(input: AnalyzeMenuInput): Promise<AnalyzeMenuResult> {
    const { requestId, imagePath } = input;

    if (!imagePath || !fs.existsSync(imagePath)) {
      throw new Error(`Valid image file is required. File not found at: ${imagePath}`);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
    };

    const prompt = buildMenuAnalysisPrompt();

    const result = await this.visionAdapter.generateVision({
      prompt,
      imageBuffer,
      imageMimeType: mimeMap[ext] || 'image/jpeg',
      model: VISION_MODEL,
      temperature: 0.1,
      maxTokens: 4096,
    });

    let menuCategories: MenuCategory[] = [];
    try {
      let rawJson = result.text.trim();
      if (rawJson.startsWith('```json')) {
        rawJson = rawJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (rawJson.startsWith('```')) {
        rawJson = rawJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      menuCategories = JSON.parse(rawJson);
    } catch (parseError) {
      console.error('[MenuService] Failed to parse AI response as JSON:', result.text);
      throw new Error('AI failed to return valid JSON format for the menu.');
    }

    return {
      requestId,
      menuCategories,
      metadata: result.metadata,
    };
  }
}
