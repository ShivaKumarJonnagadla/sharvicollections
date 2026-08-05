import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import type { ProductBadge, ProductSort } from '@sharvi/shared';
import { useCategories, useProducts } from '@/hooks/catalog';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Skeletons';
import { Seo } from '@/components/Seo';

export function ShopPage() {
  const { t } = useTranslation();
  const { category: categoryParam } = useParams();
  const [params, setParams] = useSearchParams();
  const { data: categories } = useCategories();

  const category = categoryParam ?? params.get('category') ?? '';
  const subcategory = params.get('subcategory') ?? '';
  const q = params.get('q') ?? '';
  const sort = (params.get('sort') as ProductSort) ?? 'newest';
  const badge = (params.get('badge') as ProductBadge) ?? undefined;
  const page = Number(params.get('page') ?? 1);

  const { data, isLoading, isFetching } = useProducts({
    category: category || undefined,
    subcategory: subcategory || undefined,
    q: q || undefined,
    sort,
    badge,
    page,
    pageSize: 24,
  });

  const activeCategory = useMemo(
    () => categories?.find((c) => c.slug === category),
    [categories, category],
  );

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!('page' in patch)) next.set('page', '1');
    setParams(next);
  };

  const title = activeCategory?.name ?? (q ? `“${q}”` : t('shop.title'));

  return (
    <>
      <Seo title={title} path="/shop" />
      <div className="container-px py-10">
        <nav className="mb-2 text-sm text-ink/50" aria-label="Breadcrumb">
          <span>{t('nav.home')}</span> / <span className="text-maroon-600">{title}</span>
        </nav>
        <h1 className="font-serif text-3xl text-maroon-700 sm:text-4xl">{title}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {data ? t('shop.results', { count: data.total }) : ''}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Filters */}
          <aside className="space-y-6">
            <div className="flex items-center gap-2 text-maroon-700">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="font-medium">{t('shop.filters')}</span>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink/70">
                {t('shop.category')}
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const next = new URLSearchParams(params);
                  next.delete('subcategory');
                  if (e.target.value) next.set('category', e.target.value);
                  else next.delete('category');
                  next.set('page', '1');
                  // Category is also a route param; normalise to query form.
                  setParams(next);
                }}
                className="w-full rounded-xl border border-maroon-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">{t('shop.allCategories')}</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {activeCategory && activeCategory.subcategories.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink/70">
                  {t('shop.subcategory')}
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => update({ subcategory: e.target.value || undefined })}
                  className="w-full rounded-xl border border-maroon-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">{t('shop.allCategories')}</option>
                  {activeCategory.subcategories.map((s) => (
                    <option key={s.id} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-ink/70">
                {t('shop.priceRange')} (kr)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  defaultValue={params.get('minPrice') ? Number(params.get('minPrice')) / 100 : ''}
                  onBlur={(e) =>
                    update({ minPrice: e.target.value ? String(Number(e.target.value) * 100) : undefined })
                  }
                  className="w-full rounded-xl border border-maroon-200 bg-white px-3 py-2 text-sm"
                />
                <span className="text-ink/40">–</span>
                <input
                  type="number"
                  min={0}
                  placeholder="999"
                  defaultValue={params.get('maxPrice') ? Number(params.get('maxPrice')) / 100 : ''}
                  onBlur={(e) =>
                    update({ maxPrice: e.target.value ? String(Number(e.target.value) * 100) : undefined })
                  }
                  className="w-full rounded-xl border border-maroon-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => setParams(new URLSearchParams())}
              className="text-sm text-maroon-500 hover:underline"
            >
              {t('shop.clear')}
            </button>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-6 flex items-center justify-end">
              <label className="mr-2 text-sm text-ink/60">{t('shop.sort')}:</label>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="rounded-xl border border-maroon-200 bg-white px-3 py-2 text-sm"
              >
                <option value="newest">{t('shop.sortNewest')}</option>
                <option value="price_asc">{t('shop.sortPriceLow')}</option>
                <option value="price_desc">{t('shop.sortPriceHigh')}</option>
                <option value="alphabetical">{t('shop.sortAlpha')}</option>
              </select>
            </div>

            {isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : data && data.items.length > 0 ? (
              <motion.div
                animate={{ opacity: isFetching ? 0.6 : 1 }}
                className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3"
              >
                {data.items.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </motion.div>
            ) : (
              <div className="rounded-2xl bg-white p-12 text-center text-ink/60">
                {t('shop.empty')}
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {Array.from({ length: data.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => update({ page: String(i + 1) })}
                    className={`h-9 w-9 rounded-full text-sm ${
                      data.page === i + 1
                        ? 'bg-maroon-600 text-white'
                        : 'bg-white text-ink hover:bg-maroon-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
