import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uk from './locales/uk.json';
import ro from './locales/ro.json';
import en from './locales/en.json';

const savedLang = localStorage.getItem('brasov-lang') || 'uk';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uk: { translation: uk },
      ro: { translation: ro },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'uk',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
