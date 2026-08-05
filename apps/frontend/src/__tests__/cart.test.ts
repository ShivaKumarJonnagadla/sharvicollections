import { beforeEach, describe, expect, it } from 'vitest';
import { useCart } from '@/stores/cart';
import type { ProductDTO } from '@sharvi/shared';

const product = (id: string, priceMinor: number): ProductDTO => ({
  id,
  name: `Product ${id}`,
  nameSv: null,
  slug: `product-${id}`,
  description: null,
  descriptionSv: null,
  priceMinor,
  compareAtMinor: null,
  currency: 'SEK',
  stock: 10,
  badge: 'NONE',
  isPublished: true,
  isFeatured: false,
  viewCount: 0,
  category: { id: 'c1', name: 'Necklace', slug: 'necklace' },
  subcategory: null,
  images: [],
  createdAt: '',
  updatedAt: '',
});

describe('cart store', () => {
  beforeEach(() => useCart.getState().clear());

  it('adds items and computes subtotal in minor units', () => {
    const { add } = useCart.getState();
    add(product('a', 34900));
    add(product('a', 34900)); // same product => quantity increments
    add(product('b', 19900));
    const state = useCart.getState();
    expect(state.items).toHaveLength(2);
    expect(state.count()).toBe(3);
    expect(state.subtotalMinor()).toBe(34900 * 2 + 19900);
  });

  it('removes items and updates quantity, dropping to zero', () => {
    const { add, setQuantity, remove } = useCart.getState();
    add(product('a', 1000));
    setQuantity('a', 5);
    expect(useCart.getState().count()).toBe(5);
    setQuantity('a', 0); // zero quantity removes the line
    expect(useCart.getState().items).toHaveLength(0);
    add(product('b', 1000));
    remove('b');
    expect(useCart.getState().items).toHaveLength(0);
  });
});
