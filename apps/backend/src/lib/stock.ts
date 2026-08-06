import type { Prisma } from '@prisma/client';
import type { ColorOption } from '@sharvi/shared';
import { AppError } from './http.js';

export interface StockProduct {
  id: string;
  name: string;
  stock: number;
  colors: Prisma.JsonValue;
}

function getColors(product: StockProduct): ColorOption[] {
  return Array.isArray(product.colors) ? (product.colors as unknown as ColorOption[]) : [];
}

/** Available units for a product (per-colour when colours exist). */
export function availableStock(product: StockProduct, colorEn?: string | null): number {
  const colors = getColors(product);
  if (colors.length === 0) return product.stock;
  if (!colorEn) return colors.reduce((s, c) => s + (c.stock || 0), 0);
  const c = colors.find((x) => x.en.toLowerCase() === colorEn.toLowerCase());
  return c ? c.stock || 0 : 0;
}

/** Throw if there isn't enough stock (per colour when applicable). */
export function assertStock(product: StockProduct, colorEn: string | null | undefined, qty: number) {
  const colors = getColors(product);
  if (colors.length > 0 && !colorEn) {
    throw AppError.badRequest(`Please select a colour for "${product.name}"`);
  }
  const avail = availableStock(product, colorEn);
  const suffix = colorEn ? ` (${colorEn})` : '';
  if (avail < qty) {
    throw AppError.conflict(
      avail <= 0
        ? `"${product.name}"${suffix} is out of stock`
        : `Only ${avail} left of "${product.name}"${suffix}`,
    );
  }
}

/**
 * Adjust stock by `delta` (negative to consume, positive to restore). Updates the
 * matching colour's stock in the JSON, or the product's single stock field.
 */
export async function adjustStock(
  tx: Prisma.TransactionClient,
  product: StockProduct,
  colorEn: string | null | undefined,
  delta: number,
): Promise<void> {
  const colors = getColors(product);
  if (colors.length > 0 && colorEn) {
    const idx = colors.findIndex((c) => c.en.toLowerCase() === colorEn.toLowerCase());
    if (idx >= 0) {
      colors[idx].stock = Math.max(0, (colors[idx].stock || 0) + delta);
      await tx.product.update({
        where: { id: product.id },
        data: { colors: colors as unknown as Prisma.InputJsonValue },
      });
      return;
    }
  }
  await tx.product.update({
    where: { id: product.id },
    data: { stock: { increment: delta } },
  });
}
