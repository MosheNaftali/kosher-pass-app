import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './resources/en/translation.json';
import es from './resources/es/translation.json';

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
const SUPPORTED_LOCALES = ['en', 'es'];
const initialLocale = SUPPORTED_LOCALES.includes(deviceLocale) ? deviceLocale : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: initialLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;

export const SUPPORTED_LOCALES_LIST = SUPPORTED_LOCALES as readonly string[];

export const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
};
