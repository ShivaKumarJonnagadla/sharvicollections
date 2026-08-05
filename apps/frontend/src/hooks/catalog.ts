import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { CategoryDTO, Paginated, ProductDTO, ProductQuery } from '@sharvi/shared';
import { api } from '@/lib/api';

export interface FeaturedResponse {
  featured: ProductDTO[];
  newArrivals: ProductDTO[];
  trending: ProductDTO[];
}

export function useFeatured() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => api.get<FeaturedResponse>('/products/featured'),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<CategoryDTO[]>('/categories'),
    staleTime: 10 * 60_000,
  });
}

export function useProducts(query: Partial<ProductQuery>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) params.set(key, String(value));
  });
  const qs = params.toString();
  return useQuery({
    queryKey: ['products', 'list', qs],
    queryFn: () => api.get<Paginated<ProductDTO>>(`/products${qs ? `?${qs}` : ''}`),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['products', 'detail', slug],
    enabled: Boolean(slug),
    queryFn: () =>
      api.get<{ product: ProductDTO; related: ProductDTO[] }>(`/products/${slug}`),
  });
}
