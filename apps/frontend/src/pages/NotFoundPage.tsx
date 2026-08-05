import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Seo } from '@/components/Seo';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="container-px flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Seo title="404" />
      <p className="font-serif text-7xl text-maroon-200">404</p>
      <h1 className="mt-2 font-serif text-2xl text-maroon-700">Page not found</h1>
      <Link to="/" className="btn-primary mt-6">
        {t('order.backHome')}
      </Link>
    </div>
  );
}
