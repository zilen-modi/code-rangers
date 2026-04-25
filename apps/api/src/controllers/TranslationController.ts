import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { translateSchema } from '../schemas/index';
import { TranslationService } from '../services/TranslationService';

const translationService = new TranslationService();

/**
 * POST /translate
 *
 * Accepts multipart/form-data with:
 *   - inputLanguage (string, required)
 *   - responseLanguage (string, required)
 *   - requestId (string, optional — auto-generated if not provided)
 *   - text (string, optional — for text translation)
 *   - image (file, optional — for image-based translation)
 *   - voice (file, optional — for voice-based translation)
 *
 * Exactly ONE of text/image/voice must be provided for a fresh request.
 * For retry: send only requestId + inputLanguage + responseLanguage (no text/file)
 * and the service will re-read the previously uploaded file.
 */
export const translate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inputLanguage, responseLanguage, text } = req.body;
    const requestId = (req.body.requestId as string) || uuidv4();

    // Validate required fields
    const parsed = translateSchema.safeParse({
      inputLanguage,
      responseLanguage,
      text,
      requestId,
    });

    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.errors,
      });
      return;
    }

    // Determine which files were uploaded
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const imageFile = files?.image?.[0];
    const voiceFile = files?.voice?.[0];

    // If multiple input types provided at once, reject
    const fileInputCount = [imageFile, voiceFile].filter(Boolean).length;
    if (fileInputCount > 1) {
      res.status(400).json({
        message: 'Multiple file inputs provided. Please provide only one of: image or voice.',
        requestId,
      });
      return;
    }
    if (text && fileInputCount > 0) {
      res.status(400).json({
        message: 'Both text and file provided. Please provide only one input type.',
        requestId,
      });
      return;
    }

    // Call the service — handles both fresh requests AND retries (via requestId file lookup)
    const result = await translationService.translate({
      requestId,
      inputLanguage: parsed.data.inputLanguage,
      responseLanguage: parsed.data.responseLanguage,
      text: parsed.data.text,
      imagePath: imageFile?.path,
      voicePath: voiceFile?.path,
    });

    res.status(200).json({
      message: 'Translation successful',
      data: result,
    });
  } catch (error: any) {
    console.error('[TranslationController] Translation failed:', error);
    res.status(500).json({
      message: 'Translation failed',
      error: error.message || String(error),
      requestId: req.body?.requestId,
    });
  }
};
