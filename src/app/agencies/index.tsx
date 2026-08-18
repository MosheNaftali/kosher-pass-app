import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AgencyRow } from '@/components/agency-row';
import { EmptyState } from '@/components/empty-state';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Spacing } from '@/constants/theme';
import { useDebounce } from '@/hooks/use-debounce';
import { useSavedItems } from '@/hooks/use-saved-items';
import { useTheme } from '@/hooks/use-theme';
import { flattenAgencyPages, useAgenciesQuery } from '@/hooks/use-queries';
import type { Agency } from '@/services/agencies';
import { track } from '@/services/telemetry';
import { staggerDelay } from '@/utils/animation';
import { groupAgenciesByCountry } from '@/utils/agencies';
import { getCountryTranslationKey } from '@/utils/countries';

/**
 * Pages the screen pulls on its own before falling back to scroll-driven
 * paging. Grouping by country is only correct over the whole directory - a
 * country's agencies can land on any page - but an unbounded auto-load would
 * turn a large directory into one long stall, so the sweep is capped.
 */
const MAX_AUTO_PAGES = 10;

export default function AgenciesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { toggleFavoriteAgency, isFavoriteAgency } = useSavedItems();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  // The search runs on the server now. Filtering a client-side array only ever
  // searched the rows already downloaded, which stopped being the whole
  // directory once the endpoint became paginated.
  const agenciesQuery = useAgenciesQuery({ name: debouncedSearch.trim() || undefined });
  const agencies = flattenAgencyPages(agenciesQuery.data?.pages);
  // Cached agencies stay on screen during a refetch, so the error state only
  // takes over when there is genuinely nothing to show.
  const error = agenciesQuery.isError && agencies.length === 0 ? agenciesQuery.error : null;

  const loadedPages = agenciesQuery.data?.pages.length ?? 0;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = agenciesQuery;

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && loadedPages < MAX_AUTO_PAGES) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, loadedPages, fetchNextPage]);

  // Countries are ordered by their translated name, so the grouping has to be
  // rebuilt when the locale changes - `t` is part of the input, not a constant.
  const sections = groupAgenciesByCountry(agencies, code =>
    code
      ? t(getCountryTranslationKey(code), code.toUpperCase())
      : t('agencies.unknownCountry')
  );

  function handleLoadMore() {
    if (agenciesQuery.hasNextPage && !agenciesQuery.isFetchingNextPage) {
      void agenciesQuery.fetchNextPage();
    }
  }

  function handleAgencyPress(agency: Agency) {
    track('agency_viewed', { agency_id: agency.id });
    router.push(`/agencies/${agency.id}`);
  }

  function handleToggleFavorite(agency: Agency) {
    // Read before the toggle, so the event carries the resulting state.
    const favorited = !isFavoriteAgency(agency.id);
    toggleFavoriteAgency(agency.id);
    track('agency_favorited', { agency_id: agency.id, favorited });
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="hero">{t('agencies.heroTitle')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('agencies.subtitle')}
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('agencies.searchPlaceholder')}
        />
      </View>

      {error ? (
        <EmptyState
          icon="exclamationmark.triangle"
          title={t('common.somethingWentWrong')}
          message={error.message}
        />
      ) : agenciesQuery.isPending ? (
        <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
      ) : agencies.length === 0 ? (
        <EmptyState
          icon="magnifyingglass"
          title={t('agencies.noAgenciesFound')}
          message={t('agencies.tryDifferentSearch')}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={agenciesQuery.isRefetching && !agenciesQuery.isFetchingNextPage}
              onRefresh={() => void agenciesQuery.refetch()}
              tintColor={theme.textMuted}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            agenciesQuery.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footerLoader} color={theme.accent} />
            ) : null
          }
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                {section.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textMuted">
                {section.data.length}
              </ThemedText>
            </View>
          )}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeIn.duration(400).delay(staggerDelay(index))}
              style={styles.row}>
              <AgencyRow
                agency={item}
                onPress={handleAgencyPress}
                showFavorite
                isFavorite={isFavoriteAgency(item.id)}
                onToggleFavorite={() => handleToggleFavorite(item)}
              />
            </Animated.View>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.one,
  },
  searchContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Layout.bottomTabInset + Spacing.six,
    paddingTop: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    flexShrink: 1,
  },
  row: {
    marginBottom: Spacing.three,
  },
  loader: {
    flex: 1,
  },
  footerLoader: {
    marginVertical: Spacing.four,
  },
});
