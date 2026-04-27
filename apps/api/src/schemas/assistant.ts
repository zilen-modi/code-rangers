import { z } from 'zod';

export const assistantChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1200, 'Message is too long'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export type AssistantChatInput = z.infer<typeof assistantChatSchema>;
