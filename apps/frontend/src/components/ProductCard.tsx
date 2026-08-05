import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag } from 'lucide-react';
import { formatSEK, LOW_STOCK_THRESHOLD, productName, type ProductDTO } from '@sharvi/shared';
import { cloudinaryUrl, cn } from '@/lib/utils';
import { useCart } from '@/stores/cart';
import { useUi } from '@/stores/ui';

const badgeStyles: Record<string, string> = {
  NEW: 'bg-gold-300 text-ink',
  TRENDING: 'bg-maroon-600 text-white',
  SALE: 'bg-emerald-600 text-white',
};

export function ProductCard({ product, index = 0 }: { product: ProductDTO; index?: number }) {
  const { t, i18n } = useTranslation();
  const add = useCart((s) => s.add);
  const openCart = useUi((s) => s.openCart);
  const [active, setActive] = useState(0);
  const [liked, setLiked] = useState(false);

  const images = product.images.length ? product.images : [];
  const locale = i18n.language.startsWith('sv') ? 'sv' : 'en';
  const displayName = productName(product, locale);
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= LOW_STOCK_THRESHOLD;

  const go = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActive((prev) => (prev + dir + images.length) % images.length);
  };

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (soldOut) return;
    add(product);
    openCart();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-maroon-50">
          {images.length > 0 ? (
            <motion.img
              key={images[active]?.id}
              src={cloudinaryUrl(images[active].url, { width: 600, crop: 'fill' })}
              alt={images[active].alt ?? product.name}
              loading="lazy"
              initial={{ opacity: 0.4, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-maroon-300">No image</div>
          )}

          {/* Badges (stacked): product badge + stock indicator */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.badge !== 'NONE' && (
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm',
                  badgeStyles[product.badge],
                )}
              >
                {t(`product.badge${product.badge[0]}${product.badge.slice(1).toLowerCase()}`)}
              </span>
            )}
            {lowStock && (
              <span className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                {t('product.onlyLeft', { count: product.stock })}
              </span>
            )}
          </div>

          {/* Sold-out overlay */}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
              <span className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-maroon-700">
                {t('product.outOfStock')}
              </span>
            </div>
          )}

          {/* Wishlist (future-ready) */}
          <button
            type="button"
            aria-label="Add to wishlist"
            aria-pressed={liked}
            onClick={(e) => {
              e.preventDefault();
              setLiked((v) => !v);
            }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-maroon-600 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Heart className={cn('h-4 w-4', liked && 'fill-maroon-600')} />
          </button>

          {/* Desktop chevron arrows (multi-image) */}
          {images.length > 1 && (
            <div className="pointer-events-none absolute inset-x-2 top-1/2 hidden -translate-y-1/2 justify-between sm:flex">
              <button
                type="button"
                aria-label="Previous image"
                onClick={go(-1)}
                className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-white/80 text-ink opacity-0 transition group-hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={go(1)}
                className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-white/80 text-ink opacity-0 transition group-hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Dots */}
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((img, i) => (
                <span
                  key={img.id}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === active ? 'w-4 bg-white' : 'w-1.5 bg-white/60',
                  )}
                />
              ))}
            </div>
          )}

          {/* Quick add (hidden when sold out) */}
          {!soldOut && (
            <button
              type="button"
              onClick={quickAdd}
              className="btn-primary absolute inset-x-3 bottom-3 translate-y-4 py-2 text-xs opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            >
              <ShoppingBag className="h-4 w-4" /> {t('product.quickAdd')}
            </button>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-xs uppercase tracking-wide text-maroon-400">{product.category.name}</p>
          <h3 className="line-clamp-1 font-serif text-lg text-ink">{displayName}</h3>
          <div className="flex items-center gap-2">
            <span className="font-medium text-maroon-700">
              {formatSEK(product.priceMinor, locale)}
            </span>
            {product.compareAtMinor && product.compareAtMinor > product.priceMinor && (
              <span className="text-sm text-maroon-300 line-through">
                {formatSEK(product.compareAtMinor, locale)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
