import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { CategoryChip } from '@/components/category-chip';
import { EmptyState } from '@/components/empty-state';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radius, Spacing } from '@/constants/theme';
import { useSavedItems } from '@/hooks/use-saved-items';
import { useTheme } from '@/hooks/use-theme';
import { getAgencies, type Agency } from '@/services/agencies';
import { getProducts, type Product } from '@/services/products';

export default function DiscoverScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { favoriteAgencies } = useSavedItems();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [featured, setFeatured] = useState<Product[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [productsResponse, agenciesResponse] = await Promise.all([
        getProducts({ page: 1 }),
        getAgencies(),
      ]);
      setFeatured(productsResponse.data.slice(0, 8));
      setAgencies(agenciesResponse);
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

  function handleProductPress(product: Product) {
    router.push(`/products/${product.id}`);
  }

  function handleSearchSubmit() {
    const query = searchQuery.trim();
    if (!query) return;
    setSearchQuery('');
    router.push({ pathname: '/products', params: { name: query } });
  }

  function handleSeeAllAlerts() {
    router.push('/alerts');
  }

  const favoriteAgenciesData = agencies.filter(agency => favoriteAgencies.includes(agency.id));

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.textMuted} />
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
              <SymbolView
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
        ) : error ? (
          <EmptyState
            icon="exclamationmark.triangle"
            title={t('common.somethingWentWrong')}
            message={error}
          />
        ) : (
          <>
            <SectionHeader
              title={t('alerts.heroTitle')}
              actionLabel={t('common.seeAll')}
              onAction={handleSeeAllAlerts}
            />
            <AlertsPreview />

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
                  <Animated.View entering={FadeIn.duration(400).delay(index * 80)}>
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

function AlertsPreview() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<{ id: string; text: string; type: 'product' | 'agency' }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const productsResponse = await getProducts({ page: 1 });
        const agenciesResponse = await getAgencies();

        const productAlerts = productsResponse.data.slice(0, 3).map(product => ({
          id: `product-${product.id}`,
          text: t('discover.newProductAdded', { name: product.name }),
          type: 'product' as const,
        }));

        const agencyAlerts = agenciesResponse.slice(0, 2).map(agency => ({
          id: `agency-${agency.id}`,
          text: t('discover.agencyNowOn', { name: agency.name }),
          type: 'agency' as const,
        }));

        setAlerts([...productAlerts, ...agencyAlerts].slice(0, 4));
      } catch {
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [t]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} color={theme.accent} />;
  }

  if (alerts.length === 0) {
    return (
      <ThemedView type="surface" style={styles.emptyAlerts}>
        <SymbolView name="bell.slash" tintColor={theme.textMuted} size={24} />
        <ThemedText type="small" themeColor="textSecondary">
          {t('discover.noAlerts')}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="surface" style={styles.alertsCard}>
      {alerts.map(alert => (
        <Pressable
          key={alert.id}
          onPress={() => {
            const [type, id] = alert.id.split('-');
            if (type === 'product') {
              router.push(`/products/${id}`);
            } else {
              router.push(`/agencies/${id}`);
            }
          }}>
          <ThemedView style={styles.alertRow}>
            <SymbolView
              name={alert.type === 'product' ? 'cube.box' : 'building.2'}
              tintColor={theme.accent}
              size={18}
            />
            <ThemedText type="smallMedium" numberOfLines={1} style={styles.alertText}>
              {alert.text}
            </ThemedText>
            <SymbolView
              name="chevron.right"
              tintColor={theme.textMuted}
              size={14}
            />
          </ThemedView>
        </Pressable>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.bottomTabInset + Spacing.six,
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
