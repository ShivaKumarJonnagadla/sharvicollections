import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';

const STORAGE_KEY = 'sc_consent';

function getVisitorId(): string {
  let id = localStorage.getItem('sc_visitor');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('sc_visitor', id);
  }
  return id;
}

/**
 * GDPR consent banner. We use no tracking cookies and run no analytics until
 * consent — this banner only records the user's choice (auditable server-side).
 */
export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const record = async (action: 'GRANTED' | 'REVOKED', preferences: boolean) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ action, preferences, at: Date.now() }));
    setVisible(false);
    await api
      .post('/consent', {
        visitorId: getVisitorId(),
        necessary: true,
        preferences,
        action,
      })
      .catch(() => undefined); // never block UX on consent logging
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="fixed inset-x-0 bottom-0 z-50 p-4"
          role="dialog"
          aria-label={t('consent.title')}
        >
          <div className="container-px">
            <div className="card mx-auto max-w-4xl border border-maroon-100 p-5 sm:flex sm:items-center sm:gap-6">
              <div className="flex-1">
                <p className="font-serif text-lg text-maroon-700">{t('consent.title')}</p>
                <p className="mt-1 text-sm text-ink/70">{t('consent.body')}</p>
              </div>
              <div className="mt-4 flex shrink-0 gap-3 sm:mt-0">
                <button className="btn-ghost py-2 text-sm" onClick={() => record('REVOKED', false)}>
                  {t('consent.decline')}
                </button>
                <button className="btn-primary py-2 text-sm" onClick={() => record('GRANTED', true)}>
                  {t('consent.accept')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
