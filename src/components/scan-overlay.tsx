import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScanOverlayProps {
  scanning?: boolean;
}

export function ScanOverlay({ scanning = true }: ScanOverlayProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const translateY = useSharedValue(0);

  translateY.value = withRepeat(
    withTiming(200, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
    -1,
    true
  );

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={[styles.corner, styles.cornerTopLeft, { borderColor: theme.accent }]} />
        <View style={[styles.corner, styles.cornerTopRight, { borderColor: theme.accent }]} />
        <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: theme.accent }]} />
        <View style={[styles.corner, styles.cornerBottomRight, { borderColor: theme.accent }]} />

        {scanning && (
          <Animated.View
            style={[
              styles.scanLine,
              { backgroundColor: theme.accent, shadowColor: theme.accent },
              scanLineStyle,
            ]}
          />
        )}
      </View>

      <ThemedText type="bodyMedium" themeColor="textInverse" style={styles.hint}>
        {t('scan.positionBarcode')}
      </ThemedText>
    </View>
  );
}

const FRAME_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  overlay: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderWidth: 4,
    borderRadius: 8,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  hint: {
    marginTop: Spacing.six,
    textAlign: 'center',
    paddingHorizontal: Spacing.five,
  },
});
