import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { formatSEK, type OrderDTO } from '@sharvi/shared';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PageLoader } from '@/components/PageLoader';
import { Seo } from '@/components/Seo';

const TRACK_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

/** Horizontal order-status tracker. */
function OrderTracker({ status }: { status: OrderDTO['status'] }) {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div className="mt-8 rounded-xl bg-maroon-50 p-4 text-center text-sm text-maroon-700">
        This order is {status.toLowerCase()}.
      </div>
    );
  }
  const currentIndex = Math.max(0, TRACK_STEPS.indexOf(status as (typeof TRACK_STEPS)[number]));
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        {TRACK_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div className={cn('h-0.5 flex-1', i <= currentIndex ? 'bg-maroon-500' : 'bg-maroon-100')} />
                )}
                <div
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                    done && 'bg-maroon-500 text-white',
                    active && 'bg-maroon-600 text-white ring-4 ring-maroon-100',
                    !done && !active && 'bg-maroon-100 text-maroon-400',
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : active ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                {i < TRACK_STEPS.length - 1 && (
                  <div className={cn('h-0.5 flex-1', i < currentIndex ? 'bg-maroon-500' : 'bg-maroon-100')} />
                )}
              </div>
              <span className={cn('mt-2 text-[10px] font-medium sm:text-xs', active ? 'text-maroon-700' : 'text-ink/50')}>
                {step.charAt(0) + step.slice(1).toLowerCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('sv') ? 'sv' : 'en';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => api.get<OrderDTO>(`/orders/${orderNumber}`),
    enabled: Boolean(orderNumber),
    refetchInterval: 60_000, // poll so the tracker reflects status updates
  });

  if (isLoading) return <PageLoader />;
  if (isError || !data)
    return (
      <div className="container-px py-24 text-center">
        <p className="text-ink/60">{t('order.notFound')}</p>
        <Link to="/" className="btn-ghost mt-6">
          {t('order.backHome')}
        </Link>
      </div>
    );

  return (
    <div className="container-px max-w-2xl py-16">
      <Seo title={t('order.confirmedTitle')} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
        >
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        </motion.div>
        <h1 className="mt-4 font-serif text-3xl text-maroon-700">{t('order.confirmedTitle')}</h1>
        <p className="mt-2 text-ink/70">{t('order.confirmedText')}</p>

        <dl className="mx-auto mt-8 max-w-sm space-y-3 text-left">
          <div className="flex justify-between border-b border-maroon-100 pb-2">
            <dt className="text-ink/50">{t('order.number')}</dt>
            <dd className="font-medium">{data.orderNumber}</dd>
          </div>
          <div className="flex justify-between border-b border-maroon-100 pb-2">
            <dt className="text-ink/50">{t('order.status')}</dt>
            <dd className="font-medium">{data.status}</dd>
          </div>
          <div className="flex justify-between border-b border-maroon-100 pb-2">
            <dt className="text-ink/50">{t('order.total')}</dt>
            <dd className="font-medium">{formatSEK(data.totalMinor, locale)}</dd>
          </div>
        </dl>

        <OrderTracker status={data.status} />

        <ul className="mx-auto mt-8 max-w-sm space-y-2 border-t border-maroon-100 pt-6 text-left text-sm">
          {data.items.map((it) => (
            <li key={it.id} className="flex justify-between text-ink/70">
              <span>
                {it.productName} × {it.quantity}
              </span>
              <span>{formatSEK(it.lineTotalMinor, locale)}</span>
            </li>
          ))}
          {data.shippingRequired && (
            <li className="flex justify-between text-ink/70">
              <span>{t('checkout.shipping')}</span>
              <span>{formatSEK(data.shippingCostMinor, locale)}</span>
            </li>
          )}
        </ul>

        <Link to="/shop" className="btn-primary mt-8">
          {t('cart.continueShopping')}
        </Link>
      </motion.div>
    </div>
  );
}
