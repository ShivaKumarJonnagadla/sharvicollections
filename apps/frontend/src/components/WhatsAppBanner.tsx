import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_GROUP_URL, WHATSAPP_NUMBER } from '@/lib/utils';

export function WhatsAppBanner() {
  const { t } = useTranslation();
  return (
    <section className="container-px">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-maroon-600 to-maroon-800 p-8 text-white sm:p-12"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-300/20 blur-2xl" />
        <div className="relative max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl">{t('whatsapp.title')}</h2>
          <p className="mt-3 text-white/80">{t('whatsapp.text')}</p>
          <p className="mt-2 text-sm text-white/60">
            {t('whatsapp.fallback', { number: WHATSAPP_NUMBER })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer" className="btn-gold">
              {t('whatsapp.join')}
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn border border-white/40 text-white hover:bg-white/10"
            >
              {t('whatsapp.message')}
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
