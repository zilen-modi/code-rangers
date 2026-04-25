import { Router, Request, Response, NextFunction } from 'express';
import { translationUpload } from '../middleware/upload';
import * as TranslationController from '../controllers/TranslationController';

const router = Router();

/**
 * Wraps multer upload middleware to catch multer-specific errors and return proper JSON responses.
 */
const handleUpload = (req: Request, res: Response, next: NextFunction): void => {
  translationUpload(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ message: 'File too large. Maximum size is 25MB.' });
        return;
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({ message: 'Unexpected file field. Use "image" or "voice".' });
        return;
      }
      res.status(400).json({ message: err.message || 'File upload error.' });
      return;
    }
    next();
  });
};

// POST /translate — Handles both fresh translations and retries
router.post('/', handleUpload, TranslationController.translate);

export default router;
