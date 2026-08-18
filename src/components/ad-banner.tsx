import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { Config } from '@/constants/config';
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
  // `adsEnabled` is the master switch: with it off the banner never mounts an
  // ad request, not even the dev test unit.
  if (!Config.adsEnabled) {
    return '';
  }
  if (__DEV__) {
    return TestIds.BANNER;
  }
  return (
    Platform.select({
      ios: Config.admobBannerUnitIdIos,
      android: Config.admobBannerUnitIdAndroid,
    }) ?? ''
  );
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
