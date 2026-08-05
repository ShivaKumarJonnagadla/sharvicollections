import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Share2, ShoppingBag } from 'lucide-react';
import { formatSEK, productDescription, productName } from '@sharvi/shared';
import { useProduct } from '@/hooks/catalog';
import { ProductGallery } from '@/components/ProductGallery';
import { ProductCard } from '@/components/ProductCard';
import { PageLoader } from '@/components/PageLoader';
import { Seo } from '@/components/Seo';
import { useCart } from '@/stores/cart';
import { useUi } from '@/stores/ui';
import { SITE_URL, WHATSAPP_NUMBER } from '@/lib/utils';

export function ProductPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useProduct(slug);
  const add = useCart((s) => s.add);
  const openCart = useUi((s) => s.openCart);
  const [added, setAdded] = useState(false);
  const locale = i18n.language.startsWith('sv') ? 'sv' : 'en';

  if (isLoading) return <PageLoader />;
  if (isError || !data)
    return (
      <div className="container-px py-24 text-center">
        <p className="text-ink/60">{t('common.error')}</p>
        <Link to="/shop" className="btn-ghost mt-6">
          {t('nav.shop')}
        </Link>
      </div>
    );

  const { product, related } = data;
  const url = `${SITE_URL}/product/${product.slug}`;
  const displayName = productName(product, locale);
  const displayDescription = productDescription(product, locale);

  const onAdd = () => {
    add(product);
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 1500);
  };

  const shareWhatsApp = () => {
    const text = `${displayName} — ${formatSEK(product.priceMinor, locale)}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noreferrer');
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: displayName, url }).catch(() => undefined);
    } else {
      shareWhatsApp();
    }
  };

  return (
    <>
      <Seo
        title={displayName}
        description={displayDescription ?? undefined}
        image={product.images[0]?.url}
        path={`/product/${product.slug}`}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: product.images.map((i) => i.url),
          description: product.description,
          brand: { '@type': 'Brand', name: 'Sharvi Collections' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'SEK',
            price: (product.priceMinor / 100).toFixed(2),
            availability:
              product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url,
          },
        }}
      />

      <div className="container-px py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-ink/50" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-maroon-600">
            {t('nav.home')}
          </Link>{' '}
          /{' '}
          <Link to={`/shop/${product.category.slug}`} className="hover:text-maroon-600">
            {product.category.name}
          </Link>
          {product.subcategory && (
            <>
              {' '}
              / <span>{product.subcategory.name}</span>
            </>
          )}
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} />

          <div>
            <p className="text-sm uppercase tracking-widest text-gold-500">
              {product.category.name}
            </p>
            <h1 className="mt-2 font-serif text-3xl text-maroon-800 sm:text-4xl">{displayName}</h1>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl font-semibold text-maroon-700">
                {formatSEK(product.priceMinor, locale)}
              </span>
              {product.compareAtMinor && product.compareAtMinor > product.priceMinor && (
                <span className="text-lg text-maroon-300 line-through">
                  {formatSEK(product.compareAtMinor, locale)}
                </span>
              )}
            </div>

            <p
              className={`mt-3 inline-flex items-center gap-1.5 text-sm ${
                product.stock > 0 ? 'text-emerald-600' : 'text-maroon-400'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {product.stock > 0 ? t('product.inStock') : t('product.outOfStock')}
            </p>

            {displayDescription && (
              <div className="mt-6">
                <h2 className="mb-2 font-serif text-lg text-ink">{t('product.description')}</h2>
                <p className="leading-relaxed text-ink/70">{displayDescription}</p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onAdd} disabled={product.stock === 0} className="btn-primary flex-1 sm:flex-none">
                {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                {added ? t('product.added') : t('product.addToCart')}
              </button>
              <button onClick={share} className="btn-ghost" aria-label={t('product.share')}>
                <Share2 className="h-4 w-4" /> {t('product.share')}
              </button>
              <button onClick={shareWhatsApp} className="btn border border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                {t('product.shareWhatsApp')}
              </button>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-maroon-100 pt-6 text-sm">
              <div>
                <dt className="text-ink/50">{t('product.category')}</dt>
                <dd className="text-ink">{product.category.name}</dd>
              </div>
              {product.subcategory && (
                <div>
                  <dt className="text-ink/50">{t('product.subcategory')}</dt>
                  <dd className="text-ink">{product.subcategory.name}</dd>
                </div>
              )}
              <div>
                <dt className="text-ink/50">{t('product.availability')}</dt>
                <dd className="text-ink">
                  {product.stock > 0 ? t('product.inStock') : t('product.outOfStock')}
                </dd>
              </div>
              <div>
                <dt className="text-ink/50">WhatsApp</dt>
                <dd className="text-ink">{WHATSAPP_NUMBER}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-8 font-serif text-2xl text-maroon-700">{t('product.related')}</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
