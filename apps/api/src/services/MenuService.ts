import fs from 'fs';
import path from 'path';
import { getAIAdapter } from '@repo/ai-adapter';
import type { BaseAIAdapter } from '@repo/ai-adapter';

// ─── Always use Ollama for menu analysis ─────────────────────────────
// llava  → vision/OCR  (reads text from image)
// llama3 → text/logic  (categorizes and structures as JSON)

const VISION_MODEL = 'llava';
const TEXT_MODEL = 'llama3';

// ─── Prompt: OCR only (llava) ─────────────────────────────────────────

function buildMenuOcrPrompt(): string {
  return [
    `You are an OCR engine reading a food menu image.`,
    ``,
    `TASK:`,
    `Extract ALL visible text from this menu image exactly as it appears.`,
    ``,
    `RULES:`,
    `- Return ONLY the raw extracted text. Do NOT translate or explain anything.`,
    `- Preserve line breaks, item names, prices, and descriptions as-is.`,
    `- If no text is visible, return exactly: [NO TEXT FOUND]`,
    ``,
    `Extracted menu text:`,
  ].join('\n');
}

// ─── Prompt: categorize extracted text (llama3) ───────────────────────

function buildMenuCategorizationPrompt(extractedText: string): string {
  return [
    `You are a food menu data extractor.`,
    ``,
    `Below is raw text extracted from a food menu image:`,
    `"""`,
    extractedText,
    `"""`,
    ``,
    `TASK:`,
    `1. Translate all food item names and descriptions into English.`,
    `2. Categorize each item as "veg" (vegetarian) or "non-veg" (contains meat/seafood/poultry/eggs).`,
    `3. Mark 1-3 standout or popular dishes as recommended: true.`,
    ``,
    `CRITICAL OUTPUT RULES:`,
    `- Respond ONLY with a valid JSON array. No markdown, no explanation, no extra text.`,
    `- Use this exact structure:`,
    ``,
    `[`,
    `  {`,
    `    "category": "veg",`,
    `    "items": [`,
    `      { "name": "Food Name in English", "details": "Short description in English", "recommended": true }`,
    `    ]`,
    `  },`,
    `  {`,
    `    "category": "non-veg",`,
    `    "items": [`,
    `      { "name": "Food Name in English", "details": "Short description in English", "recommended": false }`,
    `    ]`,
    `  }`,
    `]`,
    ``,
    `Output ONLY the JSON array now:`,
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
  private textAdapter: BaseAIAdapter;

  constructor() {
    this.visionAdapter = getAIAdapter('ollama', {
      defaultModel: VISION_MODEL,
      timeoutMs: 120_000,
      retries: { maxAttempts: 2, backoffMs: 1000 },
    });

    this.textAdapter = getAIAdapter('ollama', {
      defaultModel: TEXT_MODEL,
      timeoutMs: 120_000,
      retries: { maxAttempts: 2, backoffMs: 1000 },
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

    // Step 1: llava — extract raw text from menu image (OCR only)
    const ocrResult = await this.visionAdapter.generateVision({
      prompt: buildMenuOcrPrompt(),
      imageBuffer,
      imageMimeType: mimeMap[ext] || 'image/jpeg',
      model: VISION_MODEL,
      temperature: 0.1,
      maxTokens: 2048,
    });

    const extractedText = ocrResult.text.trim();
    console.log('[MenuService] OCR extracted:', extractedText.slice(0, 200));

    if (!extractedText || extractedText === '[NO TEXT FOUND]') {
      return {
        requestId,
        menuCategories: [
          { category: 'veg', items: [] },
          { category: 'non-veg', items: [] },
        ],
        metadata: { ...ocrResult.metadata, note: 'No text found in image' },
      };
    }

    // Step 2: llama3 — categorize and structure extracted text as JSON
    const categorizationResult = await this.textAdapter.generateText({
      prompt: buildMenuCategorizationPrompt(extractedText),
      model: TEXT_MODEL,
      temperature: 0.1,
      maxTokens: 4096,
    });

    let menuCategories: MenuCategory[] = [];
    try {
      let rawJson = categorizationResult.text.trim();
      // Strip markdown fences if model wraps output anyway
      rawJson = rawJson.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      // Extract first JSON array if model adds preamble text
      const arrayStart = rawJson.indexOf('[');
      const arrayEnd = rawJson.lastIndexOf(']');
      if (arrayStart !== -1 && arrayEnd !== -1) {
        rawJson = rawJson.slice(arrayStart, arrayEnd + 1);
      }
      menuCategories = JSON.parse(rawJson);
    } catch (parseError) {
      console.error('[MenuService] Failed to parse llama3 JSON response:', categorizationResult.text);
      throw new Error('AI failed to return valid JSON for menu categorization.');
    }

    return {
      requestId,
      menuCategories,
      metadata: {
        ...categorizationResult.metadata,
        ocrModel: VISION_MODEL,
        textModel: TEXT_MODEL,
        provider: 'ollama',
      },
    };
  }
}
