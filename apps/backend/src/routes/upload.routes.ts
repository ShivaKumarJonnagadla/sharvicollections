import { Router } from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError, asyncHandler, ok } from '../lib/http.js';
import { signUpload, uploadBuffer } from '../lib/cloudinary.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';
import { audit } from '../lib/audit.js';

const router = Router();

// In-memory storage; we stream buffers straight to Cloudinary (serverless-safe).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 }, // 8MB per file, 10 files
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|avif)$/.test(file.mimetype)) cb(null, true);
    else cb(new AppError(400, 'BAD_FILE', 'Only JPG, PNG, WEBP or AVIF images are allowed'));
  },
});

function ensureConfigured() {
  if (!env.cloudinaryConfigured) {
    throw new AppError(503, 'CLOUDINARY_OFF', 'Image uploads are not configured');
  }
}

/**
 * @openapi
 * /uploads/sign:
 *   get:
 *     tags: [Uploads]
 *     summary: (Admin) Get a Cloudinary signed-upload signature for direct browser upload
 */
router.get(
  '/sign',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    ensureConfigured();
    return ok(res, signUpload({}));
  }),
);

/**
 * @openapi
 * /uploads:
 *   post:
 *     tags: [Uploads]
 *     summary: (Admin) Server-side multi-image upload (drag & drop / bulk)
 */
router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  upload.array('images', 10),
  asyncHandler(async (req: AuthedRequest, res) => {
    ensureConfigured();
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) throw AppError.badRequest('No files uploaded');

    const results = await Promise.all(
      files.map((file) => uploadBuffer(file.buffer)),
    );
    await audit(req, {
      action: 'media.upload',
      userId: req.user!.sub,
      metadata: { count: results.length },
    });
    return ok(res, { images: results });
  }),
);

export default router;
