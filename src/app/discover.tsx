import { type SFSymbol } from 'expo-symbols';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { CategoryChip } from '@/components/category-chip';
import { EmptyState } from '@/components/empty-state';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radius, Spacing } from '@/constants/theme';
import type { ThemeColor } from '@/constants/theme';
import { useSavedItems } from '@/hooks/use-saved-items';
import { useTheme } from '@/hooks/use-theme';
import { useTopInset } from '@/hooks/use-top-inset';
import {
  flattenProductPages,
  useAlertsQuery,
  useFavoriteAgenciesQuery,
  useProductsQuery,
} from '@/hooks/use-queries';
import type { Product } from '@/services/products';
import { buildAlerts, type AlertSeverity, type FeedAlert } from '@/utils/alerts';
import { staggerDelay } from '@/utils/animation';

const ALERT_SEVERITY_COLOR: Record<AlertSeverity, ThemeColor> = {
  critical: 'error',
  warning: 'warning',
  info: 'accent',
};

const ALERT_SEVERITY_ICON: Record<AlertSeverity, SFSymbol> = {
  critical: 'exclamationmark.octagon.fill',
  warning: 'exclamationmark.triangle.fill',
  info: 'sparkles',
};

export default function DiscoverScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { contentTopInset } = useTopInset();
  const { favoriteAgencies } = useSavedItems();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');

  // One query per resource, shared with every other screen through the cache -
  // this screen used to fire four requests, two of them duplicates of its own.
  const productsQuery = useProductsQuery({});
  // Alerts come from the agencies the user follows, same as the Alerts tab -
  // the preview and the full screen must never disagree about what is on the
  // feed.
  const alertsQuery = useAlertsQuery(favoriteAgencies);
  // Favourites are resolved by id, not filtered out of a page: a favourite
  // outside the first page of the directory would otherwise silently vanish.
  const favoriteAgenciesQuery = useFavoriteAgenciesQuery(favoriteAgencies);

  const featured = flattenProductPages(productsQuery.data?.pages).slice(0, 8);
  const alerts = buildAlerts(alertsQuery.data ?? []).slice(0, 4);
  const favoriteAgenciesData = favoriteAgenciesQuery.data ?? [];

  const loading = productsQuery.isPending;
  const isRefetching =
    productsQuery.isRefetching || alertsQuery.isRefetching || favoriteAgenciesQuery.isRefetching;
  const queryError =
    productsQuery.isError && featured.length === 0 ? productsQuery.error : null;

  function handleRefresh() {
    void productsQuery.refetch();
    void alertsQuery.refetch();
    void favoriteAgenciesQuery.refetch();
  }

  function handleProductPress(product: Product) {
    router.push(`/products/${product.id}`);
  }

  function handleSearchSubmit() {
    const query = searchQuery.trim();
    if (!query) return;
    // No `search_performed` here on purpose: this navigates to the products
    // screen, which runs the query and reports it with the real result count.
    // Emitting a second event for the same intent would double every number in
    // the search funnel.
    setSearchQuery('');
    router.push({ pathname: '/products', params: { name: query } });
  }

  function handleSeeAllAlerts() {
    router.push('/alerts');
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: contentTopInset }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.textMuted}
          />
        }>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <ThemedText type="hero">{t('discover.heroTitle')}</ThemedText>
              <ThemedText type="body" themeColor="textSecondary">
                {t('discover.tagline')}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => router.push('/about')}
              hitSlop={Spacing.four}
              style={styles.aboutButton}
              accessibilityRole="button"
              accessibilityLabel={t('about.heroTitle')}>
              <Icon
                name="info.circle"
                tintColor={theme.textSecondary}
                size={26}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('discover.searchPlaceholder')}
            onSubmit={handleSearchSubmit}
          />
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
        ) : queryError ? (
          <EmptyState
            icon="exclamationmark.triangle"
            title={t('common.somethingWentWrong')}
            message={queryError.message}
          />
        ) : (
          <>
            <SectionHeader
              title={t('alerts.heroTitle')}
              actionLabel={t('common.seeAll')}
              onAction={handleSeeAllAlerts}
            />
            <AlertsPreview alerts={alerts} />

            <SectionHeader title={t('discover.featuredProducts')} />
            {featured.length === 0 ? (
              <EmptyState icon="cube.box" title={t('common.noProductsYet')} />
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={featured}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeIn.duration(400).delay(staggerDelay(index, 80))}>
                    <View style={styles.featuredCard}>
                      <ProductCard product={item} onPress={handleProductPress} />
                    </View>
                  </Animated.View>
                )}
              />
            )}

            {favoriteAgenciesData.length > 0 && (
              <>
                <SectionHeader title={t('discover.yourAgencies')} />
                <View style={styles.agencyGrid}>
                  {favoriteAgenciesData.map(agency => (
                    <CategoryChip
                      key={agency.id}
                      label={agency.name}
                      onPress={() => router.push(`/agencies/${agency.id}`)}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

interface AlertsPreviewProps {
  alerts: FeedAlert[];
}

/**
 * The top few alerts from the agencies the user follows.
 *
 * Shares `buildAlerts` and the same query as the full alerts screen, so the
 * preview can never disagree with what the user sees after tapping "see all".
 * Every row is something an agency published, not something this app inferred
 * from the catalog it happens to hold.
 */
function AlertsPreview({ alerts }: AlertsPreviewProps) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  if (alerts.length === 0) {
    return (
      <ThemedView type="surface" style={styles.emptyAlerts}>
        <Icon name="bell.slash" tintColor={theme.textMuted} size={24} />
        <ThemedText type="small" themeColor="textSecondary">
          {t('discover.noAlerts')}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="surface" style={styles.alertsCard}>
      {alerts.map(alert => {
        const colorKey = ALERT_SEVERITY_COLOR[alert.severity];
        // The publishing agency's own copy - never run through t().
        const title = alert.title;

        return (
          <Pressable
            key={alert.id}
            accessibilityRole="button"
            accessibilityLabel={alert.description ? `${title}. ${alert.description}` : title}
            onPress={() => {
              // The preview navigates in-app only. A 'url' target belongs in
              // an in-app browser, which is the full screen's job - tapping
              // through to it there is the right path for an external notice.
              if (alert.target.type === 'product') {
                router.push(`/products/${alert.target.id}`);
              } else if (alert.target.type === 'agency') {
                router.push(`/agencies/${alert.target.id}`);
              }
            }}>
            <ThemedView style={styles.alertRow}>
              <Icon
                name={ALERT_SEVERITY_ICON[alert.severity]}
                tintColor={theme[colorKey]}
                size={18}
              />
              <ThemedText type="smallMedium" numberOfLines={1} style={styles.alertText}>
                {title}
              </ThemedText>
              <Icon name="chevron.right" tintColor={theme.textMuted} size={14} />
            </ThemedView>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.tabBarHeight + Spacing.six,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.one,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  aboutButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.round,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  loader: {
    marginVertical: Spacing.seven,
  },
  horizontalList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  featuredCard: {
    width: 160,
  },
  agencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  alertsCard: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: 'transparent',
  },
  alertText: {
    flex: 1,
  },
  emptyAlerts: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.lg,
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.two,
  },
});
