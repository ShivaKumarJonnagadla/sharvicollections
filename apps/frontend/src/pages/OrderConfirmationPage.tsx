import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { formatSEK, type OrderDTO } from '@sharvi/shared';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/PageLoader';
import { Seo } from '@/components/Seo';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('sv') ? 'sv' : 'en';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => api.get<OrderDTO>(`/orders/${orderNumber}`),
    enabled: Boolean(orderNumber),
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

        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
          {data.items.map((it) => (
            <li key={it.id} className="flex justify-between text-ink/70">
              <span>
                {it.productName} × {it.quantity}
              </span>
              <span>{formatSEK(it.lineTotalMinor, locale)}</span>
            </li>
          ))}
        </ul>

        <Link to="/shop" className="btn-primary mt-8">
          {t('cart.continueShopping')}
        </Link>
      </motion.div>
    </div>
  );
}
