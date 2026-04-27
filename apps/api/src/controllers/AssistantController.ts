import { Request, Response } from 'express';
import { assistantChatSchema } from '../schemas/assistant';
import { AssistantService } from '../services/AssistantService';

const assistantService = new AssistantService();

export const chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = assistantChatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors,
      });
      return;
    }

    const result = await assistantService.chat(parsed.data);
    res.status(200).json({
      message: 'Assistant response generated',
      data: result,
    });
  } catch (error: any) {
    console.error('[AssistantController] Chat failed:', error);
    res.status(500).json({
      message: 'Assistant chat failed',
      error: error?.message || String(error),
    });
  }
};
