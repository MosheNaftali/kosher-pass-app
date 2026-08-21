import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AlertDetailSheet } from '@/components/alert-detail-sheet';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radius, Spacing } from '@/constants/theme';
import type { ThemeColor } from '@/constants/theme';
import { useAlertsQuery, useFavoriteAgenciesQuery } from '@/hooks/use-queries';
import { useSavedItems } from '@/hooks/use-saved-items';
import { useTheme } from '@/hooks/use-theme';
import { useTopInset } from '@/hooks/use-top-inset';
import { staggerDelay } from '@/utils/animation';
import { buildAlerts, type AlertSeverity, type FeedAlert } from '@/utils/alerts';

const SEVERITY_COLOR: Record<AlertSeverity, ThemeColor> = {
  critical: 'error',
  warning: 'warning',
  info: 'accent',
};

const SEVERITY_ICON: Record<AlertSeverity, SFSymbol> = {
  critical: 'exclamationmark.octagon.fill',
  warning: 'exclamationmark.triangle.fill',
  info: 'sparkles',
};

export default function AlertsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { contentTopInset } = useTopInset();
  const { t } = useTranslation();

  // The feed is scoped to the agencies this user follows. An alert from a
  // supervisor whose hechsher they do not rely on is noise, and burying a real
  // recall under it is the failure mode that matters here.
  const { favoriteAgencies } = useSavedItems();
  const followsNobody = favoriteAgencies.length === 0;

  // The alert whose detail sheet is open, or null. Holding the whole row here
  // rather than an id keeps the sheet readable while a refetch is in flight:
  // the feed can reorder underneath it without the sheet blanking out.
  const [selectedAlert, setSelectedAlert] = useState<FeedAlert | null>(null);

  const alertsQuery = useAlertsQuery(favoriteAgencies);
  // Already cached by My List; used to attribute each alert to its publisher.
  const agenciesQuery = useFavoriteAgenciesQuery(favoriteAgencies);

  const agencyNames = new Map(
    (agenciesQuery.data ?? []).map(agency => [agency.id, agency.name])
  );

  const alerts = buildAlerts(alertsQuery.data ?? []);

  const loading = !followsNobody && alertsQuery.isPending;
  const isRefetching = alertsQuery.isRefetching;
  const error = alertsQuery.isError && alerts.length === 0 ? alertsQuery.error : null;

  function handleRefresh() {
    // Nothing to pull for when the follow list is empty: the feed is scoped to
    // it, and an unscoped request would return every agency's alerts. Following
    // an agency changes the query key, which refetches on its own.
    if (followsNobody) return;
    void alertsQuery.refetch();
    void agenciesQuery.refetch();
  }

  // Every row now opens the notice itself instead of acting on its target.
  // What the agency published is the thing the reader asked for; jumping
  // straight to a website - or, on a targetless alert, doing nothing at all -
  // answered a question they had not asked yet.
  function handleAlertPress(alert: FeedAlert) {
    setSelectedAlert(alert);
  }

  function handleFollowTarget(alert: FeedAlert) {
    setSelectedAlert(null);
    switch (alert.target.type) {
      case 'product':
        router.push(`/products/${alert.target.id}`);
        return;
      case 'agency':
        router.push(`/agencies/${alert.target.id}`);
        return;
      default:
        // A url or targetless alert has no in-app destination; the sheet does
        // not offer this action for one.
        return;
    }
  }

  async function handleOpenSource(url: string) {
    // Same in-app-browser pattern as `ExternalLink`: on native, open the
    // link without leaving the app; on web, a normal navigation already
    // opens it as a new tab-worthy link, so there is nothing extra to do.
    if (process.env.EXPO_OS !== 'web') {
      await openBrowserAsync(url, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    } else if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: contentTopInset }]}>
      <View style={styles.header}>
        <ThemedText type="hero">{t('alerts.heroTitle')}</ThemedText>
        {/*
          Alerts is the app's landing tab, so it carries the entry point to the
          About screen - the same top-right slot it occupied on Discover.
        */}
        <Pressable
          onPress={() => router.push('/alerts/about')}
          hitSlop={Spacing.four}
          style={styles.aboutButton}
          accessibilityRole="button"
          accessibilityLabel={t('about.heroTitle')}>
          <SymbolView name="info.circle" tintColor={theme.textSecondary} size={26} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
      ) : (
        /*
          The empty states live inside the list rather than replacing it, so
          the pull-to-refresh gesture survives them. Swiping down to retry is
          most wanted exactly when the screen is empty - after a failed
          request, or while waiting on an agency to publish something - and a
          plain View there has nothing to pull.
        */
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            // flexGrow lets the empty state take the whole viewport and centre
            // itself; without it, it sits squashed under the header.
            alerts.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={theme.textMuted}
            />
          }
          ListEmptyComponent={
            followsNobody ? (
              // Not an error and not an empty feed - there is simply nothing to
              // ask the server for yet.
              <EmptyState
                icon="star"
                title={t('alerts.noAgenciesFollowedTitle')}
                message={t('alerts.noAgenciesFollowedMessage')}
              />
            ) : error ? (
              <EmptyState
                icon="exclamationmark.triangle"
                title={t('common.somethingWentWrong')}
                message={error.message}
              />
            ) : (
              <EmptyState
                icon="checkmark.seal"
                title={t('alerts.noAlertsTitle')}
                message={t('alerts.noAlertsMessage')}
              />
            )
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.duration(400).delay(staggerDelay(index))}>
              <AlertRow
                alert={item}
                agencyName={item.agencyId ? agencyNames.get(item.agencyId) : undefined}
                onPress={() => handleAlertPress(item)}
              />
            </Animated.View>
          )}
        />
      )}

      <AlertDetailSheet
        alert={selectedAlert}
        agencyName={
          selectedAlert?.agencyId ? agencyNames.get(selectedAlert.agencyId) : undefined
        }
        onClose={() => setSelectedAlert(null)}
        onFollowTarget={handleFollowTarget}
        onOpenSource={url => void handleOpenSource(url)}
      />
    </ThemedView>
  );
}

