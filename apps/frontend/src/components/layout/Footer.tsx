import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone } from 'lucide-react';
import { CONTACT_PHONE, WHATSAPP_NUMBER } from '@/lib/utils';
import { FooterInstallButton } from '@/components/PwaInstall';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-maroon-100 bg-white">
      <div className="container-px grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-serif text-xl text-maroon-700">Sharvi Collections</p>
          <p className="mt-2 max-w-xs text-sm text-ink/70">{t('brand.tagline')}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-maroon-500">
            {t('footer.shop')}
          </h3>
          <ul className="space-y-2 text-sm text-ink/70">
            <li>
              <Link to="/shop" className="hover:text-maroon-600">
                {t('nav.shop')}
              </Link>
            </li>
            <li>
              <Link to="/shop?badge=NEW" className="hover:text-maroon-600">
                {t('nav.newArrivals')}
              </Link>
            </li>
            <li>
              <Link to="/shop?badge=TRENDING" className="hover:text-maroon-600">
                {t('nav.trending')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-maroon-500">
            {t('footer.contact')}
          </h3>
          <ul className="space-y-2 text-sm text-ink/70">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-maroon-400" /> {t('footer.findUs')}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-maroon-400" />
              <a href={`tel:${CONTACT_PHONE}`} className="hover:text-maroon-600">
                {CONTACT_PHONE}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-maroon-600"
              >
                {t('footer.whatsapp')}: {WHATSAPP_NUMBER}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-maroon-500">
            {t('footer.about')}
          </h3>
          <p className="text-sm text-ink/70">{t('footer.madeIn')} 🇸🇪</p>
          <div className="mt-3">
            <FooterInstallButton />
          </div>
        </div>
      </div>

      <div className="border-t border-maroon-100 py-5">
        <div className="container-px flex flex-col items-center justify-between gap-2 text-xs text-ink/50 sm:flex-row">
          <p>
            © {year} Sharvi Collections. {t('footer.rights')}
          </p>
          <p>{t('footer.madeIn')}</p>
        </div>
      </div>
    </footer>
  );
}
