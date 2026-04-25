import { AIAdapterError, TimeoutError } from './errors';
import {
  AdapterConfig,
  AIAdapterMiddleware,
  AIAdapterMiddlewareContext,
  EmbedTextInput,
  EmbedTextResult,
  GenerateTextInput,
  GenerateTextResult,
  GenerateVisionInput,
  GenerateVisionResult,
  HealthCheckResult,
  RetryConfig,
  StreamTextChunk,
  TranscribeAudioInput,
  TranscribeAudioResult,
} from './types';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  backoffMs: 250,
  shouldRetry: () => true,
};

export abstract class BaseAIAdapter {
  protected readonly config: AdapterConfig;
  protected readonly retries: RetryConfig;
  private readonly middleware: AIAdapterMiddleware[];

  constructor(config: AdapterConfig) {
    this.config = config;
    this.retries = { ...DEFAULT_RETRY_CONFIG, ...config.retries };
    this.middleware = config.middleware ?? [];
  }

  abstract generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
  abstract streamText(input: GenerateTextInput): AsyncGenerator<StreamTextChunk>;
  abstract healthCheck(): Promise<HealthCheckResult>;

  async embedText(_input: EmbedTextInput): Promise<EmbedTextResult> {
    throw new AIAdapterError('Embedding is not implemented for this provider.', 'NOT_IMPLEMENTED');
  }

  async generateVision(_input: GenerateVisionInput): Promise<GenerateVisionResult> {
    throw new AIAdapterError('Vision is not implemented for this provider.', 'NOT_IMPLEMENTED');
  }

  async transcribeAudio(_input: TranscribeAudioInput): Promise<TranscribeAudioResult> {
    throw new AIAdapterError('Audio transcription is not implemented for this provider.', 'NOT_IMPLEMENTED');
  }

  protected async withMiddleware<T>(
    operation: AIAdapterMiddlewareContext['operation'],
    input: unknown,
    fn: () => Promise<T>,
  ): Promise<T> {
    const context: AIAdapterMiddlewareContext = {
      operation,
      provider: this.config.provider,
      input,
      startedAt: Date.now(),
    };

    for (const middleware of this.middleware) {
      await middleware.before?.(context);
    }

    try {
      const result = await fn();
      for (const middleware of this.middleware) {
        await middleware.after?.({ ...context, result });
      }
      return result;
    } catch (error) {
      for (const middleware of this.middleware) {
        await middleware.onError?.({ ...context, error });
      }
      throw error;
    }
  }

  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.retries.maxAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const shouldRetry = this.retries.shouldRetry?.(error, attempt) ?? false;
        const isLastAttempt = attempt === this.retries.maxAttempts;

        if (!shouldRetry || isLastAttempt) {
          break;
        }

        await this.sleep(this.retries.backoffMs * attempt);
      }
    }

    throw lastError;
  }

  protected createAbortSignal(timeoutMs: number): { signal: AbortSignal; cancel: () => void } {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort(new TimeoutError(`Request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    return {
      signal: controller.signal,
      cancel: () => clearTimeout(timer),
    };
  }

  protected normalizeError(error: unknown, fallbackMessage: string): AIAdapterError {
    if (error instanceof AIAdapterError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new TimeoutError(error.message, error);
      }
      return new AIAdapterError(error.message, 'UNKNOWN_PROVIDER_ERROR', error);
    }

    return new AIAdapterError(fallbackMessage, 'UNKNOWN_PROVIDER_ERROR', error);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
