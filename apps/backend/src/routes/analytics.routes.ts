import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, ok } from '../lib/http.js';
import { serializeProduct } from '../lib/serialize.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const includeRelations = { category: true, subcategory: true, images: true } as const;

/**
 * @openapi
 * /analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: (Admin) Dashboard KPIs, charts and top lists
 */
router.get(
  '/dashboard',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfYear = new Date(`${now.getFullYear()}-01-01T00:00:00Z`);

    const [
      revenueAgg,
      orderCount,
      productCount,
      customerCount,
      recentOrders,
      topProducts,
      ordersThisYear,
      categoryCounts,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalMinor: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.order.count(),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.order
        .findMany({ distinct: ['customerEmail'], select: { customerEmail: true } })
        .then((rows) => rows.length),
      prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isPublished: true },
        include: includeRelations,
        orderBy: { viewCount: 'desc' },
        take: 6,
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfYear } },
        select: { createdAt: true, totalMinor: true, paymentStatus: true },
      }),
      prisma.product.groupBy({
        by: ['categoryId'],
        _count: { _all: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 6,
      }),
    ]);

    // Build 12-month orders + revenue series.
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: new Date(now.getFullYear(), i, 1).toLocaleString('en', { month: 'short' }),
      orders: 0,
      revenueMinor: 0,
    }));
    for (const o of ordersThisYear) {
      const m = o.createdAt.getMonth();
      months[m].orders += 1;
      if (o.paymentStatus === 'PAID') months[m].revenueMinor += o.totalMinor;
    }

    // Resolve category names for the popular-category chart.
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryCounts.map((c) => c.categoryId) } },
      select: { id: true, name: true },
    });
    const catName = new Map(categories.map((c) => [c.id, c.name]));
    const popularCategories = categoryCounts.map((c) => ({
      category: catName.get(c.categoryId) ?? 'Unknown',
      count: c._count._all,
    }));

    // Top customers by number of orders + spend.
    const customerGroups = await prisma.order.groupBy({
      by: ['customerEmail', 'customerName'],
      _count: { _all: true },
      _sum: { totalMinor: true },
      orderBy: { _sum: { totalMinor: 'desc' } },
      take: 6,
    });

    return ok(res, {
      cards: {
        revenueMinor: revenueAgg._sum.totalMinor ?? 0,
        orders: orderCount,
        products: productCount,
        customers: customerCount,
      },
      salesTrend: months,
      popularCategories,
      popularProducts: topProducts.map(serializeProduct),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        totalMinor: o.totalMinor,
        status: o.status,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
      })),
      topCustomers: customerGroups.map((c) => ({
        name: c.customerName,
        email: c.customerEmail,
        orders: c._count._all,
        spentMinor: c._sum.totalMinor ?? 0,
      })),
    });
  }),
);

export default router;
