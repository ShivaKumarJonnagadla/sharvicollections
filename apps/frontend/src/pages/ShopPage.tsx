import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import type { ProductBadge, ProductSort } from '@sharvi/shared';
import { useCategories, useProducts } from '@/hooks/catalog';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Skeletons';
import { Seo } from '@/components/Seo';
import { Select } from '@/components/ui/Select';

export function ShopPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { category: categoryParam } = useParams();
  const [params, setParams] = useSearchParams();
  const { data: categories } = useCategories();

  const category = categoryParam ?? params.get('category') ?? '';
  const subcategory = params.get('subcategory') ?? '';
  const q = params.get('q') ?? '';
  const sort = (params.get('sort') as ProductSort) ?? 'newest';
  const badge = (params.get('badge') as ProductBadge) ?? undefined;
  const page = Number(params.get('page') ?? 1);
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');

  // Local (uncommitted) price inputs in kronor, applied via the Apply button.
  const [minKr, setMinKr] = useState(minPrice ? String(Number(minPrice) / 100) : '');
  const [maxKr, setMaxKr] = useState(maxPrice ? String(Number(maxPrice) / 100) : '');
  useEffect(() => {
    setMinKr(minPrice ? String(Number(minPrice) / 100) : '');
    setMaxKr(maxPrice ? String(Number(maxPrice) / 100) : '');
  }, [minPrice, maxPrice]);

  const { data, isLoading, isFetching } = useProducts({
    category: category || undefined,
    subcategory: subcategory || undefined,
    q: q || undefined,
    sort,
    badge,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    page,
    pageSize: 24,
  });

  const activeCategory = useMemo(
    () => categories?.find((c) => c.slug === category),
    [categories, category],
  );

  /** Update query params, preserving the current category route. */
  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!('page' in patch)) next.set('page', '1');
    setParams(next);
  };

  /** Category is part of the URL path, so switching it navigates. */
  const selectCategory = (slug: string) => {
    navigate(slug ? `/shop/${slug}` : '/shop');
  };

  const applyPrice = () => {
    update({
      minPrice: minKr ? String(Math.round(Number(minKr) * 100)) : undefined,
      maxPrice: maxKr ? String(Math.round(Number(maxKr) * 100)) : undefined,
    });
  };

  const clearAll = () => {
    setMinKr('');
    setMaxKr('');
    navigate('/shop');
  };

  const title = activeCategory?.name ?? (q ? `“${q}”` : t('shop.title'));

  return (
    <>
      <Seo title={title} path="/shop" />
      <div className="container-px py-10">
        <nav className="mb-2 text-sm text-ink/50" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-maroon-600">
            {t('nav.home')}
          </Link>{' '}
          / <span className="text-maroon-600">{title}</span>
        </nav>
        <h1 className="font-serif text-3xl text-maroon-700 sm:text-4xl">{title}</h1>
        <p className="mt-1 text-sm text-ink/60">
          {data ? t('shop.results', { count: data.total }) : ''}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-maroon-700">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="font-medium">{t('shop.filters')}</span>
              </div>
              <button onClick={clearAll} className="text-xs text-maroon-500 hover:underline">
                {t('shop.clear')}
              </button>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink/70">
                {t('shop.category')}
              </label>
              <Select
                value={category}
                onChange={selectCategory}
                placeholder={t('shop.allCategories')}
                options={[
                  { value: '', label: t('shop.allCategories') },
                  ...(categories?.map((c) => ({ value: c.slug, label: c.name })) ?? []),
                ]}
              />
            </div>

            {/* Subcategory dropdown */}
            {activeCategory && activeCategory.subcategories.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink/70">
                  {t('shop.subcategory')}
                </label>
                <Select
                  value={subcategory}
                  onChange={(v) => update({ subcategory: v || undefined })}
                  placeholder={t('nav.viewAll')}
                  options={[
                    { value: '', label: t('nav.viewAll') },
                    ...activeCategory.subcategories.map((s) => ({ value: s.slug, label: s.name })),
                  ]}
                />
              </div>
            )}

            {/* Price range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink/70">
                {t('shop.priceRange')} (kr)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="0"
                  value={minKr}
                  onChange={(e) => setMinKr(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
                  className="w-full rounded-xl border border-maroon-200 bg-white px-3 py-2 text-sm"
                />
                <span className="text-ink/40">–</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="999"
                  value={maxKr}
                  onChange={(e) => setMaxKr(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
                  className="w-full rounded-xl border border-maroon-200 bg-white px-3 py-2 text-sm"
                />
              </div>
              <button onClick={applyPrice} className="btn-primary mt-3 w-full py-2 text-xs">
                {t('shop.apply')}
              </button>
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-6 flex items-center justify-end gap-2">
              <label className="text-sm text-ink/60">{t('shop.sort')}:</label>
              <Select
                className="w-52"
                value={sort}
                onChange={(v) => update({ sort: v })}
                options={[
                  { value: 'newest', label: t('shop.sortNewest') },
                  { value: 'price_asc', label: t('shop.sortPriceLow') },
                  { value: 'price_desc', label: t('shop.sortPriceHigh') },
                  { value: 'alphabetical', label: t('shop.sortAlpha') },
                ]}
              />
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
                <div>
                  <button onClick={clearAll} className="btn-ghost mt-4">
                    {t('shop.clear')}
                  </button>
                </div>
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
