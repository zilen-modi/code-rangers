import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  completed: z.boolean().optional(),
});

// ─── Translation Schemas ───────────────────────────────────────────────

export const translateSchema = z.object({
  inputLanguage: z.string().min(1, 'Input language is required (e.g., "English", "Hindi", "es")'),
  responseLanguage: z.string().min(1, 'Response language is required (e.g., "French", "Japanese", "de")'),
  text: z.string().optional(),
  requestId: z.string().optional(),
});
