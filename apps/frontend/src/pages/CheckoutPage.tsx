import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Banknote, Smartphone } from 'lucide-react';
import { checkoutSchema, formatSEK, type CheckoutInput, type OrderDTO } from '@sharvi/shared';
import { useCart } from '@/stores/cart';
import { api, ApiError } from '@/lib/api';
import { cloudinaryUrl } from '@/lib/utils';
import { swishLink, SWISH_NUMBER } from '@/lib/swish';
import { Seo } from '@/components/Seo';

export function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, subtotalMinor, clear } = useCart();
  const locale = i18n.language.startsWith('sv') ? 'sv' : 'en';
  const [serverError, setServerError] = useState<string | null>(null);
  const [swishOrder, setSwishOrder] = useState<OrderDTO | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'SWISH', items: [] },
  });

  const paymentMethod = watch('paymentMethod');
  const subtotalKr = subtotalMinor() / 100;

  // Generate the Swish QR once we have a placed Swish order.
  useEffect(() => {
    if (swishOrder && swishOrder.paymentMethod === 'SWISH') {
      const link = swishLink(swishOrder.totalMinor / 100, swishOrder.orderNumber);
      QRCode.toDataURL(link, { margin: 1, width: 220 }).then(setQr).catch(() => setQr(null));
    }
  }, [swishOrder]);

  const onSubmit = async (form: CheckoutInput) => {
    setServerError(null);
    try {
      const order = await api.post<OrderDTO>('/orders', {
        ...form,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      clear();
      if (order.paymentMethod === 'SWISH') {
        setSwishOrder(order);
      } else {
        navigate(`/order/${order.orderNumber}`);
      }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t('common.error'));
    }
  };

  if (items.length === 0 && !swishOrder) {
    return (
      <div className="container-px py-24 text-center">
        <p className="text-ink/60">{t('cart.empty')}</p>
        <Link to="/shop" className="btn-primary mt-6">
          {t('cart.emptyCta')}
        </Link>
      </div>
    );
  }

  // Swish payment step (shown after order is placed with Swish).
  if (swishOrder) {
    const link = swishLink(swishOrder.totalMinor / 100, swishOrder.orderNumber);
    return (
      <div className="container-px max-w-lg py-16">
        <Seo title={t('checkout.swishTitle')} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center"
        >
          <Smartphone className="mx-auto mb-4 h-10 w-10 text-maroon-600" />
          <h1 className="font-serif text-2xl text-maroon-700">{t('checkout.swishTitle')}</h1>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {formatSEK(swishOrder.totalMinor, locale)}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {t('checkout.swishReference')}: <strong>{swishOrder.orderNumber}</strong>
          </p>

          <a href={link} className="btn-primary mt-6 w-full">
            {t('checkout.swishOpen')}
          </a>

          {qr && (
            <div className="mt-6">
              <p className="mb-2 text-sm text-ink/60">{t('checkout.swishScan')}</p>
              <img src={qr} alt="Swish QR" className="mx-auto rounded-xl" width={200} height={200} />
            </div>
          )}

          <div className="mt-6 rounded-xl bg-maroon-50 p-4 text-left text-sm text-ink/70">
            <p className="font-medium text-maroon-700">{t('checkout.swishNotInstalled')}</p>
            <p className="mt-1">
              {t('checkout.swishInstall', { number: SWISH_NUMBER, ref: swishOrder.orderNumber })}
            </p>
          </div>

          <button onClick={() => navigate(`/order/${swishOrder.orderNumber}`)} className="btn-ghost mt-6 w-full">
            {t('order.number')}: {swishOrder.orderNumber} →
          </button>
        </motion.div>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-xl border border-maroon-200 bg-white px-4 py-3 text-sm outline-none focus:border-maroon-500';

  return (
    <div className="container-px py-10">
      <Seo title={t('checkout.title')} />
      <h1 className="mb-8 font-serif text-3xl text-maroon-700 sm:text-4xl">{t('checkout.title')}</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <fieldset className="card space-y-4 p-6">
            <legend className="px-2 font-serif text-lg text-maroon-700">{t('checkout.contact')}</legend>

            <div>
              <label className="mb-1 block text-sm text-ink/70">{t('checkout.name')}</label>
              <input {...register('customerName')} className={inputCls} autoComplete="name" />
              {errors.customerName && (
                <p className="mt-1 text-xs text-red-600">{errors.customerName.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-ink/70">{t('checkout.email')}</label>
                <input {...register('customerEmail')} type="email" className={inputCls} autoComplete="email" />
                {errors.customerEmail && (
                  <p className="mt-1 text-xs text-red-600">{errors.customerEmail.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink/70">{t('checkout.phone')}</label>
                <input {...register('customerPhone')} type="tel" className={inputCls} autoComplete="tel" />
                {errors.customerPhone && (
                  <p className="mt-1 text-xs text-red-600">{errors.customerPhone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-ink/70">{t('checkout.note')}</label>
              <textarea {...register('note')} rows={2} className={inputCls} />
            </div>
          </fieldset>

          <fieldset className="card space-y-3 p-6">
            <legend className="px-2 font-serif text-lg text-maroon-700">{t('checkout.payment')}</legend>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-maroon-200 p-4 has-[:checked]:border-maroon-500 has-[:checked]:bg-maroon-50">
              <input {...register('paymentMethod')} type="radio" value="SWISH" className="accent-maroon-600" />
              <Smartphone className="h-5 w-5 text-maroon-600" />
              <span>
                <span className="block font-medium">{t('checkout.swish')}</span>
                <span className="block text-xs text-ink/60">{t('checkout.swishHint')}</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-maroon-200 p-4 has-[:checked]:border-maroon-500 has-[:checked]:bg-maroon-50">
              <input {...register('paymentMethod')} type="radio" value="CASH" className="accent-maroon-600" />
              <Banknote className="h-5 w-5 text-maroon-600" />
              <span>
                <span className="block font-medium">{t('checkout.cash')}</span>
                <span className="block text-xs text-ink/60">{t('checkout.cashHint')}</span>
              </span>
            </label>
          </fieldset>

          {serverError && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{serverError}</p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? t('checkout.placing') : t('checkout.placeOrder')}
          </button>
        </form>

        {/* Summary */}
        <aside className="card h-fit space-y-4 p-6">
          <h2 className="font-serif text-lg text-maroon-700">{t('checkout.summary')}</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <div className="h-14 w-12 overflow-hidden rounded-lg bg-maroon-50">
                  {item.image && (
                    <img
                      src={cloudinaryUrl(item.image, { width: 120, crop: 'fill' })}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 text-sm">
                  <p className="line-clamp-1">{item.name}</p>
                  <p className="text-ink/50">× {item.quantity}</p>
                </div>
                <span className="text-sm font-medium">
                  {formatSEK(item.unitPriceMinor * item.quantity, locale)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-maroon-100 pt-4 text-lg">
            <span className="text-ink/70">{t('checkout.total')}</span>
            <span className="font-semibold text-maroon-700">
              {formatSEK(subtotalKr * 100, locale)}
            </span>
          </div>
          <p className="text-xs text-ink/50">
            {paymentMethod === 'SWISH' ? t('checkout.swishHint') : t('checkout.cashHint')}
          </p>
        </aside>
      </div>
    </div>
  );
}
