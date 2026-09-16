import { Icon } from '@/components/ui/icon';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getDaysSince, getFreshnessTier } from '@/utils/freshness';

interface FreshnessAlertProps {
  updatedAt: string;
}

type AlertTier = 'stale' | 'outdated';

const tierColor: Record<AlertTier, ThemeColor> = {
  stale: 'warning',
  outdated: 'error',
};

const tierIcon = {
  stale: { ios: 'exclamationmark.triangle.fill', web: 'warning' },
  outdated: { ios: 'exclamationmark.octagon.fill', web: 'report' },
} as const satisfies Record<AlertTier, { ios: string; web: string }>;

export function FreshnessAlert({ updatedAt }: FreshnessAlertProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const tier = getFreshnessTier(updatedAt);
  if (tier !== 'stale' && tier !== 'outdated') return null;

  const colorKey = tierColor[tier];
  const days = getDaysSince(updatedAt);
  const titleKey =
    tier === 'stale'
      ? 'common.freshness.staleAlertTitle'
      : 'common.freshness.outdatedAlertTitle';
  const bodyKey =
    tier === 'stale'
      ? 'common.freshness.staleAlertBody'
      : 'common.freshness.outdatedAlertBody';

  return (
    <ThemedView
      style={[
        styles.banner,
        { backgroundColor: `${theme[colorKey]}14`, borderColor: `${theme[colorKey]}55` },
      ]}>
      <View style={styles.iconWrap}>
        <Icon
          name={tierIcon[tier]}
          size={18}
          weight="bold"
          tintColor={theme[colorKey]}
        />
      </View>
      <View style={styles.textWrap}>
        <ThemedText type="smallBold" style={{ color: theme[colorKey] }}>
          {t(titleKey, { days })}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {t(bodyKey)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  iconWrap: {
    paddingTop: 1,
  },
  textWrap: {
    flex: 1,
    gap: Spacing.one,
  },
});
