import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import i18n from './index';

const LOCALE_KEY = '@kosher-pass:locale';

export type Locale = 'en' | 'es';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(
    (i18n.language as Locale) || 'en'
  );

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY).then(stored => {
      if (stored === 'en' || stored === 'es') {
        i18n.changeLanguage(stored);
        setLocaleState(stored);
      }
    });
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    await i18n.changeLanguage(newLocale);
    await AsyncStorage.setItem(LOCALE_KEY, newLocale);
    setLocaleState(newLocale);
  }, []);

  return { locale, setLocale };
}
