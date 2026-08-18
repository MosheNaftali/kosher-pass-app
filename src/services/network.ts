import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Wires React Native's connectivity and foreground state into React Query.
 *
 * By default React Query uses browser APIs (`navigator.onLine`, window focus)
 * that do not exist on React Native, so without this it never knows the device
 * went offline and never refetches when it comes back. That matters here more
 * than in most apps: this one is used inside supermarkets, where losing and
 * regaining signal mid-session is the norm.
 */

export function initNetworkBridge(): () => void {
  const unsubscribeNetwork = NetInfo.addEventListener(state => {
    // `isInternetReachable` is null while the probe is still running; treating
    // that as offline would spuriously pause queries on a healthy connection,
    // so only an explicit `false` counts as offline.
    onlineManager.setOnline(
      Boolean(state.isConnected) && state.isInternetReachable !== false
    );
  });

  function handleAppStateChange(status: AppStateStatus) {
    focusManager.setFocused(status === 'active');
  }

  const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    unsubscribeNetwork();
    appStateSubscription.remove();
  };
}
