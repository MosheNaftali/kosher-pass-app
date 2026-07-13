import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useTheme } from '@/hooks/use-theme';
import { getAgencies, type Agency } from '@/services/agencies';
import { getProducts, type Product } from '@/services/products';
import {
  CONTINENT_TRANSLATION_KEYS,
  groupCountriesByContinent,
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

interface KashrutItem {
  translationKey: string;
  value: string;
}

const KASHRUT_LEVELS: KashrutItem[] = [
  { translationKey: 'common.kashrut.pareve', value: 'pareve' },
  { translationKey: 'common.kashrut.dairy', value: 'dairy' },
  { translationKey: 'common.kashrut.meat', value: 'meat' },
  { translationKey: 'common.kashrut.chalavYisrael', value: 'dairy_chalav_yisrael' },
];

const MAX_VISIBLE_COUNTRY_CHIPS = 6;

export default function ProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; kashrutLevel?: string; mehadrin?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState(params.name ?? '');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedKashrut, setSelectedKashrut] = useState<string | null>(
    params.kashrutLevel ?? null
  );
  const [isMehadrin, setIsMehadrin] = useState(params.mehadrin === 'true');
  const [selectedCountryIds, setSelectedCountryIds] = useState<Set<number>>(new Set());
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [pendingKashrut, setPendingKashrut] = useState<string | null>(null);
  const [pendingMehadrin, setPendingMehadrin] = useState(false);
  const [pendingCountryIds, setPendingCountryIds] = useState<Set<number>>(new Set());
  const [pendingAgencyId, setPendingAgencyId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log(agencies)

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

        setError(null);

        const response = await getProducts({
          page: pageToLoad,
          name: debouncedSearch,
          category: selectedCategory ?? undefined,
        });

        let filtered = response.data;
        if (selectedKashrut) {
          filtered = filtered.filter(product => product.kashrutLevel === selectedKashrut);
        }
        if (isMehadrin) {
          filtered = filtered.filter(product => product.isMehadrin);
        }
        if (selectedCountryIds.size > 0) {
          filtered = filtered.filter(
            product => product.countryId !== null && selectedCountryIds.has(product.countryId.id)
          );
        }
        if (selectedAgencyId) {
          filtered = filtered.filter(product => product.agencyId?.id === selectedAgencyId);
        }

        if (pageToLoad === 1 || shouldRefresh) {
          setProducts(filtered);
        } else {
          setProducts(prev => [...prev, ...filtered]);
        }

        setHasMore(response.page < response.lastPage);
        setPage(pageToLoad);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.somethingWentWrong'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [
      debouncedSearch,
      selectedCategory,
      selectedKashrut,
      isMehadrin,
      selectedCountryIds,
      selectedAgencyId,
      t,
    ]
  );

  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  useEffect(() => {
    getAgencies()
      .then(setAgencies)
      .catch(err => console.error('Failed to load agencies', err));
  }, []);

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

  function openFilterSheet() {
    setPendingCategory(selectedCategory);
    setPendingKashrut(selectedKashrut);
    setPendingMehadrin(isMehadrin);
    setPendingCountryIds(new Set(selectedCountryIds));
    setPendingAgencyId(selectedAgencyId);
    setFilterSheetOpen(true);
  }

  function applyFilters() {
    setSelectedCategory(pendingCategory);
    setSelectedKashrut(pendingKashrut);
    setIsMehadrin(pendingMehadrin);
    setSelectedCountryIds(pendingCountryIds);
    setSelectedAgencyId(pendingAgencyId);
    setFilterSheetOpen(false);
  }

  function resetFilters() {
    setPendingCategory(null);
    setPendingKashrut(null);
    setPendingMehadrin(false);
    setPendingCountryIds(new Set());
    setPendingAgencyId(null);
  }

  function togglePendingKashrut(level: string) {
    setPendingKashrut(prev => (prev === level ? null : level));
  }

  function togglePendingCountry(id: number) {
    setPendingCountryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count += 1;
    if (selectedKashrut) count += 1;
    if (isMehadrin) count += 1;
    if (selectedCountryIds.size > 0) count += selectedCountryIds.size;
    if (selectedAgencyId) count += 1;
    return count;
  }, [selectedCategory, selectedKashrut, isMehadrin, selectedCountryIds, selectedAgencyId]);

  const filteredProducts = products;

  const allCountries = useMemo<CountryOption[]>(() => {
    const map = new Map<number, CountryOption>();
    for (const agency of agencies) {
      const country = agency.countryId;
      if (country && !map.has(country.id)) {
        map.set(country.id, country);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [agencies]);

  const continentGroups = useMemo<ContinentGroup[]>(
    () => groupCountriesByContinent(allCountries),
    [allCountries]
  );

  const availableAgencies = useMemo(() => {
    if (pendingCountryIds.size === 0) return agencies;
    return agencies.filter(
      agency => agency.countryId !== null && pendingCountryIds.has(agency.countryId.id)
    );
  }, [agencies, pendingCountryIds]);

  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove?: () => void; isMore?: boolean }[] = [];
    if (selectedKashrut) {
      const level = KASHRUT_LEVELS.find(k => k.value === selectedKashrut);
      if (level) {
        chips.push({
          id: `kashrut-${selectedKashrut}`,
          label: t(level.translationKey),
          onRemove: () => setSelectedKashrut(null),
        });
      }
    }
    if (isMehadrin) {
      chips.push({
        id: 'mehadrin',
        label: t('common.kashrut.mehadrin'),
        onRemove: () => setIsMehadrin(false),
      });
    }
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
        label: country.label,
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
    if (selectedAgencyId) {
      const agency = agencies.find(a => a.id === selectedAgencyId);
      if (agency) {
        chips.push({
          id: `agency-${selectedAgencyId}`,
          label: agency.name,
          onRemove: () => setSelectedAgencyId(null),
        });
      }
    }
    return chips;
  }, [
    selectedKashrut,
    selectedCategory,
    selectedCountryIds,
    selectedAgencyId,
    isMehadrin,
    agencies,
    allCountries,
    t,
  ]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
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
          surface={theme.surface}
          border={theme.border}
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
                primaryForeground={theme.primaryForeground}
                textInverse={theme.textInverse}
                dismissable={Boolean(item.onRemove)}
              />
            )}
          />
        </View>
      )}

      {error ? (
        <EmptyState icon="exclamationmark.triangle" title={t('common.somethingWentWrong')} message={error} />
      ) : loading ? (
        <View style={styles.grid}>
          <SkeletonCard count={6} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="magnifyingglass"
          title={t('products.noProductsFound')}
          message={t('products.adjustSearch')}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.textMuted} />
          }
          renderItem={({ item, index }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} index={index} onPress={handleProductPress} />
            </View>
          )}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.loader} color={theme.accent} /> : null}
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
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterSheetOpen(false)} />
          <Animated.View
            entering={SlideInDown.duration(280).easing(Easing.out(Easing.cubic))}
            exiting={SlideOutDown.duration(220).easing(Easing.in(Easing.cubic))}
            style={[
              styles.sheet,
              {
                backgroundColor: theme.surface,
                paddingBottom: insets.bottom + Spacing.four,
              },
            ]}>
            <View style={styles.sheetHandle}>
              <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.sheetHeader}>
              <ThemedText type="h3">{t('products.filtersTitle')}</ThemedText>
              <Pressable onPress={resetFilters} hitSlop={8}>
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
                {continentGroups.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('products.noCountries')}
                  </ThemedText>
                ) : (
                  <View style={styles.continentList}>
                    {continentGroups.map(group => (
                      <ContinentRow
                        key={group.continent}
                        group={group}
                        selectedIds={pendingCountryIds}
                        onToggle={togglePendingCountry}
                        t={t}
                        accent={theme.accent}
                        textMuted={theme.textMuted}
                        border={theme.borderSubtle}
                      />
                    ))}
                  </View>
                )}
              </FilterSection>

              <FilterSection title={t('products.agency')}>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.agencyHint}>
                  {t('products.agencyFilterHint')}
                </ThemedText>
                {availableAgencies.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('products.noAgencies')}
                  </ThemedText>
                ) : (
                  <View style={styles.chipWrap}>
                    {availableAgencies.map(agency => (
                      <CategoryChip
                        key={agency.id}
                        label={agency.name}
                        selected={pendingAgencyId === agency.id}
                        onPress={() => setPendingAgencyId(prev => (prev === agency.id ? null : agency.id))}
                      />
                    ))}
                  </View>
                )}
              </FilterSection>

              <FilterSection title={t('products.kashrut')}>
                <View style={styles.chipWrap}>
                  {KASHRUT_LEVELS.map(level => (
                    <CategoryChip
                      key={level.value}
                      label={t(level.translationKey)}
                      selected={pendingKashrut === level.value}
                      onPress={() => togglePendingKashrut(level.value)}
                    />
                  ))}
                </View>
                <View style={styles.chipWrap}>
                  <CategoryChip
                    label={t('common.kashrut.mehadrin')}
                    selected={pendingMehadrin}
                    onPress={() => setPendingMehadrin(prev => !prev)}
                  />
                </View>
              </FilterSection>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Pressable
                onPress={() => setFilterSheetOpen(false)}
                style={[styles.footerButton, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <ThemedText type="bodyMedium" themeColor="text">
                  {t('common.cancel')}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={applyFilters}
                style={[styles.footerButton, { backgroundColor: theme.accent }]}>
                <ThemedText type="bodyMedium" themeColor="primaryForeground">
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
  surface: string;
  border: string;
}

function FilterTrigger({ activeCount, onPress, tint, accent, surface, border }: FilterTriggerProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterTrigger,
        {
          backgroundColor: surface,
          borderColor: border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <SymbolView
        name={{ ios: 'line.3.horizontal.decrease', android: 'tune', web: 'tune' }}
        size={20}
        weight="medium"
        tintColor={activeCount > 0 ? accent : tint}
      />
      {activeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <ThemedText
            type="label"
            style={[styles.badgeText, { color: '#1E2D3D' }]}>
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
  primaryForeground: string;
  textInverse: string;
  dismissable: boolean;
}

function ActiveFilterChip({ label, onPress, accent, primaryForeground, textInverse, dismissable }: ActiveFilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.activeChip,
        { backgroundColor: accent, opacity: pressed ? 0.85 : 1 },
      ]}>
      <ThemedText type="smallMedium" style={{ color: dismissable ? primaryForeground : textInverse }}>
        {label}
      </ThemedText>
      {dismissable && (
        <SymbolView
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          size={12}
          weight="bold"
          tintColor={primaryForeground}
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
  t: (key: string, options?: Record<string, unknown>) => string;
  accent: string;
  textMuted: string;
  border: string;
}

function ContinentRow({ group, selectedIds, onToggle, t, accent, textMuted, border }: ContinentRowProps) {
  const [open, setOpen] = useState(false);
  const selectedCount = group.countries.filter(c => selectedIds.has(c.id)).length;
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
        style={({ pressed }) => [styles.continentHeader, pressed && { opacity: 0.7 }]}>
        <View style={styles.continentHeaderLeft}>
          <ThemedText type="bodyMedium" themeColor="text">
            {t(CONTINENT_TRANSLATION_KEYS[group.continent])}
          </ThemedText>
          <View style={[styles.continentBadge, { backgroundColor: hasSelection ? accent : textMuted }]}>
            <ThemedText type="label" style={[styles.continentBadgeText, { color: hasSelection ? '#1E2D3D' : '#FFFFFF' }]}>
              {selectedCount}/{group.countries.length}
            </ThemedText>
          </View>
        </View>
        <SymbolView
          name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
          size={16}
          weight="semibold"
          tintColor={textMuted}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open && (
        <View style={styles.chipWrap}>
          {group.countries.map(country => (
            <CategoryChip
              key={country.id}
              label={country.label}
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
    paddingBottom: Layout.bottomTabInset + Spacing.six,
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
  continentBadgeText: {
    fontSize: 11,
    lineHeight: 14,
  },
  agencyHint: {
    marginTop: -Spacing.one,
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
