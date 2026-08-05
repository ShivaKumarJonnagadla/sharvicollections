import { z } from 'zod';
import { PAYMENT_METHODS, PRODUCT_BADGES, PRODUCT_SORTS } from './constants.js';

/**
 * Zod schemas shared by frontend (React Hook Form) and backend (validation
 * middleware). One source of truth for request shapes.
 */

// Admin login accepts either an email address or the username "admin".
export const loginSchema = z.object({
  email: z.string().min(3, 'Enter your username or email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const productImageInputSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  alt: z.string().max(200).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const productCreateSchema = z.object({
  name: z.string().min(2).max(160),
  nameSv: z.string().max(160).nullable().optional(),
  description: z.string().max(5000).optional(),
  descriptionSv: z.string().max(5000).nullable().optional(),
  priceMinor: z.number().int().min(0),
  compareAtMinor: z.number().int().min(0).nullable().optional(),
  sku: z.string().max(64).optional(),
  stock: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  badge: z.enum(PRODUCT_BADGES).default('NONE'),
  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1).nullable().optional(),
  images: z.array(productImageInputSchema).max(10).default([]),
});
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const productQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  badge: z.enum(PRODUCT_BADGES).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(PRODUCT_SORTS).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Name is required').max(120),
  customerEmail: z.string().email('Enter a valid email'),
  customerPhone: z
    .string()
    .min(6, 'Enter a valid phone number')
    .max(20)
    .regex(/^[+0-9 ()-]+$/, 'Enter a valid phone number'),
  note: z.string().max(1000).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  items: z.array(checkoutItemSchema).min(1, 'Your cart is empty'),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const consentSchema = z.object({
  visitorId: z.string().min(8).max(64),
  necessary: z.literal(true),
  preferences: z.boolean().default(false),
  action: z.enum(['GRANTED', 'REVOKED', 'UPDATED']).default('GRANTED'),
});
export type ConsentInput = z.infer<typeof consentSchema>;
