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

/** Statuses at which a customer may still self-cancel their order. */
export const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'] as const;
export function isCancellable(status: string): boolean {
  return (CANCELLABLE_STATUSES as readonly string[]).includes(status);
}

export const PAYMENT_STATUSES = ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_SOURCES = ['WEB', 'WHATSAPP', 'MANUAL'] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

/** A colour option a customer can select for a product. */
export interface ColorOption {
  en: string;
  sv: string;
}
export function colorLabel(option: ColorOption, locale: Locale): string {
  return locale === 'sv' && option.sv ? option.sv : option.en;
}

export const PRODUCT_BADGES = ['NONE', 'NEW', 'TRENDING', 'SALE'] as const;
export type ProductBadge = (typeof PRODUCT_BADGES)[number];

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'alphabetical'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const CONSENT_POLICY_VERSION = '2026-01';

/** Flat shipping fee (in minor units / öre) applied when shipping is required. */
export const SHIPPING_COST_MINOR = 4900; // 49 kr

/** At or below this stock level, show a "low stock" indicator. */
export const LOW_STOCK_THRESHOLD = 5;

/** Merchant / business details (non-secret, safe to ship to the client). */
export const BUSINESS = {
  name: 'Sharvi Collections',
  tagline: 'Affordable Multicultural Jewelry for Every Moment',
  city: 'Älmhult',
  country: 'Sweden',
  phone: '0769609978',
  whatsapp: '+46769609978',
} as const;
