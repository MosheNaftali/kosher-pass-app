import { Icon } from '@/components/ui/icon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChip } from '@/components/category-chip';
import { EmptyState } from '@/components/empty-state';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { SkeletonCard } from '@/components/skeleton-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radius, Shadows, Spacing } from '@/constants/theme';
import { useDebounce } from '@/hooks/use-debounce';
import { usePersistedCountryIds } from '@/hooks/use-persisted-country-filter';
import {
  flattenProductPages,
  useCountriesQuery,
  useProductsQuery,
} from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useTopInset } from '@/hooks/use-top-inset';
import type { Product } from '@/services/products';
import { track } from '@/services/telemetry';
import {
  CONTINENT_TRANSLATION_KEYS,
  getCountryTranslationKey,
  groupCountriesByContinent,
  type Continent,
  type ContinentGroup,
  type CountryOption,
} from '@/utils/countries';

interface CategoryItem {
  translationKey: string;
  value: string;
}

const COMMON_CATEGORIES: CategoryItem[] = [
  { translationKey: 'common.categories.snacks', value: 'Snacks' },
  { translationKey: 'common.categories.beverages', value: 'Beverages' },
  { translationKey: 'common.categories.dairy', value: 'Dairy' },
  { translationKey: 'common.categories.meat', value: 'Meat' },
  { translationKey: 'common.categories.bakery', value: 'Bakery' },
  { translationKey: 'common.categories.frozen', value: 'Frozen' },
];

const MAX_VISIBLE_COUNTRY_CHIPS = 6;

