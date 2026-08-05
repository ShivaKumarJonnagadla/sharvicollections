import { Router } from 'express';
import { z } from 'zod';
import { slugify } from '@sharvi/shared';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler, created, ok } from '../lib/http.js';
import { serializeCategory } from '../lib/serialize.js';
import { audit } from '../lib/audit.js';
import { validate, validated } from '../middleware/validate.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';

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

// ------------------------------ Admin -------------------------------------

const nameSchema = z.object({ name: z.string().min(2).max(80) });

/** (Admin) Create a category. */
router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate(nameSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { name } = validated<{ name: string }>(req);
    const slug = slugify(name);
    const existing = await prisma.category.findFirst({ where: { OR: [{ slug }, { name }] } });
    if (existing) throw AppError.conflict('A category with this name already exists');
    const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const category = await prisma.category.create({
      data: { name, slug, sortOrder: (max._max.sortOrder ?? 0) + 1 },
      include: { subcategories: true },
    });
    await audit(req, { action: 'category.create', userId: req.user!.sub, entity: 'Category', entityId: category.id });
    return created(res, serializeCategory(category));
  }),
);

/** (Admin) Delete a category (blocked if it still has products). */
router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const count = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (count > 0) {
      throw AppError.conflict(`Move or delete its ${count} product(s) before removing this category`);
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    await audit(req, { action: 'category.delete', userId: req.user!.sub, entity: 'Category', entityId: req.params.id });
    return ok(res, { deleted: true });
  }),
);

/** (Admin) Add a subcategory to a category. */
router.post(
  '/:id/subcategories',
  requireAuth,
  requireRole('ADMIN'),
  validate(nameSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { name } = validated<{ name: string }>(req);
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!category) throw AppError.notFound('Category not found');
    const slug = slugify(name);
    const dupe = await prisma.subcategory.findFirst({ where: { categoryId: category.id, slug } });
    if (dupe) throw AppError.conflict('A subcategory with this name already exists');
    const max = await prisma.subcategory.aggregate({
      where: { categoryId: category.id },
      _max: { sortOrder: true },
    });
    await prisma.subcategory.create({
      data: { name, slug, categoryId: category.id, sortOrder: (max._max.sortOrder ?? 0) + 1 },
    });
    const updated = await prisma.category.findUnique({
      where: { id: category.id },
      include: { subcategories: true },
    });
    await audit(req, { action: 'subcategory.create', userId: req.user!.sub, entity: 'Subcategory' });
    return created(res, serializeCategory(updated!));
  }),
);

/** (Admin) Delete a subcategory (products keep their category, subcategory nulled). */
router.delete(
  '/subcategories/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.subcategory.delete({ where: { id: req.params.id } });
    await audit(req, { action: 'subcategory.delete', userId: req.user!.sub, entity: 'Subcategory', entityId: req.params.id });
    return ok(res, { deleted: true });
  }),
);

export default router;
