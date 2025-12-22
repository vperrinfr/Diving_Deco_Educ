import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';

// Detect browser language
const getBrowserLocale = (): string => {
  const navigatorLocale = navigator.language || (navigator as any).userLanguage;
  
  if (!navigatorLocale) {
    return 'en';
  }
  
  const trimmedLocale = navigatorLocale.trim().split(/-|_/)[0];
  
  // Check if we support this locale
  if (trimmedLocale === 'fr') {
    return 'fr';
  }
  
  return 'en';
};

// Get saved locale from localStorage or use browser locale
const getSavedLocale = (): string => {
  const saved = localStorage.getItem('user-locale');
  return saved || getBrowserLocale();
};

const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    fr,
  },
});

export default i18n;

// Made with Bob
