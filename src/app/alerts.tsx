import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getAgencies, type Agency } from '@/services/agencies';
import { getProducts, type Product } from '@/services/products';

interface AlertItem {
  id: string;
  text: string;
  subtext?: string;
  type: 'product' | 'agency';
  timestamp: string;
}

export default function AlertsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [productsData, agenciesData] = await Promise.all([
        getProducts({ page: 1 }),
        getAgencies(),
      ]);

      const items: AlertItem[] = [
        ...productsData.data.slice(0, 6).map((product: Product) => ({
          id: `product-${product.id}`,
          text: t('alerts.newProduct'),
          subtext: product.name,
          type: 'product' as const,
          timestamp: product.createdAt,
        })),
        ...agenciesData.slice(0, 4).map((agency: Agency) => ({
          id: `agency-${agency.id}`,
          text: t('alerts.agencyJoined'),
          subtext: agency.name,
          type: 'agency' as const,
          timestamp: agency.createdAt,
        })),
      ];

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAlerts(items);
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

  function handleAlertPress(alert: AlertItem) {
    const [type, id] = alert.id.split('-');
    if (type === 'product') {
      router.push(`/products/${id}`);
    } else {
      router.push(`/agencies/${id}`);
    }
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <SymbolView name="chevron.left" tintColor={theme.text} size={28} weight="semibold" />
        </Pressable>
        <ThemedText type="hero">{t('alerts.heroTitle')}</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
      ) : error ? (
        <EmptyState icon="exclamationmark.triangle" title={t('common.somethingWentWrong')} message={error} />
      ) : alerts.length === 0 ? (
        <EmptyState icon="bell.slash" title={t('alerts.noAlertsTitle')} message={t('alerts.noAlertsMessage')} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.textMuted} />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.duration(400).delay(index * 60)}>
              <Pressable onPress={() => handleAlertPress(item)}>
                <ThemedView type="surface" style={styles.alertCard}>
                  <ThemedView
                    type="surfaceElevated"
                    style={styles.iconContainer}>
                    <SymbolView
                      name={item.type === 'product' ? 'cube.box' : 'building.2'}
                      tintColor={theme.accent}
                      size={22}
                    />
                  </ThemedView>

                  <View style={styles.textContainer}>
                    <ThemedText type="bodyMedium">{item.text}</ThemedText>
                    {item.subtext && (
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {item.subtext}
                      </ThemedText>
                    )}
                  </View>

                  <SymbolView name="chevron.right" tintColor={theme.textMuted} size={16} />
                </ThemedView>
              </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  loader: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Layout.bottomTabInset + Spacing.six,
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
  },
  textContainer: {
    flex: 1,
    gap: Spacing.half,
  },
});
