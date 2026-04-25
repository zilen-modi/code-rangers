import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Multer disk storage that stores files keyed by requestId.
 * This allows retry requests to re-read the same file using the original requestId.
 */
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, _file, cb) {
    // Use the requestId from the body/query if provided, otherwise generate a new one
    const requestId = (req.body?.requestId as string) || (req.query?.requestId as string) || uuidv4();
    const ext = path.extname(_file.originalname) || '';
    const filename = `${requestId}_${_file.fieldname}${ext}`;
    cb(null, filename);
  },
});

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const ALLOWED_VOICE_MIMES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/flac',
  'audio/x-m4a',
  'audio/mp3',
];

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.fieldname === 'image' && ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.fieldname === 'voice' && ALLOWED_VOICE_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype} for field ${file.fieldname}`));
  }
};

/**
 * Multer middleware for translation endpoint.
 * Accepts optional 'image' or 'voice' file fields (max 1 file each).
 */
export const translationUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'voice', maxCount: 1 },
]);

export { UPLOAD_DIR };
