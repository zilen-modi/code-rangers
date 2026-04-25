import { Router, Request, Response, NextFunction } from 'express';
import { translationUpload } from '../middleware/upload';
import * as MenuController from '../controllers/MenuController';

const router = Router();

const handleUpload = (req: Request, res: Response, next: NextFunction): void => {
  translationUpload(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ message: 'File too large. Maximum size is 25MB.' });
        return;
      }
      res.status(400).json({ message: err.message || 'File upload error.' });
      return;
    }
    next();
  });
};

router.post('/analyze', handleUpload, MenuController.analyzeMenu);

export default router;
