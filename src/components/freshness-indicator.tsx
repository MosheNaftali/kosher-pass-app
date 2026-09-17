import { Icon } from '@/components/ui/icon';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from './themed-text';

import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getDaysSince, getFreshnessTier, type FreshnessTier } from '@/utils/freshness';

interface FreshnessIndicatorCompactProps {
  updatedAt: string;
}

interface FreshnessIndicatorDetailedProps {
  updatedAt: string;
  showDaysAgo?: boolean;
}

const tierColor: Record<FreshnessTier, ThemeColor> = {
  fresh: 'success',
  aging: 'warning',
  stale: 'warning',
  outdated: 'error',
};

const tierIcon = {
  fresh: { ios: 'checkmark.seal.fill', web: 'verified' },
  aging: { ios: 'clock', web: 'schedule' },
  stale: { ios: 'exclamationmark.triangle.fill', web: 'warning' },
  outdated: { ios: 'exclamationmark.octagon.fill', web: 'report' },
} as const satisfies Record<FreshnessTier, { ios: string; web: string }>;

const tierTranslationKey: Record<FreshnessTier, string> = {
  fresh: 'common.freshness.fresh',
  aging: 'common.freshness.aging',
  stale: 'common.freshness.stale',
  outdated: 'common.freshness.outdated',
};

export function FreshnessIndicator({ updatedAt }: FreshnessIndicatorCompactProps) {
  const theme = useTheme();
  const tier = getFreshnessTier(updatedAt);
  if (tier === 'fresh') return null;

  const colorKey = tierColor[tier];
  const icon = tierIcon[tier];

  return (
    <View
      style={[
        styles.compactBadge,
        { backgroundColor: `${theme[colorKey]}E6`, borderColor: theme.surface },
      ]}
      accessibilityRole="image">
      <Icon name={icon} size={14} weight="bold" tintColor={theme.primaryForeground} />
    </View>
  );
}

export function FreshnessIndicatorDetailed({
  updatedAt,
  showDaysAgo = true,
}: FreshnessIndicatorDetailedProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tier = getFreshnessTier(updatedAt);
  const days = getDaysSince(updatedAt);
  const colorKey = tierColor[tier];

  let label: string;
  if (!Number.isFinite(days) || !showDaysAgo) {
    label = t(tierTranslationKey[tier]);
  } else if (days === 0) {
    label = t('common.freshness.updatedToday');
  } else if (days === 1) {
    label = t('common.freshness.lastUpdatedOneDayAgo');
  } else {
    label = t('common.freshness.lastUpdatedDaysAgo', { days });
  }

  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, { backgroundColor: theme[colorKey] }]} />
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  compactBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.round,
  },
});
