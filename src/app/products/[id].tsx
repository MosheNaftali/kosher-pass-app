import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ExternalLink } from '@/components/external-link';
import { CertificateBadge } from '@/components/certificate-badge';
import { EmptyState } from '@/components/empty-state';
import { KashrutBadge } from '@/components/kashrut-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useSavedItems } from '@/hooks/use-saved-items';
import { useTheme } from '@/hooks/use-theme';
import { API_BASE_URL } from '@/services/api';
import { getProductById, type Product } from '@/services/products';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { addToShoppingList, removeFromShoppingList, isInShoppingList } = useSavedItems();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inList = product ? isInShoppingList(product.id) : false;

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const data = await getProductById(Number(id));
        setProduct(data);
        if (!data) {
          setError(t('products.productNotFound'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('products.failedToLoad'));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, t]);

  function handleToggleList() {
    if (!product) return;
    if (inList) {
      removeFromShoppingList(product.id);
    } else {
      addToShoppingList(product.id);
    }
  }

  function handleAgencyPress() {
    if (product?.agencyId) {
      router.push(`/agencies/${product.agencyId.id}`);
    }
  }

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
      </ThemedView>
    );
  }

  if (error || !product) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="exclamationmark.triangle"
          title={t('common.oops')}
          message={error ?? t('products.productNotFound')}
        />
      </ThemedView>
    );
  }

  const imageSource = product.imgUrl
    ? product.imgUrl.startsWith('http')
      ? product.imgUrl
      : `${API_BASE_URL}${product.imgUrl}`
    : null;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <SymbolView name="chevron.left" tintColor={theme.text} size={28} weight="semibold" />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.imageContainer}>
          {imageSource ? (
            <Image source={{ uri: imageSource }} style={styles.image} contentFit="cover" />
          ) : (
            <ThemedView type="surfaceElevated" style={styles.imagePlaceholder}>
              <SymbolView name="cube.box" tintColor={theme.textMuted} size={64} />
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView type="surface" style={styles.infoCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleSection}>
              <ThemedText type="h2">{product.name}</ThemedText>
              {product.brand && (
                <ThemedText type="body" themeColor="textSecondary">
                  {product.brand}
                </ThemedText>
              )}
            </View>
          </View>

          <View style={styles.badges}>
            <KashrutBadge level={product.kashrutLevel} showMehadrin={product.isMehadrin} />
          </View>

          {product.productCode && (
            <View style={styles.metaRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('products.productCode')}
              </ThemedText>
              <ThemedText type="smallMedium">{product.productCode}</ThemedText>
            </View>
          )}

          {(product.category || product.subCategory) && (
            <View style={styles.metaRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('products.categoryLabel')}
              </ThemedText>
              <ThemedText type="smallMedium">
                {[product.category, product.subCategory].filter(Boolean).join(' · ')}
              </ThemedText>
            </View>
          )}

          {product.countryId && (
            <View style={styles.metaRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('products.country')}
              </ThemedText>
              <ThemedText type="smallMedium">{product.countryId.label}</ThemedText>
            </View>
          )}
        </ThemedView>

        {product.agencyId && (
          <ThemedView type="surface" style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t('products.certifyingAgency')}
            </ThemedText>
            <Pressable onPress={handleAgencyPress}>
              <View style={styles.agencyRow}>
                <ThemedText type="bodyBold">{product.agencyId.name}</ThemedText>
                <SymbolView name="chevron.right" tintColor={theme.textMuted} size={16} />
              </View>
            </Pressable>
          </ThemedView>
        )}

        {product.certificateId && (
          <ThemedView type="surface" style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t('products.certificate')}
            </ThemedText>
            <View style={styles.certificateRow}>
              <CertificateBadge status={product.certificateId.status} />
              {product.certificateId.certificateCode && (
                <ThemedText type="small" themeColor="textSecondary">
                  {product.certificateId.certificateCode}
                </ThemedText>
              )}
            </View>
            {product.certificateId.scanUrl && (
              <ExternalLink href={product.certificateId.scanUrl} asChild>
                <Pressable style={styles.scanLink}>
                  <ThemedText type="smallMedium" themeColor="accent">
                    {t('products.viewScan')}
                  </ThemedText>
                  <SymbolView name="arrow.up.right" tintColor={theme.accent} size={14} />
                </Pressable>
              </ExternalLink>
            )}
          </ThemedView>
        )}

        {product.notes && (
          <ThemedView type="surface" style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t('products.notes')}
            </ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {product.notes}
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>

      <ThemedView type="surface" style={[styles.footer, { paddingBottom: insets.bottom + Spacing.four }]}>
        <Pressable
          onPress={handleToggleList}
          style={[
            styles.actionButton,
            { backgroundColor: inList ? theme.success : theme.accent },
          ]}>
          <SymbolView
            name={inList ? 'checkmark' : 'cart.badge.plus'}
            tintColor={theme.primaryForeground}
            size={20}
          />
          <ThemedText type="bodyMedium" themeColor="primaryForeground">
            {inList ? t('products.addedToList') : t('products.addToList')}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
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
  imageContainer: {
    width: '100%',
    height: 320,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    marginHorizontal: Spacing.four,
    marginTop: -Spacing.six,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
    ...Shadows.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    gap: Spacing.one,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    marginBottom: Spacing.one,
  },
  agencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  certificateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  scanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    ...Shadows.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.xl,
  },
});
