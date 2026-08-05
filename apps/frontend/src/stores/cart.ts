import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine, ProductDTO } from '@sharvi/shared';

interface CartState {
  items: CartLine[];
  add: (product: ProductDTO, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  subtotalMinor: () => number;
  count: () => number;
}

/** Cart state persisted to localStorage under `sc_cart` (survives reloads). */
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
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
          };
          return { items: [...state.items, line] };
        }),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId ? { ...i, quantity: Math.max(0, Math.min(99, quantity)) } : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      subtotalMinor: () =>
        get().items.reduce((sum, i) => sum + i.unitPriceMinor * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'sc_cart' },
  ),
);
