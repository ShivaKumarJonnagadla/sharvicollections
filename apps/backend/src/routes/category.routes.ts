import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, ok } from '../lib/http.js';
import { serializeCategory } from '../lib/serialize.js';

const router = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Full category + subcategory taxonomy (storefront navigation)
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { subcategories: { where: { isActive: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return ok(res, categories.map(serializeCategory));
  }),
);

export default router;
