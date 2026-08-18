import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { flushTelemetry, trackScreen } from '@/services/telemetry';

/**
 * Emits a screen view whenever the route changes, and flushes buffered
 * analytics when the app goes to the background.
 *
 * Mounted once in the root layout, this covers every screen in the app - there
 * is no per-screen instrumentation to forget when a route is added.
 */
export function useScreenTracking(): void {
  const lastPathRef = useRef<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Expo Router can re-render with the same pathname (a param change, a tab
    // re-focus); only a genuine navigation counts as a screen view.
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;
    trackScreen(pathname);
  }, [pathname]);

  useEffect(() => {
    // The OS can kill a backgrounded app at any point, taking the unflushed
    // batch with it - so the tail of every session is flushed on the way out.
    function handleAppStateChange(state: AppStateStatus) {
      if (state === 'background' || state === 'inactive') {
        flushTelemetry();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);
}
