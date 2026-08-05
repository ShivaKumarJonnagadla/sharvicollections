import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatSEK } from '@sharvi/shared';
import { useCart } from '@/stores/cart';
import { useUi } from '@/stores/ui';
import { cloudinaryUrl } from '@/lib/utils';

export function CartDrawer() {
  const { t, i18n } = useTranslation();
  const open = useUi((s) => s.cartOpen);
  const close = useUi((s) => s.closeCart);
  const { items, setQuantity, remove, subtotalMinor } = useCart();
  const locale = i18n.language.startsWith('sv') ? 'sv' : 'en';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40" onClick={close} />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-soft"
            role="dialog"
            aria-label={t('cart.title')}
          >
            <div className="flex items-center justify-between border-b border-maroon-100 p-5">
              <h2 className="font-serif text-xl text-maroon-700">{t('cart.title')}</h2>
              <button aria-label="Close cart" onClick={close}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-maroon-200" />
                <p className="text-ink/60">{t('cart.empty')}</p>
                <button className="btn-ghost" onClick={close}>
                  {t('cart.emptyCta')}
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-4 overflow-y-auto p-5">
                  {items.map((item) => (
                    <li key={item.productId} className="flex gap-3">
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={close}
                        className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-maroon-50"
                      >
                        {item.image && (
                          <img
                            src={cloudinaryUrl(item.image, { width: 160, crop: 'fill' })}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={close}
                          className="line-clamp-1 font-medium text-ink hover:text-maroon-600"
                        >
                          {item.name}
                        </Link>
                        <span className="text-sm text-maroon-700">
                          {formatSEK(item.unitPriceMinor, locale)}
                        </span>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="inline-flex items-center rounded-full border border-maroon-200">
                            <button
                              aria-label="Decrease quantity"
                              className="grid h-8 w-8 place-items-center"
                              onClick={() => setQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              aria-label="Increase quantity"
                              className="grid h-8 w-8 place-items-center"
                              onClick={() => setQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            aria-label={t('cart.remove')}
                            onClick={() => remove(item.productId)}
                            className="text-maroon-400 hover:text-maroon-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-maroon-100 p-5">
                  <div className="mb-4 flex items-center justify-between text-lg">
                    <span className="text-ink/70">{t('cart.subtotal')}</span>
                    <span className="font-semibold text-maroon-700">
                      {formatSEK(subtotalMinor(), locale)}
                    </span>
                  </div>
                  <Link to="/checkout" onClick={close} className="btn-primary w-full">
                    {t('cart.checkout')}
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
