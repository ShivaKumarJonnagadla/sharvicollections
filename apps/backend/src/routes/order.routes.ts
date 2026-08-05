import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { checkoutSchema, type CheckoutInput } from '@sharvi/shared';
import { prisma } from '../lib/prisma.js';
import { AppError, asyncHandler, created, ok } from '../lib/http.js';
import { serializeOrder } from '../lib/serialize.js';
import { audit } from '../lib/audit.js';
import { sendOrderConfirmation } from '../lib/email.js';
import { getStoreSettings } from '../lib/settings.js';
import { validate, validated } from '../middleware/validate.js';
import { orderLimiter } from '../middleware/rateLimit.js';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Generate the next order number like SC-2026-0001 using a monotonic per-year
 * counter. The next value is max(counter + 1, highest existing order + 1), so it
 * never collides — neither with a still-present older order, nor after deletes.
 */
async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const key = `order-${year}`;

  const [counter, latest] = await Promise.all([
    tx.counter.findUnique({ where: { key } }),
    tx.order.findFirst({
      where: { orderNumber: { startsWith: `SC-${year}-` } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    }),
  ]);

  const maxExisting = latest ? Number(latest.orderNumber.split('-').pop()) || 0 : 0;
  const nextVal = Math.max((counter?.value ?? 0) + 1, maxExisting + 1);

  await tx.counter.upsert({
    where: { key },
    create: { key, value: nextVal },
    update: { value: nextVal },
  });

  return `SC-${year}-${String(nextVal).padStart(4, '0')}`;
}

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order (prices are re-derived server-side from the DB)
 */
router.post(
  '/',
  orderLimiter,
  validate(checkoutSchema),
  asyncHandler(async (req, res) => {
    const input = validated<CheckoutInput>(req);
    const storeSettings = await getStoreSettings();
    const shippingCostMinor = storeSettings.shippingCostKr * 100;

    const order = await prisma.$transaction(async (tx) => {
      // Re-fetch products server-side; never trust client prices.
      const productIds = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isPublished: true },
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      const lineItems = input.items.map((item) => {
        const product = byId.get(item.productId);
        if (!product) throw AppError.badRequest(`Product unavailable: ${item.productId}`);
        const unit = product.priceMinor;
        return {
          productId: product.id,
          productName: product.name,
          productImage: product.images[0]?.url ?? null,
          unitPriceMinor: unit,
          quantity: item.quantity,
          lineTotalMinor: unit * item.quantity,
        };
      });

      const subtotal = lineItems.reduce((sum, l) => sum + l.lineTotalMinor, 0);
      const shippingCost = input.shippingRequired ? shippingCostMinor : 0;
      const orderNumber = await nextOrderNumber(tx);

      return tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          note: input.note,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === 'SWISH' ? 'PENDING' : 'UNPAID',
          // Swish reference doubles as the order number for reconciliation.
          paymentRef: input.paymentMethod === 'SWISH' ? orderNumber : null,
          shippingRequired: input.shippingRequired,
          shippingAddress: input.shippingRequired ? input.shippingAddress : null,
          shippingCity: input.shippingRequired ? input.shippingCity : null,
          shippingCounty: input.shippingRequired ? input.shippingCounty : null,
          shippingPostalCode: input.shippingRequired ? input.shippingPostalCode : null,
          shippingCountry: input.shippingRequired ? (input.shippingCountry ?? 'Sweden') : null,
          shippingCostMinor: shippingCost,
          subtotalMinor: subtotal,
          totalMinor: subtotal + shippingCost,
          items: { create: lineItems },
        },
        include: { items: true },
      });
    });

    await audit(req, {
      action: 'order.create',
      entity: 'Order',
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, total: order.totalMinor },
    });

    const dto = serializeOrder(order);
    // Fire-and-forget confirmation email (never blocks the response).
    void sendOrderConfirmation(dto);

    return created(res, dto);
  }),
);

/**
 * @openapi
 * /orders/{orderNumber}:
 *   get:
 *     tags: [Orders]
 *     summary: Public order confirmation lookup by order number
 */
router.get(
  '/:orderNumber',
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: true },
    });
    if (!order) throw AppError.notFound('Order not found');
    return ok(res, serializeOrder(order));
  }),
);

// ---------------------------- Admin ---------------------------------------

/**
 * @openapi
 * /orders/admin/list:
 *   get:
 *     tags: [Orders]
 *     summary: (Admin) List orders
 */
router.get(
  '/admin/list',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(60, Math.max(1, Number(req.query.pageSize) || 20));
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const where = status ? { status: status as never } : {};
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);
    return ok(res, {
      items: items.map(serializeOrder),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }),
);

router.patch(
  '/admin/:id/status',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { status, paymentStatus } = req.body ?? {};
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
      include: { items: true },
    });
    await audit(req, {
      action: 'order.update_status',
      userId: req.user!.sub,
      entity: 'Order',
      entityId: order.id,
      metadata: { status, paymentStatus },
    });
    return ok(res, serializeOrder(order));
  }),
);

/**
 * @openapi
 * /orders/admin/{id}:
 *   delete:
 *     tags: [Orders]
 *     summary: (Admin) Permanently delete an order (cascades order items)
 */
router.delete(
  '/admin/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw AppError.notFound('Order not found');
    await prisma.order.delete({ where: { id: order.id } }); // OrderItems cascade
    await audit(req, {
      action: 'order.delete',
      userId: req.user!.sub,
      entity: 'Order',
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber },
    });
    return ok(res, { deleted: true });
  }),
);

export default router;
