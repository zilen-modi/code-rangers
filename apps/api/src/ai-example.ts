import { getAIAdapter } from '@repo/ai-adapter';

export async function runAIExample() {
  const ai = getAIAdapter('ollama', {
    defaultModel: process.env.OLLAMA_MODEL,
    timeoutMs: 20_000,
  });

  const response = await ai.generateText({
    prompt: 'Explain microservices in simple terms',
    model: process.env.OLLAMA_MODEL,
    temperature: 0.3,
  });

  console.info('response:', response.text);

  for await (const chunk of ai.streamText({
    prompt: 'Give me 3 practical API security tips.',
    model: process.env.OLLAMA_MODEL,
    stream: true,
  })) {
    process.stdout.write(chunk.text);
  }

  process.stdout.write('\n');
}
