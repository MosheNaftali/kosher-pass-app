import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useSyncExternalStore } from 'react';

import { track } from '@/services/telemetry';

import i18n, { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES, type Locale } from './index';

export type { Locale };

/**
 * Reads and changes the active locale.
 *
 * Backed by i18next's own event emitter through `useSyncExternalStore` rather
 * than component-local `useState`. The previous version kept a copy of the
 * locale per call site, so two components using this hook could disagree about
 * the current language after one of them changed it.
 *
 * The persisted locale is applied during module initialization (see
 * `i18n/index.ts`), not here, so the app never renders a frame in the device
 * language before switching to the saved one.
 */
export function useLocale() {
  const locale = useSyncExternalStore(subscribeToLanguage, getLanguageSnapshot, getLanguageSnapshot);

  const setLocale = useCallback(async (newLocale: Locale) => {
    const previous = i18n.language;
    if (previous === newLocale) return;

    await i18n.changeLanguage(newLocale);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    track('locale_changed', { from: previous, to: newLocale });
  }, []);

  return { locale, setLocale, supportedLocales: SUPPORTED_LOCALES };
}

function subscribeToLanguage(onChange: () => void): () => void {
  i18n.on('languageChanged', onChange);
  return () => i18n.off('languageChanged', onChange);
}

function getLanguageSnapshot(): Locale {
  return isSupportedLocale(i18n.language) ? i18n.language : 'en';
}

function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
