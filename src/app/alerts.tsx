import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
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

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radius, Spacing } from '@/constants/theme';
import type { ThemeColor } from '@/constants/theme';
import {
  flattenProductPages,
  useCertificatesQuery,
  useProductsQuery,
} from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { staggerDelay } from '@/utils/animation';
import { buildAlerts, type AlertSeverity, type DerivedAlert } from '@/utils/alerts';

const SEVERITY_COLOR: Record<AlertSeverity, ThemeColor> = {
  critical: 'error',
  warning: 'warning',
  info: 'accent',
};

const SEVERITY_ICON: Record<AlertSeverity, SFSymbol> = {
  critical: 'exclamationmark.octagon.fill',
  warning: 'exclamationmark.triangle.fill',
  info: 'sparkles',
};

export default function AlertsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const productsQuery = useProductsQuery({});
  // Revoked and expired certificates are filtered server-side; the app no
  // longer downloads the whole certificate table to search it locally.
  const revokedQuery = useCertificatesQuery({ status: 'revoked' });
  const expiredQuery = useCertificatesQuery({ status: 'expired' });
  const validQuery = useCertificatesQuery({ status: 'valid' });

  const products = flattenProductPages(productsQuery.data?.pages);
  const certificates = [
    ...(revokedQuery.data ?? []),
    ...(expiredQuery.data ?? []),
    ...(validQuery.data ?? []),
  ];

  const alerts = buildAlerts(products, certificates);

  const queries = [productsQuery, revokedQuery, expiredQuery, validQuery];
  const loading = queries.some(query => query.isPending);
  const isRefetching = queries.some(query => query.isRefetching);
  const error = queries.find(query => query.isError && alerts.length === 0)?.error ?? null;

  function handleRefresh() {
    for (const query of queries) {
      void query.refetch();
    }
  }

  function handleAlertPress(alert: DerivedAlert) {
    router.push(
      alert.target.type === 'product'
        ? `/products/${alert.target.id}`
        : `/agencies/${alert.target.id}`
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.a11y.goBack')}>
          <SymbolView name="chevron.left" tintColor={theme.text} size={28} weight="semibold" />
        </Pressable>
        <ThemedText type="hero">{t('alerts.heroTitle')}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
      ) : error ? (
        <EmptyState
          icon="exclamationmark.triangle"
          title={t('common.somethingWentWrong')}
          message={error.message}
        />
      ) : alerts.length === 0 ? (
        <EmptyState
          icon="checkmark.seal"
          title={t('alerts.noAlertsTitle')}
          message={t('alerts.noAlertsMessage')}
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={theme.textMuted}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.duration(400).delay(staggerDelay(index))}>
              <AlertRow alert={item} onPress={() => handleAlertPress(item)} />
            </Animated.View>
          )}
        />
      )}
    </ThemedView>
  );
}

function AlertRow({ alert, onPress }: { alert: DerivedAlert; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const colorKey = SEVERITY_COLOR[alert.severity];
  const title = t(alert.titleKey, { name: alert.subject, days: alert.days ?? 0 });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${alert.subject}`}>
      <ThemedView
        type="surface"
        style={[
          styles.alertCard,
          // A revoked certificate is the one thing in this app that must not be
          // skimmed past, so it carries a coloured edge as well as an icon.
          alert.severity === 'critical' && {
            borderLeftWidth: 3,
            borderLeftColor: theme[colorKey],
          },
        ]}>
        <View style={[styles.iconContainer, { backgroundColor: `${theme[colorKey]}1A` }]}>
          <SymbolView
            name={SEVERITY_ICON[alert.severity]}
            tintColor={theme[colorKey]}
            size={22}
          />
        </View>

        <View style={styles.textContainer}>
          <ThemedText type="bodyMedium" themeColor={colorKey}>
            {title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {alert.subject}
          </ThemedText>
        </View>

        <SymbolView name="chevron.right" tintColor={theme.textMuted} size={16} />
      </ThemedView>
    </Pressable>
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
  headerSpacer: {
    width: 28,
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
