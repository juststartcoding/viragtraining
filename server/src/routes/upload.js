import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';
import { HttpError } from '../utils/helpers.js';

export const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf' }; // SVG excluded: it can carry scripts

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED[file.mimetype] ? cb(null, true) : cb(new HttpError(400, 'Only JPG, PNG, WEBP, GIF images or PDF files are allowed')),
});

const router = Router();
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'No file uploaded');
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

export default router;