export default function ProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { contentTopInset } = useTopInset();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState(params.name ?? '');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { selectedCountryIds, setSelectedCountryIds, isHydrated } = usePersistedCountryIds();

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [pendingCountryIds, setPendingCountryIds] = useState<Set<number>>(new Set());
  const [countrySearch, setCountrySearch] = useState('');

  // Server state lives in React Query: it owns cancellation (a superseded
  // search aborts automatically), retry, background refetch and the persisted
  // offline cache. The screen only holds the filter inputs.
  const filters = {
    name: debouncedSearch.trim() || undefined,
    category: selectedCategory ?? undefined,
    countryId: selectedCountryIds.size > 0 ? [...selectedCountryIds].sort((a, b) => a - b) : undefined,
  };

  const productsQuery = useProductsQuery(filters, { enabled: isHydrated });
  const countriesQuery = useCountriesQuery();

  const products = flattenProductPages(productsQuery.data?.pages);
  const countries = countriesQuery.data ?? [];
  const totalResults = productsQuery.data?.pages[0]?.total ?? 0;

  // Cached pages are rendered while a refetch runs, so the skeleton only shows
  // when there is genuinely nothing to display yet. The persisted country
  // filter is held back until it has been read, so the first request is not
  // sent unfiltered and then repeated with the stored selection.
  const showSkeleton = productsQuery.isPending || !isHydrated;
  const error = productsQuery.isError && products.length === 0 ? productsQuery.error : null;

  // Sync the `name` route param into the search field when another screen
  // (Discover search, barcode scan) navigates here while this tab is mounted.
  useEffect(() => {
    if (params.name !== undefined) {
      setSearchQuery(params.name);
    }
  }, [params.name]);

  // Reported once per settled query, not per render. The term itself never
  // leaves the device - its length and the result count are what answer
  // "is the catalog covering what people look for".
  const reportedSearchRef = useRef<string | null>(null);
  useEffect(() => {
    const term = debouncedSearch.trim();
    if (!term || productsQuery.isPending || productsQuery.isError) return;
    if (reportedSearchRef.current === term) return;
    reportedSearchRef.current = term;

    track('search_performed', {
      source: 'products',
      query_length: term.length,
      results_count: totalResults,
    });
    if (totalResults === 0) {
      track('search_zero_results', { source: 'products', query_length: term.length });
    }
  }, [debouncedSearch, productsQuery.isPending, productsQuery.isError, totalResults]);

  function handleLoadMore() {
    if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
      void productsQuery.fetchNextPage();
    }
  }

  function handleProductPress(product: Product) {
    router.push(`/products/${product.id}`);
  }

  function openFilterSheet() {
    setPendingCategory(selectedCategory);
    setPendingCountryIds(new Set(selectedCountryIds));
    setCountrySearch('');
    setFilterSheetOpen(true);
  }

  function applyFilters() {
    setSelectedCategory(pendingCategory);
    setSelectedCountryIds(pendingCountryIds);
    setFilterSheetOpen(false);
    track('filter_applied', {
      countries_count: pendingCountryIds.size,
      has_category: pendingCategory !== null,
    });
  }

  function resetFilters() {
    setPendingCategory(null);
    setPendingCountryIds(new Set());
  }

  function togglePendingCountry(id: number) {
    setPendingCountryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // No manual memoization anywhere below: `experiments.reactCompiler` is on and
  // the compiler inserts it at build time. Hand-written useMemo/useCallback can
  // fight its analysis, and AGENTS.md forbids them without a profiling result.
  const activeFilterCount =
    (selectedCategory ? 1 : 0) + selectedCountryIds.size;

  const allCountries: CountryOption[] = countries
    .map(c => ({
      id: c.id,
      code: c.code,
      continent: c.continent as Continent,
    }))
    .sort((a, b) => (a.code ?? '').localeCompare(b.code ?? ''));

  const countryDisplayName = (country: CountryOption) =>
    t(getCountryTranslationKey(country.code), (country.code ?? '').toUpperCase());

  const continentGroups: ContinentGroup[] = groupCountriesByContinent(allCountries);

  const filteredContinentGroups = (() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return continentGroups;
    return continentGroups
      .map(group => ({
        ...group,
        countries: group.countries.filter(c => {
          const displayName = t(getCountryTranslationKey(c.code), (c.code ?? '').toUpperCase());
          return displayName.toLowerCase().includes(query);
        }),
      }))
      .filter(group => group.countries.length > 0);
  })();

  const activeChips = (() => {
    const chips: { id: string; label: string; onRemove?: () => void; isMore?: boolean }[] = [];
    if (selectedCategory) {
      const cat = COMMON_CATEGORIES.find(c => c.value === selectedCategory);
      if (cat) {
        chips.push({
          id: `category-${selectedCategory}`,
          label: t(cat.translationKey),
          onRemove: () => setSelectedCategory(null),
        });
      }
    }
    const selectedCountries = allCountries.filter(c => selectedCountryIds.has(c.id));
    const visibleCountries = selectedCountries.slice(0, MAX_VISIBLE_COUNTRY_CHIPS);
    const hiddenCount = selectedCountries.length - visibleCountries.length;
    for (const country of visibleCountries) {
      chips.push({
        id: `country-${country.id}`,
        label: countryDisplayName(country),
        onRemove: () =>
          setSelectedCountryIds(prev => {
            const next = new Set(prev);
            next.delete(country.id);
            return next;
          }),
      });
    }
    if (hiddenCount > 0) {
      chips.push({
        id: 'country-more',
        label: t('common.filters.moreSelected', { count: hiddenCount }),
      });
    }
    return chips;
  })();

  return (
    <ThemedView style={[styles.container, { paddingTop: contentTopInset }]}>
      <View style={styles.header}>
        <ThemedText type="hero">{t('products.heroTitle')}</ThemedText>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('products.searchPlaceholder')}
          />
        </View>
        <FilterTrigger
          activeCount={activeFilterCount}
          onPress={openFilterSheet}
          tint={theme.text}
          accent={theme.accent}
          accentForeground={theme.accentForeground}
          surface={theme.surface}
          border={theme.border}
          label={t('common.a11y.openFilters')}
          hint={t('common.filters.activeCount', { count: activeFilterCount })}
        />
      </View>

      {activeChips.length > 0 && (
        <View style={styles.activeChipsWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={activeChips}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.activeChipsList}
            renderItem={({ item }) => (
              <ActiveFilterChip
                label={item.label}
                onPress={item.onRemove ?? openFilterSheet}
                accent={theme.accent}
                accentForeground={theme.accentForeground}
                dismissable={Boolean(item.onRemove)}
                removeHint={t('common.a11y.removeFilter', { name: item.label })}
              />
            )}
          />
        </View>
      )}

      {error ? (
        <EmptyState
          icon="exclamationmark.triangle"
          title={t('common.somethingWentWrong')}
          message={error.message}
        />
      ) : showSkeleton ? (
        <View style={styles.grid}>
          <SkeletonCard count={6} />
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          icon="magnifyingglass"
          title={t('products.noProductsFound')}
          message={t('products.adjustSearch')}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={productsQuery.isRefetching && !productsQuery.isFetchingNextPage}
              onRefresh={() => void productsQuery.refetch()}
              tintColor={theme.textMuted}
            />
          }
          renderItem={({ item, index }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} index={index} onPress={handleProductPress} />
            </View>
          )}
          ListFooterComponent={
            productsQuery.isFetchingNextPage ? (
              <ActivityIndicator style={styles.loader} color={theme.accent} />
            ) : null
          }
        />
      )}

      <Modal
        visible={filterSheetOpen}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setFilterSheetOpen(false)}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFilterSheetOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          />
          <Animated.View
            entering={SlideInDown.duration(280).easing(Easing.out(Easing.cubic))}
            exiting={SlideOutDown.duration(220).easing(Easing.in(Easing.cubic))}
            style={[
              styles.sheet,
              {
                backgroundColor: theme.surface,
                paddingBottom: insets.bottom,
              },
            ]}>
            <View style={styles.sheetHandle}>
              <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.sheetHeader}>
              <ThemedText type="h3">{t('products.filtersTitle')}</ThemedText>
              <Pressable
                onPress={resetFilters}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('products.reset')}>
                <ThemedText type="smallMedium" themeColor="accent">
                  {t('products.reset')}
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetContent}
              contentContainerStyle={styles.sheetContentInner}
              showsVerticalScrollIndicator={false}>

              <FilterSection title={t('products.country')}>
                <View style={styles.sectionSearch}>
                  <SearchBar
                    value={countrySearch}
                    onChangeText={setCountrySearch}
                    placeholder={t('products.searchCountryPlaceholder')}
                  />
                </View>
                {filteredContinentGroups.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.sectionEmpty}>
                    {t('products.noMatches')}
                  </ThemedText>
                ) : (
                  <View style={styles.continentList}>
                    {filteredContinentGroups.map(group => (
                      <ContinentRow
                        key={group.continent}
                        group={group}
                        selectedIds={pendingCountryIds}
                        onToggle={togglePendingCountry}
                        forceExpanded={countrySearch.trim().length > 0}
                        t={t}
                        getCountryDisplayName={countryDisplayName}
                        accent={theme.accent}
                        accentForeground={theme.accentForeground}
                        textInverse={theme.textInverse}
                        textMuted={theme.textMuted}
                        border={theme.borderSubtle}
                      />
                    ))}
                  </View>
                )}
              </FilterSection>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Pressable
                onPress={() => setFilterSheetOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
                style={[styles.footerButton, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText type="bodyMedium" themeColor="text">
                  {t('common.cancel')}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={applyFilters}
                accessibilityRole="button"
                accessibilityLabel={t('products.apply')}
                style={[styles.footerButton, { backgroundColor: theme.accent }]}>
                <ThemedText type="bodyMedium" themeColor="accentForeground">
                  {t('products.apply')}
                </ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </ThemedView>
  );
}

interface FilterTriggerProps {
  activeCount: number;
  onPress: () => void;
  tint: string;
  accent: string;
  accentForeground: string;
  surface: string;
  border: string;
  label: string;
  hint: string;
}

function FilterTrigger({
  activeCount,
  onPress,
  tint,
  accent,
  accentForeground,
  surface,
  border,
  label,
  hint,
}: FilterTriggerProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={activeCount > 0 ? hint : undefined}
      style={({ pressed }) => [
        styles.filterTrigger,
        {
          backgroundColor: surface,
          borderColor: border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Icon
        name={{ ios: 'line.3.horizontal.decrease', android: 'tune', web: 'tune' }}
        size={20}
        weight="medium"
        tintColor={activeCount > 0 ? accent : tint}
      />
      {activeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <ThemedText
            type="label"
            style={[styles.badgeText, { color: accentForeground }]}>
            {activeCount}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

interface ActiveFilterChipProps {
  label: string;
  onPress: () => void;
  accent: string;
  accentForeground: string;
  dismissable: boolean;
  removeHint: string;
}

function ActiveFilterChip({
  label,
  onPress,
  accent,
  accentForeground,
  dismissable,
  removeHint,
}: ActiveFilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={dismissable ? removeHint : undefined}
      style={({ pressed }) => [
        styles.activeChip,
        { backgroundColor: accent, opacity: pressed ? 0.85 : 1 },
      ]}>
      <ThemedText type="smallMedium" style={{ color: accentForeground }}>
        {label}
      </ThemedText>
      {dismissable && (
        <Icon
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          size={12}
          weight="bold"
          tintColor={accentForeground}
        />
      )}
    </Pressable>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSection}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.filterSectionLabel}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

interface ContinentRowProps {
  group: ContinentGroup;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  forceExpanded: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  getCountryDisplayName: (country: CountryOption) => string;
  accent: string;
  accentForeground: string;
  textInverse: string;
  textMuted: string;
  border: string;
}

function ContinentRow({
  group,
  selectedIds,
  onToggle,
  forceExpanded,
  t,
  getCountryDisplayName,
  accent,
  accentForeground,
  textInverse,
  textMuted,
  border,
}: ContinentRowProps) {
  const [open, setOpen] = useState(false);
  const selectedCount = group.countries.filter(c => selectedIds.has(c.id)).length;
  const continentName = t(CONTINENT_TRANSLATION_KEYS[group.continent]);
  // While a search is active every group shown already has a match, so the
  // row is held open to reveal it instead of making the user expand each one.
  const isOpen = forceExpanded || open;
  const continentLabel = t(isOpen ? 'common.a11y.collapseSection' : 'common.a11y.expandSection', {
    name: continentName,
  });
  const hasSelection = selectedCount > 0;
  const hasAutoOpened = useRef(false);

  useEffect(() => {
    if (hasSelection && !hasAutoOpened.current) {
      setOpen(true);
      hasAutoOpened.current = true;
    }
  }, [hasSelection]);

  return (
    <View style={[styles.continentGroup, { borderColor: border }]}>
      <Pressable
        onPress={() => setOpen(prev => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={continentLabel}
        style={({ pressed }) => [styles.continentHeader, pressed && { opacity: 0.7 }]}>
        <View style={styles.continentHeaderLeft}>
          <ThemedText type="bodyMedium" themeColor="text">
            {continentName}
          </ThemedText>
          <View style={[styles.continentBadge, { backgroundColor: hasSelection ? accent : textMuted }]}>
            <ThemedText
              type="label"
              style={[
                styles.continentBadgeText,
                { color: hasSelection ? accentForeground : textInverse },
              ]}>
              {selectedCount}/{group.countries.length}
            </ThemedText>
          </View>
        </View>
        <Icon
          name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
          size={16}
          weight="semibold"
          tintColor={textMuted}
          style={isOpen ? styles.chevronOpen : styles.chevronClosed}
        />
      </Pressable>
      {isOpen && (
        <View style={styles.chipWrap}>
          {group.countries.map(country => (
            <CategoryChip
              key={country.id}
              label={getCountryDisplayName(country)}
              selected={selectedIds.has(country.id)}
              onPress={() => onToggle(country.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  searchInputWrapper: {
    flex: 1,
  },
  filterTrigger: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
  activeChipsWrapper: {
    paddingHorizontal: Spacing.four,
  },
  activeChipsList: {
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.round,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Layout.tabBarHeight + Spacing.six,
    paddingTop: Spacing.four,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  cardWrapper: {
    width: '48%',
  },
  loader: {
    marginVertical: Spacing.four,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    ...Shadows.lg,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  sheetContent: {
    flexGrow: 0,
  },
  sheetContentInner: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.five,
  },
  filterSection: {
    gap: Spacing.three,
  },
  filterSectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSearch: {
    marginBottom: -Spacing.one,
  },
  sectionEmpty: {
    paddingHorizontal: Spacing.three,
  },
  continentList: {
    gap: Spacing.two,
  },
  continentGroup: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  continentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  continentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  continentBadge: {
    minWidth: 36,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronClosed: {
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  continentBadgeText: {
    fontSize: 11,
    lineHeight: 14,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  sheetFooter: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  footerButton: {
    flex: 1,
    paddingVertical: Platform.select({ ios: Spacing.three + 2, default: Spacing.three }),
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
