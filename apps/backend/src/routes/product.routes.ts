import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import {
  productCreateSchema,
  productQuerySchema,
  productUpdateSchema,
  slugify,
  type ProductCreateInput,
  type ProductQuery,
  type ProductUpdateInput,
} from '@sharvi/shared';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler, created, ok } from '../lib/http.js';
import { serializeProduct } from '../lib/serialize.js';
import { audit } from '../lib/audit.js';
import { deleteAsset } from '../lib/cloudinary.js';
import { validate, validated } from '../middleware/validate.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

const includeRelations = {
  category: true,
  subcategory: true,
  images: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.ProductInclude;

/** Build a unique slug from a name, appending a suffix on collision. */
async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  // Loop until we find a slug not used by a different product.
  // Small catalogue => cheap; index on slug keeps this fast.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${++n}`;
  }
}

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List published products with search, filters, sort & pagination
 */
router.get(
  '/',
  validate(productQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = validated<ProductQuery>(req, 'query');

    const where: Prisma.ProductWhereInput = {
      isPublished: true, // hidden products never appear on the storefront
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: 'insensitive' } },
              { description: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(q.category ? { category: { slug: q.category } } : {}),
      ...(q.subcategory ? { subcategory: { slug: q.subcategory } } : {}),
      ...(q.badge ? { badge: q.badge } : {}),
      ...(q.minPrice != null || q.maxPrice != null
        ? { priceMinor: { gte: q.minPrice ?? undefined, lte: q.maxPrice ?? undefined } }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      q.sort === 'price_asc'
        ? { priceMinor: 'asc' }
        : q.sort === 'price_desc'
          ? { priceMinor: 'desc' }
          : q.sort === 'alphabetical'
            ? { name: 'asc' }
            : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: includeRelations,
        orderBy,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return ok(res, {
      items: items.map(serializeProduct),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    });
  }),
);

/**
 * @openapi
 * /products/featured:
 *   get:
 *     tags: [Products]
 *     summary: Homepage rails — featured, new arrivals, trending
 */
router.get(
  '/featured',
  asyncHandler(async (_req, res) => {
    const base = { isPublished: true } as const;
    const [featured, newArrivals, trending] = await Promise.all([
      prisma.product.findMany({
        where: { ...base, isFeatured: true },
        include: includeRelations,
        take: 8,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.product.findMany({
        where: base,
        include: includeRelations,
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        where: { ...base, badge: 'TRENDING' },
        include: includeRelations,
        take: 8,
        orderBy: { viewCount: 'desc' },
      }),
    ]);
    return ok(res, {
      featured: featured.map(serializeProduct),
      newArrivals: newArrivals.map(serializeProduct),
      trending: trending.map(serializeProduct),
    });
  }),
);

/**
 * @openapi
 * /products/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Get a single published product by slug (increments view count)
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isPublished: true },
      include: includeRelations,
    });
    if (!product) throw AppError.notFound('Product not found');

    // Fire-and-forget view count increment.
    prisma.product
      .update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);

    const related = await prisma.product.findMany({
      where: {
        isPublished: true,
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      include: includeRelations,
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    return ok(res, {
      product: serializeProduct(product),
      related: related.map(serializeProduct),
    });
  }),
);

// ---------------------------- Admin CRUD ----------------------------------

/**
 * @openapi
 * /products/admin/all:
 *   get:
 *     tags: [Products]
 *     summary: (Admin) List all products including hidden ones
 */
router.get(
  '/admin/all',
  requireAuth,
  requireRole('ADMIN'),
  validate(productQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = validated<ProductQuery>(req, 'query');
    const where: Prisma.ProductWhereInput = {
      ...(q.q ? { name: { contains: q.q, mode: 'insensitive' } } : {}),
      ...(q.category ? { category: { slug: q.category } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: includeRelations,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    return ok(res, {
      items: items.map(serializeProduct),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    });
  }),
);

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate(productCreateSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = validated<ProductCreateInput>(req);
    const slug = await uniqueSlug(input.name);
    const product = await prisma.product.create({
      data: {
        name: input.name,
        nameSv: input.nameSv ?? null,
        slug,
        description: input.description,
        descriptionSv: input.descriptionSv ?? null,
        priceMinor: input.priceMinor,
        compareAtMinor: input.compareAtMinor ?? null,
        sku: input.sku,
        stock: input.stock,
        isPublished: input.isPublished,
        isFeatured: input.isFeatured,
        badge: input.badge,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId ?? null,
        images: {
          create: input.images.map((img, i) => ({
            url: img.url,
            publicId: img.publicId,
            alt: img.alt ?? input.name,
            width: img.width,
            height: img.height,
            sortOrder: img.sortOrder ?? i,
          })),
        },
      },
      include: includeRelations,
    });
    await audit(req, {
      action: 'product.create',
      userId: req.user!.sub,
      entity: 'Product',
      entityId: product.id,
    });
    return created(res, serializeProduct(product));
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(productUpdateSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = validated<ProductUpdateInput>(req);
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw AppError.notFound('Product not found');

    const data: Prisma.ProductUpdateInput = {
      name: input.name,
      nameSv: input.nameSv,
      description: input.description,
      descriptionSv: input.descriptionSv,
      priceMinor: input.priceMinor,
      compareAtMinor: input.compareAtMinor,
      sku: input.sku,
      stock: input.stock,
      isPublished: input.isPublished,
      isFeatured: input.isFeatured,
      badge: input.badge,
      ...(input.name ? { slug: await uniqueSlug(input.name, existing.id) } : {}),
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      ...(input.subcategoryId !== undefined
        ? input.subcategoryId
          ? { subcategory: { connect: { id: input.subcategoryId } } }
          : { subcategory: { disconnect: true } }
        : {}),
    };

    // If images are provided, replace the set (reordering supported via sortOrder).
    if (input.images) {
      await prisma.productImage.deleteMany({ where: { productId: existing.id } });
      data.images = {
        create: input.images.map((img, i) => ({
          url: img.url,
          publicId: img.publicId,
          alt: img.alt ?? existing.name,
          width: img.width,
          height: img.height,
          sortOrder: img.sortOrder ?? i,
        })),
      };
    }

    const product = await prisma.product.update({
      where: { id: existing.id },
      data,
      include: includeRelations,
    });
    await audit(req, {
      action: 'product.update',
      userId: req.user!.sub,
      entity: 'Product',
      entityId: product.id,
    });
    return ok(res, serializeProduct(product));
  }),
);

/** Toggle visibility (hide/show) without a full update. */
router.patch(
  '/:id/visibility',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const isPublished = Boolean(req.body?.isPublished);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isPublished },
      include: includeRelations,
    });
    await audit(req, {
      action: isPublished ? 'product.show' : 'product.hide',
      userId: req.user!.sub,
      entity: 'Product',
      entityId: product.id,
    });
    return ok(res, serializeProduct(product));
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });
    if (!product) throw AppError.notFound('Product not found');

    // Best-effort remove Cloudinary assets, then delete the record.
    await Promise.allSettled(product.images.map((img) => deleteAsset(img.publicId)));
    await prisma.product.delete({ where: { id: product.id } });
    await audit(req, {
      action: 'product.delete',
      userId: req.user!.sub,
      entity: 'Product',
      entityId: product.id,
    });
    return ok(res, { deleted: true });
  }),
);

export default router;
