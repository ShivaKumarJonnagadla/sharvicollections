import { Router } from 'express';
import { asyncHandler, ok } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import { issueCsrfToken } from '../middleware/csrf.js';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import orderRoutes from './order.routes.js';
import uploadRoutes from './upload.routes.js';
import analyticsRoutes from './analytics.routes.js';
import consentRoutes from './consent.routes.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Liveness + DB connectivity probe
 */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    return ok(res, { status: 'ok', time: new Date().toISOString() });
  }),
);

/** Issue a CSRF token for the SPA to store and echo back on mutations. */
router.get('/csrf-token', (_req, res) => {
  const token = issueCsrfToken(res);
  return ok(res, { csrfToken: token });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/uploads', uploadRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/consent', consentRoutes);

export default router;
