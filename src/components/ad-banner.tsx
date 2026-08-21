import { useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { Config } from '@/constants/config';
import { Layout } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * AdMob banner anchored at the very top of the app, above every screen.
 *
 * - It is laid out **in flow** (see `AppTabs`), so the screen below is pushed
 *   down rather than covered. Nothing of the app's own UI may overlap it:
 *   obscured ads are an AdMob policy violation, not just a cosmetic problem.
 * - Dev builds (`__DEV__`) always use Google's test banner unit.
 * - Release builds read the unit id from `expo.extra.admobBannerUnitId{Ios,Android}`.
 * - The slot keeps its reserved height even when a request fails, so a failed
 *   fill never shifts the whole app up and then down again.
 * - Size is `INLINE_ADAPTIVE_BANNER` at the full device width with an explicit
 *   `maxHeight`. That combination is the only supported way to ask for "full
 *   width, but no taller than this": the *anchored* adaptive sizes derive their
 *   height from the screen height (~90dp on a tall phone) and ignore
 *   `maxHeight`, and a hand-written `<width>x50` custom size has far thinner
 *   inventory and no-fills. If the auction has nothing that fits, it falls back
 *   to a standard 320x50 creative centred in the bar - narrower, never taller.
 * - The height is measured with `onLayout` rather than assumed, so whatever
 *   comes back (32dp to MAX_BANNER_HEIGHT) pushes the app down by exactly that
 *   much. `Layout.adBannerHeight` is only what the slot reserves until the
 *   first ad lands.
 */

/**
 * AdMob's floor for how often a banner may refresh. Requesting a new ad more
 * often than this is an invalid-traffic risk (it inflates impressions without
 * giving anyone time to see them), which is exactly what gets an account
 * suspended - so the configured interval is clamped up to it, never down.
 */
const MIN_REFRESH_SECONDS = 30;

/** How long to wait before re-requesting after a failed load (no impression happened). */
const RETRY_AFTER_MS = 30_000;

/**
 * Ceiling for the adaptive banner. The top of the screen is the app's most
 * valuable space, so the ad gets a standard banner's worth of it and no more.
 */
const MAX_BANNER_HEIGHT = 60;

function resolveUnitId(): string {
  // `adsEnabled` is the master switch: with it off the banner never mounts an
  // ad request, not even the dev test unit.
  if (!Config.adsEnabled) {
    return '';
  }
  if (__DEV__) {
    // Specifically the *adaptive* test unit: `TestIds.BANNER` always serves a
    // 320x50 test creative whatever size is requested, which makes a full-width
    // slot look broken in development.
    return TestIds.ADAPTIVE_BANNER;
  }
  return (
    Platform.select({
      ios: Config.admobBannerUnitIdIos,
      android: Config.admobBannerUnitIdAndroid,
    }) ?? ''
  );
}

const unitId = resolveUnitId();

/**
 * Whether the banner slot exists at all for this build. Resolved once at module
 * load from build-time config, so `AppTabs` can reserve the space up front -
 * before any ad request has had a chance to succeed or fail.
 */
export const isAdBannerAvailable = unitId.length > 0 && Layout.adBannerHeight > 0;

/** `0` when in-app refresh is off and AdMob's own auto-refresh owns the cadence. */
function resolveRefreshMs(): number {
  const seconds = Config.admobBannerRefreshSeconds;
  return seconds > 0 ? Math.max(seconds, MIN_REFRESH_SECONDS) * 1000 : 0;
}

const refreshMs = resolveRefreshMs();

export interface AdBannerProps {
  /**
   * Total measured height of the banner *including* the status-bar padding it
   * absorbs. Adaptive banners size themselves per device, so this is the only
   * reliable source for chrome that has to float below the banner.
   */
  onHeightChange?: (height: number) => void;
}

export function AdBanner({ onHeightChange }: AdBannerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const [nonPersonalizedOnly, setNonPersonalizedOnly] = useState(false);
  const [failedToLoad, setFailedToLoad] = useState(false);
  // Remounting `BannerAd` under a new key is what requests a fresh ad; the
  // component has no imperative reload across SDK versions.
  const [adKey, setAdKey] = useState(0);
  // `0` until the first request is stamped on mount - `Date.now()` must not be
  // called during render.
  const lastRequestAt = useRef(0);
  const failedRef = useRef(false);

  useEffect(() => {
    // iOS App Tracking Transparency. Android/web always resolve to granted.
    requestTrackingPermissionsAsync()
      .then(({ status }) => setNonPersonalizedOnly(status !== 'granted'))
      .catch(() => setNonPersonalizedOnly(true));
  }, []);

  // A route change is the natural refresh point: the user's attention has just
  // moved, and a new ad gets a genuine look instead of being blind-refreshed
  // under a static screen. Rate limiting keeps this policy-safe - navigating
  // rapidly between tabs cannot burn through impressions.
  const route = segments.join('/');
  useEffect(() => {
    if (lastRequestAt.current === 0) {
      // First mount: the initial request is already in flight, nothing to do
      // but start the clock.
      lastRequestAt.current = Date.now();
      return;
    }

    // Nothing is visible while the app is backgrounded, so a request made there
    // would be a wasted (and unviewable) impression.
    if (AppState.currentState !== 'active') {
      return;
    }

    const elapsed = Date.now() - lastRequestAt.current;
    // A failed request produced no impression, so retrying it is always safe;
    // a *successful* one is only replaced when in-app refresh is turned on.
    const interval = failedRef.current ? RETRY_AFTER_MS : refreshMs;
    if (interval === 0 || elapsed < interval) {
      return;
    }

    lastRequestAt.current = Date.now();
    failedRef.current = false;
    setFailedToLoad(false);
    setAdKey(key => key + 1);
  }, [route]);

  return (
    <View
      onLayout={event => onHeightChange?.(event.nativeEvent.layout.height)}
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: theme.surface,
          borderBottomColor: theme.borderSubtle,
        },
      ]}>
      <View style={styles.slot}>
        {isAdBannerAvailable && !failedToLoad ? (
          <BannerAd
            key={adKey}
            unitId={unitId}
            size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
            width={Math.round(width)}
            maxHeight={MAX_BANNER_HEIGHT}
            requestOptions={{ requestNonPersonalizedAdsOnly: nonPersonalizedOnly }}
            onAdLoaded={() => {
              lastRequestAt.current = Date.now();
            }}
            onAdFailedToLoad={() => {
              failedRef.current = true;
              setFailedToLoad(true);
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  slot: {
    width: '100%',
    // A floor, not a fixed height: the bar grows with whatever the auction
    // returns, up to MAX_BANNER_HEIGHT.
    minHeight: Layout.adBannerHeight,
    maxHeight: MAX_BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
