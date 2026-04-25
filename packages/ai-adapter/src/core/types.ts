export type AIProvider = 'ollama' | 'openai' | 'anthropic';

export type AdapterUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type AdapterMetadata = {
  provider: AIProvider;
  model?: string;
  latencyMs?: number;
  [key: string]: unknown;
};

export type GenerateTextInput = {
  prompt: string;
  systemPrompt?: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
};

export type GenerateTextResult = {
  text: string;
  usage?: AdapterUsage;
  metadata?: AdapterMetadata;
};

export type StreamTextChunk = {
  text: string;
  done?: boolean;
  usage?: AdapterUsage;
  metadata?: AdapterMetadata;
};

export type EmbedTextInput = {
  text: string;
  model?: string;
  timeoutMs?: number;
};

export type EmbedTextResult = {
  embedding: number[];
  metadata?: AdapterMetadata;
};

export type HealthCheckResult = {
  ok: boolean;
  provider: AIProvider;
  message?: string;
  metadata?: AdapterMetadata;
};

export type AIAdapterMiddlewareContext = {
  operation: 'generateText' | 'streamText' | 'embedText' | 'healthCheck';
  provider: AIProvider;
  input?: unknown;
  startedAt: number;
};

export type AIAdapterMiddleware = {
  name: string;
  before?: (context: AIAdapterMiddlewareContext) => void | Promise<void>;
  after?: (context: AIAdapterMiddlewareContext & { result: unknown }) => void | Promise<void>;
  onError?: (context: AIAdapterMiddlewareContext & { error: unknown }) => void | Promise<void>;
};

export type RetryConfig = {
  maxAttempts: number;
  backoffMs: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

export type AdapterConfig = {
  provider: AIProvider;
  defaultModel?: string;
  timeoutMs?: number;
  retries?: Partial<RetryConfig>;
  apiKey?: string;
  middleware?: AIAdapterMiddleware[];
};
