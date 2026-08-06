import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine, ColorOption, ProductDTO } from '@sharvi/shared';

/** Unique key for a cart line — same product + colour stack together. */
export function lineKey(productId: string, color?: ColorOption | null): string {
  return `${productId}::${color?.en ?? ''}`;
}

interface CartState {
  items: CartLine[];
  add: (product: ProductDTO, quantity?: number, color?: ColorOption | null) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  subtotalMinor: () => number;
  count: () => number;
}

/** Cart state persisted to localStorage under `sc_cart` (survives reloads). */
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity = 1, color = null) =>
        set((state) => {
          const key = lineKey(product.id, color);
          const existing = state.items.find((i) => lineKey(i.productId, i.color) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                lineKey(i.productId, i.color) === key
                  ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
                  : i,
              ),
            };
          }
          const line: CartLine = {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            image: product.images[0]?.url ?? null,
            unitPriceMinor: product.priceMinor,
            quantity,
            color,
          };
          return { items: [...state.items, line] };
        }),
      remove: (key) =>
        set((state) => ({ items: state.items.filter((i) => lineKey(i.productId, i.color) !== key) })),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              lineKey(i.productId, i.color) === key
                ? { ...i, quantity: Math.max(0, Math.min(99, quantity)) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      subtotalMinor: () => get().items.reduce((sum, i) => sum + i.unitPriceMinor * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'sc_cart' },
  ),
);
