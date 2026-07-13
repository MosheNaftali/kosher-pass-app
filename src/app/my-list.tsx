import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AgencyRow } from '@/components/agency-row';
import { EmptyState } from '@/components/empty-state';
import { QuantityStepper } from '@/components/quantity-stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radius, Shadows, Spacing } from '@/constants/theme';
import { useSavedItems, type ShoppingListItem } from '@/hooks/use-saved-items';
import { useTheme } from '@/hooks/use-theme';
import { API_BASE_URL } from '@/services/api';
import { getAgencies, type Agency } from '@/services/agencies';
import { getProducts, type Product } from '@/services/products';

type TabType = 'shopping' | 'agencies';

export default function MyListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    shoppingList,
    favoriteAgencies,
    removeFromShoppingList,
    updateQuantity,
    togglePurchased,
    clearPurchased,
  } = useSavedItems();

  const [activeTab, setActiveTab] = useState<TabType>('shopping');
  const [products, setProducts] = useState<Product[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [productsData, agenciesData] = await Promise.all([
          getProducts({ page: 1 }),
          getAgencies(),
        ]);
        setProducts(productsData.data);
        setAgencies(agenciesData);
      } catch (error) {
        console.error('Failed to load my list data', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const favoriteAgenciesData = agencies.filter(agency => favoriteAgencies.includes(agency.id));
  const shoppingListItems = shoppingList
    .map(item => ({ item, product: products.find(p => p.id === item.productId) }))
    .filter(({ product }) => product !== undefined) as {
    item: ShoppingListItem;
    product: Product;
  }[];

  const purchasedCount = shoppingList.filter(item => item.purchased).length;

  function handleProductPress(productId: number) {
    router.push(`/products/${productId}`);
  }

  function handleAgencyPress(agency: Agency) {
    router.push(`/agencies/${agency.id}`);
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="hero">{t('mylist.heroTitle')}</ThemedText>
      </View>

      <View style={styles.tabs}>
        <TabButton
          label={t('mylist.shoppingList')}
          active={activeTab === 'shopping'}
          onPress={() => setActiveTab('shopping')}
          badge={shoppingList.length}
        />
        <TabButton
          label={t('mylist.agencies')}
          active={activeTab === 'agencies'}
          onPress={() => setActiveTab('agencies')}
          badge={favoriteAgencies.length}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
      ) : activeTab === 'shopping' ? (
        <>
          {purchasedCount > 0 && (
            <Pressable onPress={clearPurchased} style={styles.clearButton}>
              <ThemedText type="smallMedium" themeColor="accent">
                {t('mylist.clearPurchased', { count: purchasedCount })}
              </ThemedText>
            </Pressable>
          )}

          {shoppingListItems.length === 0 ? (
            <EmptyState
              icon="cart"
              title={t('mylist.emptyListTitle')}
              message={t('mylist.emptyListMessage')}
            />
          ) : (
            <FlatList
              data={shoppingListItems}
              keyExtractor={({ product }) => String(product.id)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: { item, product }, index }) => (
                <Animated.View entering={FadeIn.duration(400).delay(index * 60)}>
                  <ShoppingListRow
                    item={item}
                    product={product}
                    onPress={() => handleProductPress(product.id)}
                    onTogglePurchased={() => togglePurchased(product.id)}
                    onIncrease={() => updateQuantity(product.id, item.quantity + 1)}
                    onDecrease={() => updateQuantity(product.id, item.quantity - 1)}
                    onRemove={() => removeFromShoppingList(product.id)}
                  />
                </Animated.View>
              )}
            />
          )}
        </>
      ) : favoriteAgenciesData.length === 0 ? (
        <EmptyState
          icon="star"
          title={t('mylist.noFavoritesTitle')}
          message={t('mylist.noFavoritesMessage')}
        />
      ) : (
        <FlatList
          data={favoriteAgenciesData}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.duration(400).delay(index * 60)} style={styles.row}>
              <AgencyRow agency={item} onPress={handleAgencyPress} />
            </Animated.View>
          )}
        />
      )}
    </ThemedView>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  badge: number;
}

function TabButton({ label, active, onPress, badge }: TabButtonProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <ThemedView
        type={active ? 'surfaceContrast' : 'surface'}
        style={[styles.tabButtonInner, active && { backgroundColor: theme.surfaceContrast }]}>
        <ThemedText type="smallMedium" themeColor={active ? 'textInverse' : 'textSecondary'}>
          {label}
        </ThemedText>
        {badge > 0 && (
          <ThemedView
            type={active ? 'accent' : 'surfaceElevated'}
            style={styles.badge}>
            <ThemedText type="caption" themeColor={active ? 'primaryForeground' : 'text'}>
              {badge}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </Pressable>
  );
}

interface ShoppingListRowProps {
  item: ShoppingListItem;
  product: Product;
  onPress: () => void;
  onTogglePurchased: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

function ShoppingListRow({
  item,
  product,
  onPress,
  onTogglePurchased,
  onIncrease,
  onDecrease,
  onRemove,
}: ShoppingListRowProps) {
  const theme = useTheme();
  const imageSource = product.imgUrl
    ? product.imgUrl.startsWith('http')
      ? product.imgUrl
      : `${API_BASE_URL}${product.imgUrl}`
    : null;

  return (
    <ThemedView type="surface" style={[styles.rowCard, item.purchased && styles.purchasedCard]}>
      <Pressable onPress={onTogglePurchased} style={styles.checkbox}>
        <SymbolView
          name={item.purchased ? 'checkmark.circle.fill' : 'circle'}
          tintColor={item.purchased ? theme.success : theme.border}
          size={24}
        />
      </Pressable>

      <Pressable onPress={onPress} style={styles.productInfo}>
        {imageSource ? (
          <Image source={{ uri: imageSource }} style={styles.productImage} contentFit="cover" />
        ) : (
          <ThemedView type="surfaceElevated" style={styles.productImagePlaceholder}>
            <SymbolView name="cube.box" tintColor={theme.textMuted} size={20} />
          </ThemedView>
        )}

        <View style={styles.productText}>
          <ThemedText
            type="bodyMedium"
            numberOfLines={1}
            style={item.purchased && styles.strikethrough}>
            {product.name}
          </ThemedText>
          {product.brand && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {product.brand}
            </ThemedText>
          )}
        </View>
      </Pressable>

      <View style={styles.actions}>
        <QuantityStepper
          quantity={item.quantity}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
        />
        <Pressable onPress={onRemove} hitSlop={8}>
          <SymbolView name="trash" tintColor={theme.error} size={18} />
        </Pressable>
      </View>
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
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  tabButton: {
    flex: 1,
  },
  tabButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.round,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.round,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  loader: {
    flex: 1,
  },
  clearButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Layout.bottomTabInset + Spacing.six,
    gap: Spacing.three,
  },
  row: {
    marginBottom: Spacing.three,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    marginBottom: Spacing.three,
    ...Shadows.sm,
  },
  purchasedCard: {
    opacity: 0.7,
  },
  checkbox: {
    padding: Spacing.one,
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
  },
  productImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productText: {
    flex: 1,
    gap: Spacing.half,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