function AlertRow({
  alert,
  agencyName,
  onPress,
}: {
  alert: FeedAlert;
  agencyName?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  const colorKey = SEVERITY_COLOR[alert.severity];
  // Every string on this row is the publishing agency's own copy, never one of
  // this app's translated strings, so none of it goes through t(). Translating
  // a kashrut notice would mean rewording a claim we did not make.
  const title = alert.title;
  // Plenty of agencies publish a headline and an image and no prose at all;
  // attributing the notice to its publisher is more useful than a blank line.
  const subtitle = alert.description || agencyName || '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityHint={t('alerts.a11y.openDetail')}>
      <ThemedView
        type="surface"
        style={[
          styles.alertCard,
          // A recall is the one thing in this app that must not be skimmed
          // past, so it carries a coloured edge as well as an icon.
          alert.severity === 'critical' && {
            borderLeftWidth: 3,
            borderLeftColor: theme[colorKey],
          },
        ]}>
        <View style={[styles.iconContainer, { backgroundColor: `${theme[colorKey]}1A` }]}>
          {alert.imageUrl ? (
            <Image source={{ uri: alert.imageUrl }} style={styles.iconImage} contentFit="cover" />
          ) : (
            <SymbolView
              name={SEVERITY_ICON[alert.severity]}
              tintColor={theme[colorKey]}
              size={22}
            />
          )}
        </View>

        <View style={styles.textContainer}>
          <ThemedText type="bodyMedium" themeColor={colorKey}>
            {title}
          </ThemedText>
          {subtitle.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {subtitle}
            </ThemedText>
          )}
        </View>

        <SymbolView name="chevron.right" tintColor={theme.textMuted} size={16} />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  aboutButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    flex: 1,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Layout.tabBarHeight + Spacing.six,
    gap: Spacing.three,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    marginBottom: Spacing.three,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.round,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: 44,
    height: 44,
    borderRadius: Radius.round,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.half,
  },
});
