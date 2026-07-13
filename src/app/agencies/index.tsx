import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
import { getAgencies, type Agency } from '@/services/agencies';

export default function AgenciesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { toggleFavoriteAgency, isFavoriteAgency } = useSavedItems();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getAgencies();
      setAgencies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredAgencies = agencies.filter(agency =>
    agency.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  function handleAgencyPress(agency: Agency) {
    router.push(`/agencies/${agency.id}`);
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
        <EmptyState icon="exclamationmark.triangle" title={t('common.somethingWentWrong')} message={error} />
      ) : loading ? (
        <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
      ) : filteredAgencies.length === 0 ? (
        <EmptyState
          icon="magnifyingglass"
          title={t('agencies.noAgenciesFound')}
          message={t('agencies.tryDifferentSearch')}
        />
      ) : (
        <FlatList
          data={filteredAgencies}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.textMuted} />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.duration(400).delay(index * 60)} style={styles.row}>
              <AgencyRow
                agency={item}
                onPress={handleAgencyPress}
                showFavorite
                isFavorite={isFavoriteAgency(item.id)}
                onToggleFavorite={() => toggleFavoriteAgency(item.id)}
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
  row: {
    marginBottom: Spacing.three,
  },
  loader: {
    flex: 1,
  },
});
