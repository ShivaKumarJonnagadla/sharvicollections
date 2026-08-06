import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS, PRODUCT_BADGES, PRODUCT_SORTS } from './constants.js';

export const colorOptionSchema = z.object({
  en: z.string().min(1).max(40),
  sv: z.string().max(40).default(''),
  stock: z.coerce.number().int().min(0).default(0),
});

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
  color: z.string().max(60).nullable().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const productCreateSchema = z.object({
  name: z.string().min(2).max(160),
  nameSv: z.string().max(160).nullable().optional(),
  articleId: z
    .string()
    .regex(/^\d{4,6}$/, 'Article ID must be 4–6 digits')
    .nullable()
    .optional(),
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
  colors: z.array(colorOptionSchema).max(20).default([]),
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
  color: z.string().max(40).nullable().optional(), // selected colour (English canonical)
});

const checkoutObject = z.object({
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
  // Shipping (address required only when shippingRequired is true).
  shippingRequired: z.boolean().default(false),
  shippingAddress: z.string().max(200).optional(),
  shippingCity: z.string().max(100).optional(),
  shippingCounty: z.string().max(100).optional(),
  shippingPostalCode: z.string().max(20).optional(),
  shippingCountry: z.string().max(100).optional(),
});

/** Shared refinement: require the address fields when shipping is on. */
function shippingRefine(
  val: { shippingRequired?: boolean } & Record<string, unknown>,
  ctx: z.RefinementCtx,
) {
  if (!val.shippingRequired) return;
  const required: [string, string][] = [
    ['shippingAddress', 'Address is required'],
    ['shippingCity', 'City is required'],
    ['shippingPostalCode', 'Postal code is required'],
    ['shippingCountry', 'Country is required'],
  ];
  for (const [field, message] of required) {
    if (!String(val[field] ?? '').trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
    }
  }
}

/** Full checkout payload (backend). */
export const checkoutSchema = checkoutObject.superRefine(shippingRefine);
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Checkout form (frontend) — items come from the cart, so they're omitted here. */
export const checkoutFormSchema = checkoutObject.omit({ items: true }).superRefine(shippingRefine);
export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;

/** Admin manual order (e.g. taken over WhatsApp/phone). */
export const adminOrderCreateSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().min(3).max(20),
  note: z.string().max(1000).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default('CASH'),
  status: z.enum(ORDER_STATUSES).default('CONFIRMED'),
  source: z.enum(['WHATSAPP', 'MANUAL']).default('WHATSAPP'),
  shippingRequired: z.boolean().default(false),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        color: z.string().max(40).nullable().optional(),
      }),
    )
    .min(1, 'Add at least one item'),
});
export type AdminOrderCreateInput = z.infer<typeof adminOrderCreateSchema>;

export const cancelOrderSchema = z.object({
  email: z.string().email('Enter the email used for the order'),
  reason: z.string().min(3, 'Please tell us why').max(500),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export const consentSchema = z.object({
  visitorId: z.string().min(8).max(64),
  necessary: z.literal(true),
  preferences: z.boolean().default(false),
  action: z.enum(['GRANTED', 'REVOKED', 'UPDATED']).default('GRANTED'),
});
export type ConsentInput = z.infer<typeof consentSchema>;
