import { Icon } from '@/components/ui/icon';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
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
import { useTopInset } from '@/hooks/use-top-inset';
import {
  flattenProductPages,
  useAgencyQuery,
  useAgencyCertificatesQuery,
  useProductsQuery,
} from '@/hooks/use-queries';
import { isSafeExternalUrl, resolveMediaUrl } from '@/services/api';
import type { Product } from '@/services/products';
import { getCountryTranslationKey } from '@/utils/countries';

export default function AgencyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { contentTopInset } = useTopInset();
  const { t } = useTranslation();
  const { toggleFavoriteAgency, isFavoriteAgency } = useSavedItems();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const agencyQuery = useAgencyQuery(id ?? '');
  const certificatesQuery = useAgencyCertificatesQuery(id ?? '');
  const productsQuery = useProductsQuery({
    agencyId: [id],
    name: debouncedSearch.trim() || undefined,
  });

  const agency = agencyQuery.data ?? null;
  // Scoped server-side now: this used to download every certificate in the
  // system and filter client-side.
  const certificates = certificatesQuery.data ?? [];
  const products = flattenProductPages(productsQuery.data?.pages);

  const metaLoading = agencyQuery.isPending;
  const metaError = agencyQuery.isError
    ? agencyQuery.error.message
    : agencyQuery.isSuccess && agency === null
      ? t('agencies.agencyNotFound')
      : null;

  const productsError =
    productsQuery.isError && products.length === 0 ? productsQuery.error : null;

  function handleLoadMore() {
    if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
      void productsQuery.fetchNextPage();
    }
  }

  function handleRefresh() {
    void agencyQuery.refetch();
    void certificatesQuery.refetch();
    void productsQuery.refetch();
  }

  function handleProductPress(product: Product) {
    router.push(`/products/${product.id}`);
  }

  if (metaLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: contentTopInset }]}>
        <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
      </ThemedView>
    );
  }

  if (metaError || !agency) {
    return (
      <ThemedView style={[styles.container, { paddingTop: contentTopInset }]}>
        <EmptyState icon="exclamationmark.triangle" title={t('common.oops')} message={metaError ?? t('agencies.agencyNotFound')} />
      </ThemedView>
    );
  }

  const logoSource = resolveMediaUrl(agency.logoUrl);
  // Server-supplied, so the scheme is checked before it can reach a browser.
  const websiteUrl = isSafeExternalUrl(agency.websiteUrl) ? agency.websiteUrl : null;

  const isFavorite = isFavoriteAgency(agency.id);

  const listHeader = (
    <View>
      <ThemedView type="surface" style={styles.headerCard}>
        {logoSource ? (
          <Image source={{ uri: logoSource }} style={styles.logo} contentFit="contain" />
        ) : (
          <ThemedView type="surfaceElevated" style={styles.logoPlaceholder}>
            <Icon name="building.2.fill" tintColor={theme.textMuted} size={40} />
          </ThemedView>
        )}

        <View style={styles.titleSection}>
          <ThemedText type="h2">{agency.name}</ThemedText>
          {agency.country && (
            <ThemedText type="body" themeColor="textSecondary">
              {t(getCountryTranslationKey(agency.country.code), (agency.country.code ?? '').toUpperCase())}
            </ThemedText>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => toggleFavoriteAgency(agency.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isFavorite }}
            accessibilityLabel={t(
              isFavorite ? 'common.a11y.removeFromFavorites' : 'common.a11y.addToFavorites'
            )}
            style={[styles.favoriteButton, { backgroundColor: theme.surfaceElevated }]}>
            <Icon
              name={isFavorite ? 'star.fill' : 'star'}
              tintColor={isFavorite ? theme.accent : theme.textMuted}
              size={22}
            />
            <ThemedText type="smallMedium" themeColor={isFavorite ? 'accent' : 'textSecondary'}>
              {isFavorite ? t('agencies.following') : t('agencies.follow')}
            </ThemedText>
          </Pressable>

          {websiteUrl && (
            <ExternalLink href={websiteUrl} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={t('agencies.website')}
                style={[styles.websiteButton, { backgroundColor: theme.surfaceElevated }]}>
                <Icon name="globe" tintColor={theme.textMuted} size={20} />
                <ThemedText type="smallMedium" themeColor="textSecondary">
                  {t('agencies.website')}
                </ThemedText>
              </Pressable>
            </ExternalLink>
          )}
        </View>

        {agency.contactInfo && (
          <View style={styles.contactRow}>
            <Icon name="envelope" tintColor={theme.textMuted} size={16} />
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
    <ThemedView style={[styles.container, { paddingTop: contentTopInset }]}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('common.a11y.goBack')}
        style={styles.backButton}>
        <Icon name="chevron.left" tintColor={theme.text} size={28} weight="semibold" />
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
          <RefreshControl
            refreshing={
              (productsQuery.isRefetching && !productsQuery.isFetchingNextPage) ||
              agencyQuery.isRefetching
            }
            onRefresh={handleRefresh}
            tintColor={theme.textMuted}
          />
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
              message={productsError.message}
            />
          ) : productsQuery.isPending ? (
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
          productsQuery.isFetchingNextPage ? (
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
    paddingBottom: Layout.tabBarHeight + Spacing.six,
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
