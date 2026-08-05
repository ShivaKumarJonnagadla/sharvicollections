import type { Locale } from './constants.js';
import type { ProductDTO } from './types.js';

/** Pick the Swedish value when locale is sv and it exists, else fall back to English. */
export function pickLocale(en: string, sv: string | null | undefined, locale: Locale): string {
  return locale === 'sv' && sv ? sv : en;
}

/** Localised product name / description helpers. */
export function productName(p: Pick<ProductDTO, 'name' | 'nameSv'>, locale: Locale): string {
  return pickLocale(p.name, p.nameSv, locale);
}

export function productDescription(
  p: Pick<ProductDTO, 'description' | 'descriptionSv'>,
  locale: Locale,
): string | null {
  if (locale === 'sv' && p.descriptionSv) return p.descriptionSv;
  return p.description;
}
