import { Platform, StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from './ui/icon';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTopInset } from '@/hooks/use-top-inset';

export interface BackButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const IconSize = 28;
const IosChevronOpticalOffset = IconSize * 0.07;

/**
 * Floating back affordance for pushed screens.
 *
 * Rendered as a scrim rather than a themed surface so it stays legible over any
 * content a detail screen puts behind it - a product photo, a light header, a
 * dark header - in either color scheme. It positions itself below the ad banner
 * / safe area through `useTopInset`, so callers only provide an `onPress`.
 *
 * SF Symbols draws `chevron.left` left of its layout box (the trailing space
 * keeps chevron pairs aligned), which reads as an off-centre glyph inside this
 * circular button. iOS nudges the glyph right by a fraction of its size; the
 * Material `chevron_left` used on Android and web is already symmetric.
 */
export function BackButton({ onPress, style }: BackButtonProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { contentTopInset } = useTopInset();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('common.a11y.goBack')}
      style={[styles.button, { top: contentTopInset + Spacing.two, backgroundColor: theme.overlay }, style]}>
      <Icon
        name="chevron.left"
        tintColor={theme.overlayForeground}
        size={IconSize}
        weight="semibold"
        style={styles.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: Spacing.four,
    zIndex: 10,
    padding: Spacing.two,
    borderRadius: Radius.round,
  },
  icon: Platform.select({
    ios: { marginLeft: IosChevronOpticalOffset },
    default: {},
  }),
});
