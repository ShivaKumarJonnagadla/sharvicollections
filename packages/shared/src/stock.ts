import type { ColorOption } from './constants.js';
import type { ProductDTO } from './types.js';

type StockProduct = Pick<ProductDTO, 'stock' | 'colors'>;

/** True when a product's inventory is tracked per colour. */
export function hasColorStock(product: StockProduct): boolean {
  return Array.isArray(product.colors) && product.colors.length > 0;
}

/** Stock for a specific colour (by English name). */
export function colorStock(product: StockProduct, colorEn?: string | null): number {
  if (!colorEn) return 0;
  const c = product.colors.find((x) => x.en.toLowerCase() === colorEn.toLowerCase());
  return c ? c.stock : 0;
}

/**
 * Total available units: sum of colour stocks when colours exist, otherwise the
 * product's single stock value.
 */
export function totalStock(product: StockProduct): number {
  if (hasColorStock(product)) {
    return product.colors.reduce((sum, c) => sum + (c.stock || 0), 0);
  }
  return product.stock;
}

/** Effective stock for the currently selected colour (or total when none). */
export function effectiveStock(product: StockProduct, color?: ColorOption | null): number {
  if (hasColorStock(product)) {
    return color ? colorStock(product, color.en) : totalStock(product);
  }
  return product.stock;
}
