import { SUPPORTED_LOCALES, type Locale } from './constants.js';

/**
 * Money is stored everywhere in minor units (öre). 349 kr => 34900.
 * These helpers convert and format consistently as SEK — never as $.
 */

export function toMinor(krValue: number): number {
  return Math.round(krValue * 100);
}

export function toMajor(minor: number): number {
  return minor / 100;
}

/**
 * Format an amount (in minor units) as Swedish kronor, e.g. "349 kr".
 * Uses Intl for correct thousands separators per locale.
 */
export function formatSEK(minor: number, locale: Locale = 'sv'): string {
  const value = toMajor(minor);
  const intlLocale = locale === 'sv' ? 'sv-SE' : 'en-SE';
  const formatted = new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} kr`;
}

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Discount percentage when a compare-at price is higher than the price. */
export function discountPercent(
  priceMinor: number,
  compareAtMinor: number | null | undefined,
): number | null {
  if (!compareAtMinor || compareAtMinor <= priceMinor) return null;
  return Math.round((1 - priceMinor / compareAtMinor) * 100);
}
