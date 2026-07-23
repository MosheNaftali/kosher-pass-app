import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { CertificateBadge } from '@/components/certificate-badge';
import { EmptyState } from '@/components/empty-state';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { SkeletonCard } from '@/components/skeleton-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ExternalLink } from '@/components/external-link';
import { Layout, Radius, Shadows, Spacing } from '@/constants/theme';
import { useDebounce } from '@/hooks/use-debounce';
import { useSavedItems } from '@/hooks/use-saved-items';
import { useTheme } from '@/hooks/use-theme';
import { API_BASE_URL } from '@/services/api';
import { getAgencyById, type Agency } from '@/services/agencies';
import { getCertificates, type Certificate } from '@/services/certificates';
import { getProducts, type Product } from '@/services/products';
import { getCountryTranslationKey } from '@/utils/countries';

export default function AgencyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { toggleFavoriteAgency, isFavoriteAgency } = useSavedItems();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        setMetaError(null);
        const [agencyData, certificatesData] = await Promise.all([
          getAgencyById(id),
          getCertificates(),
        ]);

        setAgency(agencyData);
        if (!agencyData) {
          setMetaError(t('agencies.agencyNotFound'));
        }

        setCertificates(certificatesData.filter(cert => cert.agencyId === id));
      } catch (err) {
        setMetaError(err instanceof Error ? err.message : t('agencies.failedToLoad'));
      } finally {
        setMetaLoading(false);
      }
    }

    loadMeta();
  }, [id, t]);

  const loadProducts = useCallback(
    async (pageToLoad: number, shouldRefresh = false) => {
      try {
        if (shouldRefresh) {
          setRefreshing(true);
        } else if (pageToLoad === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        setProductsError(null);

        const response = await getProducts({
          agencyId: [id],
          name: debouncedSearch,
          page: pageToLoad,
        });

        if (pageToLoad === 1 || shouldRefresh) {
          setProducts(response.data);
        } else {
          setProducts(prev => [...prev, ...response.data]);
        }

        setHasMore(response.page < response.lastPage);
        setPage(pageToLoad);
      } catch (err) {
        setProductsError(err instanceof Error ? err.message : t('agencies.failedToLoad'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [id, debouncedSearch, t]
  );

  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  function handleLoadMore() {
    if (!loading && !loadingMore && hasMore) {
      loadProducts(page + 1);
    }
  }

  function handleRefresh() {
    loadProducts(1, true);
  }

  function handleProductPress(product: Product) {
    router.push(`/products/${product.id}`);
  }

  if (metaLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
      </ThemedView>
    );
  }

  if (metaError || !agency) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState icon="exclamationmark.triangle" title={t('common.oops')} message={metaError ?? t('agencies.agencyNotFound')} />
      </ThemedView>
    );
  }

  const logoSource = agency.logoUrl
    ? agency.logoUrl.startsWith('http')
      ? agency.logoUrl
      : `${API_BASE_URL}${agency.logoUrl}`
    : null;

  const isFavorite = isFavoriteAgency(agency.id);

  const listHeader = (
    <View>
      <ThemedView type="surface" style={styles.headerCard}>
        {logoSource ? (
          <Image source={{ uri: logoSource }} style={styles.logo} contentFit="contain" />
        ) : (
          <ThemedView type="surfaceElevated" style={styles.logoPlaceholder}>
            <SymbolView name="building.2.fill" tintColor={theme.textMuted} size={40} />
          </ThemedView>
        )}

        <View style={styles.titleSection}>
          <ThemedText type="h2">{agency.name}</ThemedText>
          {agency.countryId && (
            <ThemedText type="body" themeColor="textSecondary">
              {t(getCountryTranslationKey(agency.countryId.code), (agency.countryId.code ?? '').toUpperCase())}
            </ThemedText>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => toggleFavoriteAgency(agency.id)}
            style={[styles.favoriteButton, { backgroundColor: theme.surfaceElevated }]}>
            <SymbolView
              name={isFavorite ? 'star.fill' : 'star'}
              tintColor={isFavorite ? theme.accent : theme.textMuted}
              size={22}
            />
            <ThemedText type="smallMedium" themeColor={isFavorite ? 'accent' : 'textSecondary'}>
              {isFavorite ? t('agencies.following') : t('agencies.follow')}
            </ThemedText>
          </Pressable>

          {agency.websiteUrl && (
            <ExternalLink href={agency.websiteUrl} asChild>
              <Pressable style={[styles.websiteButton, { backgroundColor: theme.surfaceElevated }]}>
                <SymbolView name="globe" tintColor={theme.textMuted} size={20} />
                <ThemedText type="smallMedium" themeColor="textSecondary">
                  {t('agencies.website')}
                </ThemedText>
              </Pressable>
            </ExternalLink>
          )}
        </View>

        {agency.contactInfo && (
          <View style={styles.contactRow}>
            <SymbolView name="envelope" tintColor={theme.textMuted} size={16} />
            <ThemedText type="small" themeColor="textSecondary">
              {agency.contactInfo}
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {certificates.length > 0 && (
        <ThemedView type="surface" style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {t('agencies.certificates')}
          </ThemedText>
          {certificates.map(cert => (
            <View key={cert.id} style={styles.certificateRow}>
              <CertificateBadge status={cert.status} />
              <ThemedText type="small" themeColor="textSecondary">
                {cert.certificateCode ?? t('agencies.certificateFallback', { id: cert.id })}
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      )}

      <View style={styles.productsHeader}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          {t('agencies.productsFrom', { name: agency.name })}
        </ThemedText>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('agencies.searchProductsPlaceholder')}
        />
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <SymbolView name="chevron.left" tintColor={theme.text} size={28} weight="semibold" />
      </Pressable>

      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.textMuted} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProductCard product={item} onPress={handleProductPress} />
          </View>
        )}
        ListEmptyComponent={
          productsError ? (
            <EmptyState
              icon="exclamationmark.triangle"
              title={t('common.somethingWentWrong')}
              message={productsError}
            />
          ) : loading ? (
            <View style={styles.skeletonGrid}>
              <SkeletonCard count={4} />
            </View>
          ) : (
            <EmptyState
              icon="magnifyingglass"
              title={debouncedSearch ? t('agencies.noProductsFound') : t('agencies.noProductsYet')}
              message={debouncedSearch ? t('agencies.tryDifferentSearch') : undefined}
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={theme.accent} />
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Layout.bottomTabInset + Spacing.six,
  },
  loader: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: Spacing.four,
    zIndex: 10,
    padding: Spacing.two,
    borderRadius: Radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerCard: {
    marginTop: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.four,
    ...Shadows.md,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.round,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.round,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  section: {
    marginTop: Spacing.four,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    marginBottom: Spacing.one,
  },
  certificateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  productsHeader: {
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  cardWrapper: {
    width: '48%',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  footerLoader: {
    marginVertical: Spacing.four,
  },
});
