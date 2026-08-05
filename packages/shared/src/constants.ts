/** Shared constants used across frontend and backend. */

export const CURRENCY = 'SEK' as const;
export const CURRENCY_SYMBOL = 'kr' as const;
export const DEFAULT_LOCALE = 'en' as const;
export const SUPPORTED_LOCALES = ['en', 'sv'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['CASH', 'SWISH'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PRODUCT_BADGES = ['NONE', 'NEW', 'TRENDING', 'SALE'] as const;
export type ProductBadge = (typeof PRODUCT_BADGES)[number];

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'alphabetical'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const CONSENT_POLICY_VERSION = '2026-01';

/** Merchant / business details (non-secret, safe to ship to the client). */
export const BUSINESS = {
  name: 'Sharvi Collections',
  tagline: 'Affordable Multicultural Jewelry for Every Moment',
  city: 'Älmhult',
  country: 'Sweden',
  phone: '0769609978',
  whatsapp: '+46769609978',
} as const;
