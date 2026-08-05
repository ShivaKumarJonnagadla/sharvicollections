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
 * /uploads/library:
 *   get:
 *     tags: [Uploads]
 *     summary: (Admin) Media library — all product images
 */
router.get(
  '/library',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    const { prisma } = await import('../lib/prisma.js');
    const images = await prisma.productImage.findMany({
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return ok(
      res,
      images.map((i) => ({
        id: i.id,
        url: i.url,
        alt: i.alt,
        productName: i.product?.name ?? null,
        productSlug: i.product?.slug ?? null,
      })),
    );
  }),
);

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
