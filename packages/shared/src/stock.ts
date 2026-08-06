import type { ColorOption } from './constants.js';
import type { ProductDTO } from './types.js';

type StockProduct = Pick<ProductDTO, 'stock' | 'colors'>;

/**
 * A product tracks stock per colour only when it has colours AND every colour
 * carries a numeric stock. Otherwise colours are labels only and the single
 * `product.stock` applies (keeps older colour data working).
 */
export function usesColorStock(product: StockProduct): boolean {
  return (
    Array.isArray(product.colors) &&
    product.colors.length > 0 &&
    product.colors.every((c) => typeof c.stock === 'number')
  );
}

/** Stock for a specific colour (by English name). */
export function colorStock(product: StockProduct, colorEn?: string | null): number {
  if (!colorEn || !usesColorStock(product)) return product.stock;
  const c = product.colors.find((x) => x.en.toLowerCase() === colorEn.toLowerCase());
  return c && typeof c.stock === 'number' ? c.stock : 0;
}

/** Total available units across colours, or the single stock value. */
export function totalStock(product: StockProduct): number {
  if (usesColorStock(product)) {
    return product.colors.reduce((sum, c) => sum + (c.stock || 0), 0);
  }
  return product.stock;
}

/** Effective stock for the currently selected colour (or total when none). */
export function effectiveStock(product: StockProduct, color?: ColorOption | null): number {
  if (!usesColorStock(product)) return product.stock;
  return color ? colorStock(product, color.en) : totalStock(product);
}
