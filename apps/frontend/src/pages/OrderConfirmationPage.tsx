import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { formatSEK, isCancellable, type OrderDTO } from '@sharvi/shared';
import { api, ApiError } from '@/lib/api';
import { cn, WHATSAPP_NUMBER } from '@/lib/utils';
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

        <CancelSection order={data} />

        <Link to="/shop" className="btn-primary mt-8">
          {t('cart.continueShopping')}
        </Link>
      </motion.div>
    </div>
  );
}

const WA_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}`;

/** Cancellation UI: cancel button + terms/reason modal, or cancelled/blocked states. */
function CancelSection({ order }: { order: OrderDTO }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cancel = useMutation({
    mutationFn: () => api.post(`/orders/${order.orderNumber}/cancel`, { email, reason }),
    onSuccess: () => {
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['order', order.orderNumber] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : t('common.error')),
  });

  if (order.status === 'CANCELLED') {
    return (
      <div className="mt-8 rounded-xl bg-maroon-50 p-4 text-left text-sm">
        <p className="font-medium text-maroon-700">{t('order.cancelledNote')}</p>
        {order.cancelReason && (
          <p className="mt-1 text-ink/60">
            {t('order.cancelReasonShown')}: {order.cancelReason}
          </p>
        )}
      </div>
    );
  }

  if (!isCancellable(order.status)) {
    return (
      <p className="mt-8 text-xs text-ink/50">
        {t('order.cancelNotAllowed')}{' '}
        <a href={WA_LINK} target="_blank" rel="noreferrer" className="text-maroon-600 underline">
          {t('order.contactWhatsApp')}
        </a>
      </p>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="mx-auto mt-8 flex items-center gap-1.5 text-sm text-maroon-500 hover:text-maroon-700 hover:underline"
      >
        <XCircle className="h-4 w-4" /> {t('order.cancel')}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-md p-6 text-left"
            >
              <h2 className="font-serif text-xl text-maroon-700">{t('order.cancelTitle')}</h2>

              <div className="mt-4 rounded-xl bg-maroon-50 p-3 text-xs text-ink/70">
                <p className="mb-1 font-semibold text-maroon-700">{t('order.cancelTermsTitle')}</p>
                {t('order.cancelTerms')}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-ink/70">
                    {t('order.cancelEmailLabel')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-maroon-200 px-3 py-2 text-sm outline-none focus:border-maroon-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink/70">
                    {t('order.cancelReasonLabel')}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder={t('order.cancelReasonPlaceholder')}
                    className="w-full rounded-xl border border-maroon-200 px-3 py-2 text-sm outline-none focus:border-maroon-400"
                  />
                </div>
              </div>

              {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

              <div className="mt-5 flex gap-3">
                <button onClick={() => setOpen(false)} className="btn-ghost flex-1">
                  {t('order.keepOrder')}
                </button>
                <button
                  onClick={() => cancel.mutate()}
                  disabled={cancel.isPending || !email || reason.trim().length < 3}
                  className="btn flex-1 bg-red-600 text-white hover:bg-red-700"
                >
                  {cancel.isPending ? t('order.cancelling') : t('order.cancelConfirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
