import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './resources/en/translation.json';
import es from './resources/es/translation.json';

export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export const LOCALE_STORAGE_KEY = '@kosher-pass:locale';

const FALLBACK_LOCALE: Locale = 'en';

function isSupportedLocale(value: string | null | undefined): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

const deviceLocale = getLocales()[0]?.languageCode;
const initialLocale: Locale = isSupportedLocale(deviceLocale) ? deviceLocale : FALLBACK_LOCALE;

// `i18n.use` below is the i18next instance method, not the `use` named export
// the import plugin warns about.
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: initialLocale,
  fallbackLng: FALLBACK_LOCALE,
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

/**
 * Restores the user's saved locale.
 *
 * i18next initializes synchronously with the *device* locale, but the user may
 * have chosen a different one. AsyncStorage can only be read asynchronously, so
 * the root layout awaits this promise behind the splash screen - otherwise the
 * app renders its first frame in the device language and visibly switches a
 * moment later.
 *
 * The promise starts here at module load rather than inside a hook, so the read
 * is already in flight by the time React mounts.
 */
export const localeRestored: Promise<void> = AsyncStorage.getItem(LOCALE_STORAGE_KEY)
  .then(stored => {
    if (isSupportedLocale(stored) && stored !== i18n.language) {
      // eslint-disable-next-line import/no-named-as-default-member
      return i18n.changeLanguage(stored).then(() => undefined);
    }
    return undefined;
  })
  .catch(() => {
    // A storage failure just means the device locale stands. Never block
    // startup on it.
  });

export default i18n;
