import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

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
      <SymbolView name={icon} size={14} weight="bold" tintColor="#FFFFFF" />
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
  const icon = tierIcon[tier];

  return (
    <ThemedView
      style={[
        styles.detailedBadge,
        { backgroundColor: `${theme[colorKey]}1A`, borderColor: `${theme[colorKey]}40` },
      ]}>
      <SymbolView name={icon} size={14} weight="bold" tintColor={theme[colorKey]} />
      <ThemedText type="smallMedium" style={{ color: theme[colorKey] }}>
        {showDaysAgo
          ? t('common.freshness.lastUpdatedDaysAgo', { days })
          : t(tierTranslationKey[tier])}
      </ThemedText>
    </ThemedView>
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
  detailedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
});
