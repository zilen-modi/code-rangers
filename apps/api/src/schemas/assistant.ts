import { z } from 'zod';

export const assistantHistoryMessageSchema = z.object({
  role: z.enum(['assistant', 'user']),
  text: z.string().min(1).max(1200),
});

export const assistantChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1200, 'Message is too long'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  sessionId: z.string().min(1).max(120).optional(),
  history: z.array(assistantHistoryMessageSchema).max(20).optional(),
});

export type AssistantChatInput = z.infer<typeof assistantChatSchema>;
