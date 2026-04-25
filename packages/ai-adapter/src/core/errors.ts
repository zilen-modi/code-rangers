export class AIAdapterError extends Error {
  public readonly code: string;
  public readonly cause?: unknown;

  constructor(message: string, code = 'AI_ADAPTER_ERROR', cause?: unknown) {
    super(message);
    this.name = 'AIAdapterError';
    this.code = code;
    this.cause = cause;
  }
}

export class ProviderUnavailableError extends AIAdapterError {
  constructor(message: string, cause?: unknown) {
    super(message, 'PROVIDER_UNAVAILABLE', cause);
    this.name = 'ProviderUnavailableError';
  }
}

export class TimeoutError extends AIAdapterError {
  constructor(message: string, cause?: unknown) {
    super(message, 'TIMEOUT', cause);
    this.name = 'TimeoutError';
  }
}
