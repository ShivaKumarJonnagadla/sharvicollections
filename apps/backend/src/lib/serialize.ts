import type { Prisma } from '@prisma/client';
import type { CategoryDTO, OrderDTO, ProductDTO } from '@sharvi/shared';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { category: true; subcategory: true; images: true };
}>;

export function serializeProduct(p: ProductWithRelations): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    nameSv: p.nameSv,
    slug: p.slug,
    description: p.description,
    descriptionSv: p.descriptionSv,
    priceMinor: p.priceMinor,
    compareAtMinor: p.compareAtMinor,
    currency: p.currency,
    stock: p.stock,
    badge: p.badge,
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    viewCount: p.viewCount,
    category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
    subcategory: p.subcategory
      ? { id: p.subcategory.id, name: p.subcategory.name, slug: p.subcategory.slug }
      : null,
    images: [...p.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        width: img.width,
        height: img.height,
        sortOrder: img.sortOrder,
      })),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

type CategoryWithSubs = Prisma.CategoryGetPayload<{ include: { subcategories: true } }>;

export function serializeCategory(c: CategoryWithSubs): CategoryDTO {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    sortOrder: c.sortOrder,
    subcategories: [...c.subcategories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ id: s.id, name: s.name, slug: s.slug, sortOrder: s.sortOrder })),
  };
}

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

export function serializeOrder(o: OrderWithItems): OrderDTO {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    note: o.note,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    paymentRef: o.paymentRef,
    subtotalMinor: o.subtotalMinor,
    totalMinor: o.totalMinor,
    currency: o.currency,
    items: o.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.productName,
      productImage: it.productImage,
      unitPriceMinor: it.unitPriceMinor,
      quantity: it.quantity,
      lineTotalMinor: it.lineTotalMinor,
    })),
    createdAt: o.createdAt.toISOString(),
  };
}
