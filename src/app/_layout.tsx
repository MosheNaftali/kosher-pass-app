import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/app-error-boundary';
import AppTabs from '@/components/app-tabs';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SavedItemsProvider } from '@/hooks/use-saved-items';
import { useScreenTracking } from '@/hooks/use-screen-tracking';
import i18n, { localeRestored } from '@/i18n';
import { initNetworkBridge } from '@/services/network';
import { persistOptions, queryClient } from '@/services/query-client';
import { initTelemetry } from '@/services/telemetry';

// Pins the navigator's initial screen to Products. Without it the headless tabs
// fall back to the shortest route name, which is `about`.
//
// The anchor must be the route node's name in *this* navigator. A directory with
// its own `_layout.tsx` is a single route named after the directory (`products`),
// while a layout-less directory keeps the `/index` suffix on its index route
// (`alerts/index`).
export const unstable_settings = { anchor: 'products' };

// Held until the saved locale has been restored, so the app never renders its
// first frame in the device language and then visibly switches.
void SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    void localeRestored.finally(() => {
      setLocaleReady(true);
      void SplashScreen.hideAsync();
    });
  }, []);

  useEffect(() => {
    // Boots Sentry and PostHog and resolves the tracking prompt. Fire and
    // forget: `initTelemetry` contains its own failures, so a telemetry outage
    // cannot delay or break app startup.
    void initTelemetry();
  }, []);

  useEffect(() => initNetworkBridge(), []);

  if (!localeReady) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <SavedItemsProvider>
              <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
                <ScreenTracker />
                <AppTabs />
              </SafeAreaView>
            </SavedItemsProvider>
          </ThemeProvider>
        </I18nextProvider>
      </PersistQueryClientProvider>
    </AppErrorBoundary>
  );
}

/**
 * Renders nothing; exists so `useScreenTracking` runs inside the router context
 * (it needs `usePathname`) without re-rendering the whole layout on every
 * navigation.
 */
function ScreenTracker() {
  useScreenTracking();
  return null;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
