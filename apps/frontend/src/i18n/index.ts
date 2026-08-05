import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import sv from './sv.json';

/**
 * i18n bootstrap. Language is detected from localStorage first (remembered
 * choice), then the browser. Switching is instant and never reloads the page.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sv: { translation: sv },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'sv'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'sc_lang',
      caches: ['localStorage'],
    },
  });

// Keep <html lang> in sync for accessibility & SEO.
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
