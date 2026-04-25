import * as fs from 'fs';
import * as path from 'path';
import { getAIAdapter } from '@repo/ai-adapter';
import type { BaseAIAdapter, AIProvider } from '@repo/ai-adapter';
import { UPLOAD_DIR } from '../middleware/upload.js';

// ─── Provider & Model Configuration ──────────────────────────────────
// Set TRANSLATION_PROVIDER to 'openai' (recommended) or 'ollama' (free/local).
// Each task type can use a different model.

const PROVIDER = (process.env.TRANSLATION_PROVIDER || 'openai') as AIProvider;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const TEXT_MODEL = process.env.TRANSLATION_TEXT_MODEL || (PROVIDER === 'openai' ? 'gpt-4o' : 'llama3');
const VISION_MODEL = process.env.TRANSLATION_VISION_MODEL || (PROVIDER === 'openai' ? 'gpt-4o' : 'llava');
const SPEECH_MODEL = process.env.TRANSLATION_SPEECH_MODEL || (PROVIDER === 'openai' ? 'whisper-1' : 'whisper');

// ─── Prompt Templates ─────────────────────────────────────────────────

function buildTextTranslationPrompt(text: string, inputLanguage: string, responseLanguage: string): string {
  return [
    `You are an expert translator. Your sole job is to translate text accurately.`,
    ``,
    `SOURCE LANGUAGE: ${inputLanguage}`,
    `TARGET LANGUAGE: ${responseLanguage}`,
    ``,
    `RULES:`,
    `- Translate ONLY the text provided below.`,
    `- Do NOT add explanations, commentary, or notes.`,
    `- Preserve the original formatting, punctuation style, and paragraph structure.`,
    `- If the text is already in the target language, return it unchanged.`,
    `- For ambiguous terms, choose the most common translation in the target language.`,
    ``,
    `TEXT TO TRANSLATE:`,
    `"""`,
    text,
    `"""`,
    ``,
    `TRANSLATED TEXT:`,
  ].join('\n');
}

function buildImageExtractionPrompt(inputLanguage: string, responseLanguage: string): string {
  return [
    `You are an expert OCR reader and translator.`,
    ``,
    `TASK:`,
    `1. Extract ALL visible text from this image. The text is in ${inputLanguage}.`,
    `2. Translate the extracted text into ${responseLanguage}.`,
    ``,
    `RULES:`,
    `- Extract text exactly as it appears (preserve structure, line breaks, etc.).`,
    `- After extraction, provide ONLY the translated text.`,
    `- Do NOT include the original extracted text in your final response — only the translation.`,
    `- Do NOT add any commentary, explanation, or notes.`,
    `- If no text is found in the image, respond with: "[NO TEXT FOUND IN IMAGE]"`,
    ``,
    `Respond with ONLY the translated text:`,
  ].join('\n');
}

function buildVoiceTranslationPrompt(transcribedText: string, inputLanguage: string, responseLanguage: string): string {
  return [
    `You are an expert translator. You are translating speech that was transcribed from audio.`,
    ``,
    `SOURCE LANGUAGE: ${inputLanguage}`,
    `TARGET LANGUAGE: ${responseLanguage}`,
    ``,
    `RULES:`,
    `- The text below was auto-transcribed from speech and may contain minor errors.`,
    `- Fix obvious transcription errors while translating (e.g., "there" vs "their").`,
    `- Translate ONLY the text provided below.`,
    `- Do NOT add explanations, commentary, or notes.`,
    `- Preserve the original meaning and tone as closely as possible.`,
    ``,
    `TRANSCRIBED TEXT:`,
    `"""`,
    transcribedText,
    `"""`,
    ``,
    `TRANSLATED TEXT:`,
  ].join('\n');
}

// ─── Types ─────────────────────────────────────────────────────────────

export type TranslationInput = {
  requestId: string;
  inputLanguage: string;
  responseLanguage: string;
  text?: string;
  imagePath?: string;
  voicePath?: string;
};

