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
} from '../core/types';
import { estimateTokens } from '../utils/tokenizer';
import { buildPrompt } from '../utils/promptBuilder';

type OllamaGenerateResponse = {
  response?: string;
  done?: boolean;
  model?: string;
  prompt_eval_count?: number;
  eval_count?: number;
  total_duration?: number;
};

type OllamaAdapterConfig = Omit<AdapterConfig, 'provider'> & {
  baseUrl?: string;
};

export class OllamaAdapter extends BaseAIAdapter {
  private readonly baseUrl: string;

  constructor(config: OllamaAdapterConfig = {}) {
    super({
      provider: 'ollama',
      timeoutMs: config.timeoutMs ?? 30_000,
      defaultModel: config.defaultModel,
      retries: config.retries,
      middleware: config.middleware,
      apiKey: config.apiKey,
    });

    this.baseUrl = config.baseUrl ?? 'http://localhost:11434';
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    return this.withMiddleware('generateText', input, async () => {
      const startedAt = Date.now();
      const prompt = buildPrompt({
        system: input.systemPrompt,
        context: input.context,
        user: input.prompt,
      });

      const timeoutMs = input.timeoutMs ?? this.config.timeoutMs ?? 30_000;

      const result = await this.withRetry(async () => {
        const { signal, cancel } = this.createAbortSignal(timeoutMs);

        try {
          const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: input.model ?? this.config.defaultModel,
              prompt,
              stream: false,
              options: {
                temperature: input.temperature,
                num_predict: input.maxTokens,
              },
            }),
            signal,
          });

          if (!response.ok) {
            throw new AIAdapterError(
              `Ollama request failed with status ${response.status}.`,
              'OLLAMA_HTTP_ERROR',
            );
          }

          return (await response.json()) as OllamaGenerateResponse;
        } catch (error) {
          if (error instanceof TypeError) {
            throw new ProviderUnavailableError(
              'Ollama is unavailable. Is the service running on port 11434?',
              error,
            );
          }
          throw this.normalizeError(error, 'Failed to generate text with Ollama.');
        } finally {
          cancel();
        }
      });

      const completionTokens = result.eval_count ?? estimateTokens(result.response ?? '');
      const promptTokens = result.prompt_eval_count ?? estimateTokens(prompt);

      return {
        text: result.response ?? '',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        metadata: {
          provider: 'ollama',
          model: result.model ?? input.model ?? this.config.defaultModel,
          latencyMs: Date.now() - startedAt,
          totalDurationNs: result.total_duration,
        },
      };
    });
  }

  async *streamText(input: GenerateTextInput): AsyncGenerator<StreamTextChunk> {
    const startedAt = Date.now();
    const prompt = buildPrompt({
      system: input.systemPrompt,
      context: input.context,
      user: input.prompt,
    });

    const timeoutMs = input.timeoutMs ?? this.config.timeoutMs ?? 30_000;
    const { signal, cancel } = this.createAbortSignal(timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: input.model ?? this.config.defaultModel,
          prompt,
          stream: true,
          options: {
            temperature: input.temperature,
            num_predict: input.maxTokens,
          },
        }),
        signal,
      });

      if (!response.ok) {
        throw new AIAdapterError(
          `Ollama stream failed with status ${response.status}.`,
          'OLLAMA_HTTP_ERROR',
        );
      }

      if (!response.body) {
        throw new AIAdapterError('No response stream received from Ollama.', 'OLLAMA_STREAM_ERROR');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          const parsed = JSON.parse(line) as OllamaGenerateResponse;
          const chunkText = parsed.response ?? '';

          yield {
            text: chunkText,
            done: parsed.done,
            metadata: {
              provider: 'ollama',
              model: parsed.model ?? input.model ?? this.config.defaultModel,
              latencyMs: Date.now() - startedAt,
            },
            usage: parsed.done
              ? {
                  promptTokens: parsed.prompt_eval_count ?? estimateTokens(prompt),
                  completionTokens: parsed.eval_count ?? undefined,
                  totalTokens:
                    (parsed.prompt_eval_count ?? estimateTokens(prompt)) + (parsed.eval_count ?? 0),
                }
              : undefined,
          };
        }
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new ProviderUnavailableError(
          'Ollama is unavailable. Is the service running on port 11434?',
          error,
        );
      }
      throw this.normalizeError(error, 'Failed to stream text with Ollama.');
    } finally {
      cancel();
    }
  }

  async generateVision(input: GenerateVisionInput): Promise<GenerateVisionResult> {
    return this.withMiddleware('generateVision', input, async () => {
      const startedAt = Date.now();
      const timeoutMs = input.timeoutMs ?? this.config.timeoutMs ?? 60_000;

      const result = await this.withRetry(async () => {
        const { signal, cancel } = this.createAbortSignal(timeoutMs);

        try {
          const base64Image = input.imageBuffer.toString('base64');

          const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: input.model ?? this.config.defaultModel,
              prompt: input.prompt,
              system: input.systemPrompt,
              images: [base64Image],
              stream: false,
              options: {
                temperature: input.temperature ?? 0.2,
                num_predict: input.maxTokens,
              },
            }),
            signal,
          });

          if (!response.ok) {
            throw new AIAdapterError(
              `Ollama vision request failed with status ${response.status}.`,
              'OLLAMA_HTTP_ERROR',
            );
          }

          return (await response.json()) as OllamaGenerateResponse;
        } catch (error) {
          if (error instanceof TypeError) {
            throw new ProviderUnavailableError(
              'Ollama is unavailable. Is the service running on port 11434?',
              error,
            );
          }
          throw this.normalizeError(error, 'Failed to generate vision response with Ollama.');
        } finally {
          cancel();
        }
      });

      const completionTokens = result.eval_count ?? estimateTokens(result.response ?? '');
      const promptTokens = result.prompt_eval_count ?? estimateTokens(input.prompt);

      return {
        text: result.response ?? '',
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        metadata: {
          provider: 'ollama',
          model: result.model ?? input.model ?? this.config.defaultModel,
          latencyMs: Date.now() - startedAt,
        },
      };
    });
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const timeoutMs = this.config.timeoutMs ?? 5_000;
    const startedAt = Date.now();
    const { signal, cancel } = this.createAbortSignal(timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal });

      if (!response.ok) {
        return {
          ok: false,
          provider: 'ollama',
          message: `Ollama unhealthy: status ${response.status}`,
          metadata: { provider: 'ollama', latencyMs: Date.now() - startedAt },
        };
      }

      return {
        ok: true,
        provider: 'ollama',
        message: 'Ollama is reachable.',
        metadata: { provider: 'ollama', latencyMs: Date.now() - startedAt },
      };
    } catch (error) {
      return {
        ok: false,
        provider: 'ollama',
        message: this.normalizeError(error, 'Ollama health check failed.').message,
        metadata: { provider: 'ollama', latencyMs: Date.now() - startedAt },
      };
    } finally {
      cancel();
    }
  }
}
