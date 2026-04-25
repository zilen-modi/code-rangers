import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MenuService } from '../services/MenuService';

// Add multer import manually to ensure the Express.Multer namespace merges
import 'multer';

const menuService = new MenuService();

/**
 * POST /menu/analyze
 *
 * Accepts multipart/form-data with:
 *   - image (file, required — the food menu photo)
 */
export const analyzeMenu = async (req: Request, res: Response): Promise<void> => {
  const requestId = uuidv4();

  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const imageFile = files?.image?.[0];

    if (!imageFile) {
      res.status(400).json({
        message: 'No image provided. Please provide an image file of the menu in the "image" field.',
        requestId,
      });
      return;
    }

    const result = await menuService.analyzeMenu({
      requestId,
      imagePath: imageFile.path,
    });

    res.status(200).json({
      message: 'Menu analysis successful',
      data: result,
    });
  } catch (error: any) {
    console.error('[MenuController] Menu analysis failed:', error);
    res.status(500).json({
      message: 'Menu analysis failed',
      error: error.message || String(error),
      requestId,
    });
  }
};
