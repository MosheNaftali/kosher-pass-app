import { useIsRestoring, onlineManager } from '@tanstack/react-query';
import { Icon } from '@/components/ui/icon';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTopInset } from '@/hooks/use-top-inset';

/**
 * Tells the user the app is showing cached data.
 *
 * Without this, an offline session is indistinguishable from a live one - which
 * is dangerous in an app whose answer is "is this kosher?". A certificate that
 * was revoked while the device was offline would still render as valid from
 * cache; the banner is what makes that state legible.
 */
export function OfflineBanner() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { contentTop } = useTopInset();
  const isRestoring = useIsRestoring();
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());

  useEffect(() => onlineManager.subscribe(setIsOnline), []);

  // While the persisted cache is still rehydrating the online state is not
  // settled yet; flashing the banner during startup would be noise.
  if (isOnline || isRestoring) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.container, { top: contentTop + Spacing.two }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <View style={[styles.banner, { backgroundColor: theme.warning }]}>
        <Icon
          name={{ ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }}
          tintColor={theme.textInverse}
          size={16}
        />
        <ThemedText type="smallMedium" themeColor="textInverse" numberOfLines={1}>
          {t('common.offlineBanner')}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    zIndex: 100,
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.round,
  },
});
