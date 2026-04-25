import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Code Rangers'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  throw new Error('Invalid environment variables configuration.');
}

export const env = parsed.data;
