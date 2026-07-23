import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { Layout } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Anchored AdMob banner rendered above the bottom tab bar.
 *
 * - Dev builds (`__DEV__`) always use Google's test banner unit.
 * - Release builds read the unit id from `expo.extra.admobBannerUnitId{Ios,Android}`.
 *   When no unit id is configured (or the ad fails to load), nothing is rendered,
 *   but screens keep the reserved `Layout.adBannerHeight` bottom padding.
 * - Size is the fixed 320x50 standard banner so the reserved layout space is
 *   deterministic across devices. To switch to `ANCHORED_ADAPTIVE_BANNER`
 *   later, measure the height at runtime and feed it through context instead
 *   of the static `Layout.adBannerHeight` constant.
 */

function resolveUnitId(): string {
  if (__DEV__) {
    return TestIds.BANNER;
  }
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const unitId = Platform.select({
    ios: extra?.admobBannerUnitIdIos,
    android: extra?.admobBannerUnitIdAndroid,
  });
  return typeof unitId === 'string' ? unitId : '';
}

export function AdBanner() {
  const theme = useTheme();
  const [nonPersonalizedOnly, setNonPersonalizedOnly] = useState(false);
  const [failedToLoad, setFailedToLoad] = useState(false);

  const unitId = resolveUnitId();

  useEffect(() => {
    // iOS App Tracking Transparency. Android/web always resolve to granted.
    requestTrackingPermissionsAsync()
      .then(({ status }) => setNonPersonalizedOnly(status !== 'granted'))
      .catch(() => setNonPersonalizedOnly(true));
  }, []);

  if (!unitId || failedToLoad) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderTopColor: theme.borderSubtle },
      ]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: nonPersonalizedOnly }}
        onAdFailedToLoad={() => setFailedToLoad(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Sits directly above the tab bar: total reserved inset minus this banner's height.
    bottom: Layout.bottomTabInset - Layout.adBannerHeight,
    height: Layout.adBannerHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
