import { getAIAdapter } from '../providers';

async function main() {
  const ai = getAIAdapter('ollama', {
    defaultModel: process.env.OLLAMA_MODEL,
    timeoutMs: 20_000,
    middleware: [
      {
        name: 'logger',
        before: ({ operation }) => console.info(`[ai-adapter] starting ${operation}`),
        after: ({ operation }) => console.info(`[ai-adapter] finished ${operation}`),
        onError: ({ operation, error }) => console.error(`[ai-adapter] failed ${operation}`, error),
      },
    ],
  });

  const health = await ai.healthCheck();
  console.info('Health check:', health);

  if (!health.ok) {
    console.info(
      'Ollama is unavailable. Start it and re-run `pnpm --filter @repo/ai-adapter dev:test`.',
    );
    return;
  }

  const response = await ai.generateText({
    prompt: 'Explain event-driven architecture in simple terms.',
    model: process.env.OLLAMA_MODEL,
    temperature: 0.2,
  });

  console.info('Non-stream response:\n', response.text);
  console.info('Streaming response:');

  for await (const chunk of ai.streamText({
    prompt: 'List 3 benefits of API versioning.',
    model: process.env.OLLAMA_MODEL,
    temperature: 0.2,
    stream: true,
  })) {
    process.stdout.write(chunk.text);
  }

  process.stdout.write('\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
