import { BaseAIAdapter } from '../core/baseAdapter';
import { AIAdapterError } from '../core/errors';
import { AdapterConfig, AIProvider, GenerateTextInput, GenerateTextResult, StreamTextChunk } from '../core/types';
import { OllamaAdapter } from './ollamaAdapter';
import { OpenAIAdapter } from './openaiAdapter';

class PlaceholderProviderAdapter extends BaseAIAdapter {
  async generateText(_input: GenerateTextInput): Promise<GenerateTextResult> {
    throw new AIAdapterError(
      `${this.config.provider} adapter is not implemented yet. Add API key + provider adapter implementation.`,
      'PROVIDER_NOT_IMPLEMENTED',
    );
  }

  async *streamText(_input: GenerateTextInput): AsyncGenerator<StreamTextChunk> {
    throw new AIAdapterError(
      `${this.config.provider} adapter is not implemented yet. Add API key + provider adapter implementation.`,
      'PROVIDER_NOT_IMPLEMENTED',
    );
  }

  async healthCheck() {
    return {
      ok: false,
      provider: this.config.provider,
      message: `${this.config.provider} adapter is not implemented yet.`,
      metadata: { provider: this.config.provider },
    };
  }
}

export function getAIAdapter(
  provider: AIProvider = 'ollama',
  config: Omit<AdapterConfig, 'provider'> = {},
): BaseAIAdapter {
  switch (provider) {
    case 'ollama':
      return new OllamaAdapter(config);
    case 'openai':
      return new OpenAIAdapter(config);
    case 'anthropic':
      return new PlaceholderProviderAdapter({ provider, ...config });
    default:
      throw new AIAdapterError(`Unsupported AI provider: ${provider}`, 'UNSUPPORTED_PROVIDER');
  }
}

export { OllamaAdapter, OpenAIAdapter };