export type TranslationResult = {
  requestId: string;
  translatedText: string;
  inputType: 'text' | 'image' | 'voice';
  inputLanguage: string;
  responseLanguage: string;
  metadata?: {
    provider?: string;
    model?: string;
    latencyMs?: number;
    [key: string]: unknown;
  };
};

// ─── Service ───────────────────────────────────────────────────────────

export class TranslationService {
  private textAdapter: BaseAIAdapter;
  private visionAdapter: BaseAIAdapter;
  private speechAdapter: BaseAIAdapter;

  constructor() {
    const adapterConfig = {
      apiKey: OPENAI_API_KEY || undefined,
    };

    this.textAdapter = getAIAdapter(PROVIDER, {
      ...adapterConfig,
      defaultModel: TEXT_MODEL,
      timeoutMs: 60_000,
      retries: { maxAttempts: 3, backoffMs: 500 },
    });

    this.visionAdapter = getAIAdapter(PROVIDER, {
      ...adapterConfig,
      defaultModel: VISION_MODEL,
      timeoutMs: 120_000,
      retries: { maxAttempts: 3, backoffMs: 1000 },
    });

    this.speechAdapter = getAIAdapter(PROVIDER, {
      ...adapterConfig,
      defaultModel: SPEECH_MODEL,
      timeoutMs: 120_000,
      retries: { maxAttempts: 3, backoffMs: 1000 },
    });
  }

  /**
   * Main translation method.
   *
   * Handles both fresh requests AND retries:
   *  - If files are provided (imagePath / voicePath), process them directly.
   *  - If only a requestId is provided (no text, no files), look up the previously
   *    stored file on disk and re-process it (retry).
   */
  async translate(input: TranslationInput): Promise<TranslationResult> {
    const { requestId, inputLanguage, responseLanguage, text, imagePath, voicePath } = input;

    // ── Fresh request with file or text ──
    if (text) {
      return this.translateText(requestId, text, inputLanguage, responseLanguage);
    }

    if (imagePath) {
      return this.translateImage(requestId, imagePath, inputLanguage, responseLanguage);
    }

    if (voicePath) {
      return this.translateVoice(requestId, voicePath, inputLanguage, responseLanguage);
    }

    // ── Retry: no new input — look up stored file by requestId ──
    const storedImage = this.findStoredFile(requestId, 'image');
    if (storedImage) {
      return this.translateImage(requestId, storedImage, inputLanguage, responseLanguage);
    }

    const storedVoice = this.findStoredFile(requestId, 'voice');
    if (storedVoice) {
      return this.translateVoice(requestId, storedVoice, inputLanguage, responseLanguage);
    }

    throw new Error(
      'No input provided. Supply text, an image file, or a voice file. ' +
      'For retry, provide the original requestId — the stored file was not found or may have been cleaned up.',
    );
  }

  // ─── Private Processing Methods ───────────────────────────────────

  private async translateText(
    requestId: string,
    text: string,
    inputLanguage: string,
    responseLanguage: string,
  ): Promise<TranslationResult> {
    const prompt = buildTextTranslationPrompt(text, inputLanguage, responseLanguage);

    const result = await this.textAdapter.generateText({
      prompt,
      model: TEXT_MODEL,
      temperature: 0.2,
      maxTokens: 4096,
    });

    return {
      requestId,
      translatedText: result.text.trim(),
      inputType: 'text',
      inputLanguage,
      responseLanguage,
      metadata: result.metadata,
    };
  }

  private async translateImage(
    requestId: string,
    imagePath: string,
    inputLanguage: string,
    responseLanguage: string,
  ): Promise<TranslationResult> {
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

    const prompt = buildImageExtractionPrompt(inputLanguage, responseLanguage);

    const result = await this.visionAdapter.generateVision({
      prompt,
      imageBuffer,
      imageMimeType: mimeMap[ext] || 'image/jpeg',
      model: VISION_MODEL,
      temperature: 0.2,
      maxTokens: 4096,
    });

    return {
      requestId,
      translatedText: result.text.trim(),
      inputType: 'image',
      inputLanguage,
      responseLanguage,
      metadata: result.metadata,
    };
  }

