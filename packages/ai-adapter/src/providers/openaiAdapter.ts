import { BaseAIAdapter } from '../core/baseAdapter';
import { AIAdapterError, ProviderUnavailableError } from '../core/errors';
import {
  AdapterConfig,
  GenerateTextInput,
  GenerateTextResult,
  GenerateVisionInput,
  GenerateVisionResult,
  HealthCheckResult,
  StreamTextChunk,
  TranscribeAudioInput,
  TranscribeAudioResult,
} from '../core/types';
import { estimateTokens } from '../utils/tokenizer';

// ─── OpenAI API Types ──────────────────────────────────────────────────

type OpenAIChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAIChatContentPart[];
};

type OpenAIChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } };

type OpenAIChatResponse = {
  id?: string;
  model?: string;
  choices?: {
    message?: { content?: string };
    finish_reason?: string;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type OpenAITranscriptionResponse = {
  text?: string;
  language?: string;
  duration?: number;
};

type OpenAIAdapterConfig = Omit<AdapterConfig, 'provider'> & {
  baseUrl?: string;
};

// ─── Adapter ───────────────────────────────────────────────────────────

export class OpenAIAdapter extends BaseAIAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: OpenAIAdapterConfig = {}) {
    super({
      provider: 'openai',
      timeoutMs: config.timeoutMs ?? 60_000,
      defaultModel: config.defaultModel ?? 'gpt-4o',
      retries: config.retries,
      middleware: config.middleware,
      apiKey: config.apiKey,
    });

    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';
    this.apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    if (!this.apiKey) {
      console.warn('[OpenAIAdapter] No API key provided. Set OPENAI_API_KEY in env or pass apiKey in config.');
    }
  }

  // ─── Text Generation (Chat Completions) ─────────────────────────────

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    return this.withMiddleware('generateText', input, async () => {
      const startedAt = Date.now();
      const timeoutMs = input.timeoutMs ?? this.config.timeoutMs ?? 60_000;
      const model = input.model ?? this.config.defaultModel ?? 'gpt-4o';

      const messages: OpenAIChatMessage[] = [];

      if (input.systemPrompt) {
        messages.push({ role: 'system', content: input.systemPrompt });
      }

      let userContent = input.prompt;
      if (input.context) {
        userContent = `Context:\n${input.context}\n\n${input.prompt}`;
      }
      messages.push({ role: 'user', content: userContent });

      const result = await this.withRetry(async () => {
        const { signal, cancel } = this.createAbortSignal(timeoutMs);

        try {
          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: input.temperature ?? 0.7,
              max_tokens: input.maxTokens,
              stream: false,
            }),
            signal,
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new AIAdapterError(
              `OpenAI request failed with status ${response.status}: ${errorBody}`,
              'OPENAI_HTTP_ERROR',
            );
          }

          return (await response.json()) as OpenAIChatResponse;
        } catch (error) {
          if (error instanceof TypeError) {
            throw new ProviderUnavailableError('OpenAI API is unreachable.', error);
          }
          throw this.normalizeError(error, 'Failed to generate text with OpenAI.');
        } finally {
          cancel();
        }
      });

      const text = result.choices?.[0]?.message?.content ?? '';

      return {
        text,
        usage: {
          promptTokens: result.usage?.prompt_tokens ?? estimateTokens(input.prompt),
          completionTokens: result.usage?.completion_tokens ?? estimateTokens(text),
          totalTokens: result.usage?.total_tokens,
        },
        metadata: {
          provider: 'openai',
          model: result.model ?? model,
          latencyMs: Date.now() - startedAt,
        },
      };
    });
  }

  // ─── Streaming (Chat Completions with stream) ───────────────────────

  async *streamText(input: GenerateTextInput): AsyncGenerator<StreamTextChunk> {
    const startedAt = Date.now();
    const timeoutMs = input.timeoutMs ?? this.config.timeoutMs ?? 60_000;
    const model = input.model ?? this.config.defaultModel ?? 'gpt-4o';
    const { signal, cancel } = this.createAbortSignal(timeoutMs);

    const messages: OpenAIChatMessage[] = [];
    if (input.systemPrompt) {
      messages.push({ role: 'system', content: input.systemPrompt });
    }
    messages.push({ role: 'user', content: input.prompt });

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: input.temperature ?? 0.7,
          max_tokens: input.maxTokens,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new AIAdapterError(
          `OpenAI stream failed with status ${response.status}: ${errorBody}`,
          'OPENAI_HTTP_ERROR',
        );
      }

      if (!response.body) {
        throw new AIAdapterError('No response stream received from OpenAI.', 'OPENAI_STREAM_ERROR');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            yield {
              text: '',
              done: true,
              metadata: { provider: 'openai', model, latencyMs: Date.now() - startedAt },
            };
            return;
          }

          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content ?? '';

          if (content) {
            yield {
              text: content,
              done: false,
              metadata: { provider: 'openai', model, latencyMs: Date.now() - startedAt },
            };
          }
        }
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new ProviderUnavailableError('OpenAI API is unreachable.', error);
      }
      throw this.normalizeError(error, 'Failed to stream text with OpenAI.');
    } finally {
      cancel();
    }
  }

  // ─── Vision (GPT-4o with image) ─────────────────────────────────────

  async generateVision(input: GenerateVisionInput): Promise<GenerateVisionResult> {
    return this.withMiddleware('generateVision', input, async () => {
      const startedAt = Date.now();
      const timeoutMs = input.timeoutMs ?? this.config.timeoutMs ?? 120_000;
      const model = input.model ?? this.config.defaultModel ?? 'gpt-4o';

      const mimeType = input.imageMimeType ?? 'image/jpeg';
      const base64Image = input.imageBuffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      const messages: OpenAIChatMessage[] = [];

      if (input.systemPrompt) {
        messages.push({ role: 'system', content: input.systemPrompt });
      }

      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: input.prompt },
          { type: 'image_url', image_url: { url: dataUri, detail: 'high' } },
        ],
      });

      const result = await this.withRetry(async () => {
        const { signal, cancel } = this.createAbortSignal(timeoutMs);

        try {
          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: input.temperature ?? 0.2,
              max_tokens: input.maxTokens ?? 4096,
              stream: false,
            }),
            signal,
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new AIAdapterError(
              `OpenAI vision request failed with status ${response.status}: ${errorBody}`,
              'OPENAI_HTTP_ERROR',
            );
          }

          return (await response.json()) as OpenAIChatResponse;
        } catch (error) {
          if (error instanceof TypeError) {
            throw new ProviderUnavailableError('OpenAI API is unreachable.', error);
          }
          throw this.normalizeError(error, 'Failed to generate vision response with OpenAI.');
        } finally {
          cancel();
        }
      });

      const text = result.choices?.[0]?.message?.content ?? '';

      return {
        text,
        usage: {
          promptTokens: result.usage?.prompt_tokens,
          completionTokens: result.usage?.completion_tokens,
          totalTokens: result.usage?.total_tokens,
        },
        metadata: {
          provider: 'openai',
          model: result.model ?? model,
          latencyMs: Date.now() - startedAt,
        },
      };
    });
  }

  // ─── Audio Transcription (Whisper) ──────────────────────────────────

  async transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioResult> {
    return this.withMiddleware('transcribeAudio', input, async () => {
      const startedAt = Date.now();
      const timeoutMs = input.timeoutMs ?? this.config.timeoutMs ?? 120_000;
      const model = input.model ?? 'whisper-1';

      const result = await this.withRetry(async () => {
        const { signal, cancel } = this.createAbortSignal(timeoutMs);

        try {
          const formData = new FormData();
          const blob = new Blob([Uint8Array.from(input.audioBuffer)], { type: input.audioMimeType ?? 'audio/mpeg' });
          formData.append('file', blob, `audio.${this.getAudioExtension(input.audioMimeType)}`);
          formData.append('model', model);

          if (input.language) {
            formData.append('language', input.language);
          }

          formData.append('response_format', 'verbose_json');

          const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: formData,
            signal,
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new AIAdapterError(
              `OpenAI Whisper request failed with status ${response.status}: ${errorBody}`,
              'OPENAI_HTTP_ERROR',
            );
          }

          return (await response.json()) as OpenAITranscriptionResponse;
        } catch (error) {
          if (error instanceof TypeError) {
            throw new ProviderUnavailableError('OpenAI API is unreachable.', error);
          }
          throw this.normalizeError(error, 'Failed to transcribe audio with OpenAI Whisper.');
        } finally {
          cancel();
        }
      });

      return {
        text: result.text ?? '',
        language: result.language,
        duration: result.duration,
        metadata: {
          provider: 'openai',
          model,
          latencyMs: Date.now() - startedAt,
        },
      };
    });
  }

  // ─── Health Check ───────────────────────────────────────────────────

  async healthCheck(): Promise<HealthCheckResult> {
    const startedAt = Date.now();
    const { signal, cancel } = this.createAbortSignal(5_000);

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal,
      });

      if (!response.ok) {
        return {
          ok: false,
          provider: 'openai',
          message: `OpenAI unhealthy: status ${response.status}`,
          metadata: { provider: 'openai', latencyMs: Date.now() - startedAt },
        };
      }

      return {
        ok: true,
        provider: 'openai',
        message: 'OpenAI API is reachable.',
        metadata: { provider: 'openai', latencyMs: Date.now() - startedAt },
      };
    } catch (error) {
      return {
        ok: false,
        provider: 'openai',
        message: this.normalizeError(error, 'OpenAI health check failed.').message,
        metadata: { provider: 'openai', latencyMs: Date.now() - startedAt },
      };
    } finally {
      cancel();
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────

  private getAudioExtension(mimeType?: string): string {
    const map: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/webm': 'webm',
      'audio/mp4': 'mp4',
      'audio/flac': 'flac',
      'audio/x-m4a': 'm4a',
    };
    return map[mimeType ?? ''] ?? 'mp3';
  }
}
