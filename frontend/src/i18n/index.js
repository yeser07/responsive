import { createI18n } from 'vue-i18n';
import es from './locales/es.json';
import en from './locales/en.json';

const STORAGE_KEY = 'ci_manager_locale';

function getInitialLocale() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'es' || saved === 'en') return saved;
  return 'es';
}

const initialLocale = getInitialLocale();
document.documentElement.lang = initialLocale;

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'es',
  messages: { es, en },
});

export function setLocale(locale) {
  if (locale !== 'es' && locale !== 'en') return;
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

export function getLocale() {
  return i18n.global.locale.value;
}

export default i18n;