  private async translateVoice(
    requestId: string,
    voicePath: string,
    inputLanguage: string,
    responseLanguage: string,
  ): Promise<TranslationResult> {
    // Step 1: Transcribe the audio
    const transcribedText = await this.transcribeAudio(voicePath, inputLanguage);

    // Step 2: Translate the transcription
    const translationPrompt = buildVoiceTranslationPrompt(transcribedText, inputLanguage, responseLanguage);

    const result = await this.textAdapter.generateText({
      prompt: translationPrompt,
      model: TEXT_MODEL,
      temperature: 0.2,
      maxTokens: 4096,
    });

    return {
      requestId,
      translatedText: result.text.trim(),
      inputType: 'voice',
      inputLanguage,
      responseLanguage,
      metadata: {
        ...result.metadata,
        transcribedText,
        speechModel: SPEECH_MODEL,
      },
    };
  }

  /**
   * Transcribe audio.
   * - OpenAI provider: uses Whisper via transcribeAudio()
   * - Ollama provider: falls back to text model (limited) or WHISPER_API_ENDPOINT
   */
  private async transcribeAudio(audioPath: string, language: string): Promise<string> {
    const audioBuffer = fs.readFileSync(audioPath);
    const ext = path.extname(audioPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm',
      '.mp4': 'audio/mp4',
      '.flac': 'audio/flac',
      '.m4a': 'audio/x-m4a',
    };

    try {
      // Use the adapter's native transcription if available (OpenAI Whisper)
      const result = await this.speechAdapter.transcribeAudio({
        audioBuffer,
        audioMimeType: mimeMap[ext] || 'audio/mpeg',
        language,
        model: SPEECH_MODEL,
      });

      return result.text;
    } catch (error: any) {
      // If transcription is not implemented (e.g., Ollama), try WHISPER_API_ENDPOINT fallback
      if (error?.code === 'NOT_IMPLEMENTED') {
        const whisperEndpoint = process.env.WHISPER_API_ENDPOINT;

        if (whisperEndpoint) {
          return this.transcribeViaWhisperAPI(audioPath, language, whisperEndpoint);
        }

        throw new Error(
          'Audio transcription is not supported by the current provider. ' +
          'Set TRANSLATION_PROVIDER=openai or configure WHISPER_API_ENDPOINT.',
        );
      }

      throw error;
    }
  }

  /**
   * Fallback: Transcribe via external Whisper-compatible REST API.
   */
  private async transcribeViaWhisperAPI(
    audioPath: string,
    language: string,
    endpoint: string,
  ): Promise<string> {
    const audioBuffer = fs.readFileSync(audioPath);
    const formData = new FormData();
    const blob = new Blob([Uint8Array.from(audioBuffer)]);
    formData.append('file', blob, path.basename(audioPath));
    formData.append('language', language);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API returned status ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as { text?: string };
    return data.text ?? '';
  }

  // ─── File Lookup for Retry ────────────────────────────────────────

  private findStoredFile(requestId: string, fieldName: string): string | null {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return null;
    }

    const files = fs.readdirSync(UPLOAD_DIR);
    const prefix = `${requestId}_${fieldName}`;
    const match = files.find((f) => f.startsWith(prefix));

    if (!match) {
      return null;
    }

    return path.join(UPLOAD_DIR, match);
  }

  /**
   * Clean up uploaded files for a given requestId.
   */
  cleanupFiles(requestId: string): void {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return;
    }

    const files = fs.readdirSync(UPLOAD_DIR);
    for (const file of files) {
      if (file.startsWith(requestId)) {
        fs.unlinkSync(path.join(UPLOAD_DIR, file));
      }
    }
  }
}
