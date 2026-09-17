import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from './themed-text';
import { ThemedView, type ThemedViewProps } from './themed-view';

import { KashrutLevelColors, type KashrutLevel, Radius, Spacing } from '@/constants/theme';
import { useTheme, useTintAlpha } from '@/hooks/use-theme';

interface KashrutBadgeProps extends ThemedViewProps {
  level: KashrutLevel;
  size?: 'sm' | 'md';
  showMehadrin?: boolean;
}

const kashrutTranslationKeys: Record<KashrutLevel, string> = {
  unknown: 'common.kashrut.unknown',
  pareve: 'common.kashrut.pareve',
  dairy: 'common.kashrut.dairy',
  meat: 'common.kashrut.meat',
  dairy_chalav_yisrael: 'common.kashrut.chalavYisrael',
};

export function KashrutBadge({ level, size = 'md', showMehadrin, style, ...rest }: KashrutBadgeProps) {
  const theme = useTheme();
  const tintAlpha = useTintAlpha();
  const { t } = useTranslation();
  const colorKey = KashrutLevelColors[level];
  const color = theme[colorKey];

  return (
    <ThemedView
      style={[
        styles.badge,
        { backgroundColor: `${color}${tintAlpha}`, borderColor: `${color}40` },
        size === 'sm' && styles.badgeSmall,
        showMehadrin && styles.badgeWithMehadrin,
        style,
      ]}
      {...rest}>
      <ThemedText style={[styles.label, { color }]} type={size === 'sm' ? 'caption' : 'smallBold'}>
        {t(kashrutTranslationKeys[level])}
      </ThemedText>
      {showMehadrin && (
        <ThemedText style={[styles.mehadrin, { color }]} type="caption">
          {t('common.kashrut.mehadrin')}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.round,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  badgeWithMehadrin: {
    gap: Spacing.two,
  },
  label: {
    textTransform: 'capitalize',
  },
  mehadrin: {
    opacity: 0.9,
  },
});
