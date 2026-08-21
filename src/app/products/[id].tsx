import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ExternalLink } from '@/components/external-link';
import { CertificateBadge } from '@/components/certificate-badge';
import { EmptyState } from '@/components/empty-state';
import { FreshnessAlert } from '@/components/freshness-alert';
import { FreshnessIndicatorDetailed } from '@/components/freshness-indicator';
import { KashrutBadge } from '@/components/kashrut-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radius, Shadows, Spacing } from '@/constants/theme';
import { useSavedItems } from '@/hooks/use-saved-items';
import { useTheme } from '@/hooks/use-theme';
import { useTopInset } from '@/hooks/use-top-inset';
import { useProductQuery } from '@/hooks/use-queries';
import { isSafeExternalUrl, resolveMediaUrl } from '@/services/api';
import { track } from '@/services/telemetry';
import { getCountryTranslationKey } from '@/utils/countries';
import { getFreshnessTier } from '@/utils/freshness';
import LogoImage from '@/assets/images/logo.png';

// Anchored footer: vertical padding + the action button's own height. Kept in
// sync with `styles.footer` / `styles.actionButton` so the scroll content can
// reserve room for it.
const FooterHeight = Spacing.three * 2 + Spacing.three * 2 + 24;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { contentTopInset } = useTopInset();
  const { t } = useTranslation();
  const { addToShoppingList, removeFromShoppingList, isInShoppingList } = useSavedItems();

  const numericId = Number(id);
  const productQuery = useProductQuery(numericId);
  const product = productQuery.data ?? null;
  const inList = product ? isInShoppingList(product.id) : false;

  const loading = productQuery.isPending && Number.isInteger(numericId);
  const notFound = !Number.isInteger(numericId) || (productQuery.isSuccess && product === null);
  const loadError = productQuery.isError ? productQuery.error : null;

  // Reported once per product, not on every render or refetch.
  const reportedProductRef = useRef<number | null>(null);
  useEffect(() => {
    if (!product || reportedProductRef.current === product.id) return;
    reportedProductRef.current = product.id;

    const tier = getFreshnessTier(product.updatedAt);
    track('product_viewed', {
      product_id: product.id,
      kashrut_level: product.kashrutLevel,
      is_mehadrin: product.isMehadrin,
      agency_id: product.agency?.id,
      freshness_tier: tier,
    });
    // Measures how much of the catalog has gone stale in front of real users,
    // which is the signal for how hard the scrapers need to run.
    if (tier === 'stale' || tier === 'outdated') {
      track('freshness_alert_shown', { product_id: product.id, tier });
    }
  }, [product]);

  function handleToggleList() {
    if (!product) return;
    if (inList) {
      removeFromShoppingList(product.id);
      track('product_removed_from_list', { product_id: product.id, source: 'detail' });
    } else {
      addToShoppingList(product.id);
      track('product_added_to_list', { product_id: product.id, source: 'detail' });
    }
  }

  function handleAgencyPress() {
    const agency = product?.agency;
    if (!agency) return;
    track('agency_viewed', { agency_id: agency.id });
    router.push(`/agencies/${agency.id}`);
  }

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: contentTopInset }]}>
        <ActivityIndicator style={styles.loader} color={theme.accent} size="large" />
      </ThemedView>
    );
  }

  if (notFound || loadError || !product) {
    return (
      <ThemedView style={[styles.container, { paddingTop: contentTopInset }]}>
        <EmptyState
          icon="exclamationmark.triangle"
          title={t('common.oops')}
          message={loadError ? loadError.message : t('products.productNotFound')}
        />
      </ThemedView>
    );
  }

  const imageSource = resolveMediaUrl(product.imgUrl);
  const agencyLogoSource = resolveMediaUrl(product.agency?.logoUrl);
  // Server-supplied, so the scheme is checked before it can reach a browser.
  const rawScanUrl = product.certificate?.scanUrl ?? null;
  const certificateScanUrl = isSafeExternalUrl(rawScanUrl) ? rawScanUrl : null;

  const formattedUpdatedAt = new Date(product.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const validFrom = product.certificate?.validFrom ?? null;
  const validUntil = product.certificate?.validUntil ?? null;
  const formattedValidFrom = validFrom
    ? new Date(validFrom).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : null;
  const formattedValidUntil = validUntil
    ? new Date(validUntil).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : null;

  let validityRow: { label: string; value: string } | null = null;
  if (formattedValidFrom && formattedValidUntil) {
    validityRow = {
      label: t('products.certificateValidity'),
      value: `${formattedValidFrom} → ${formattedValidUntil}`,
    };
  } else if (formattedValidUntil) {
    validityRow = {
      label: t('products.certificateValidUntil'),
      value: t('products.certificateExpires', { date: formattedValidUntil }),
    };
  } else if (formattedValidFrom) {
    validityRow = {
      label: t('products.certificateValidFrom'),
      value: formattedValidFrom,
    };
  }

  return (
    <ThemedView style={styles.container}>
      <Pressable
        onPress={() => router.back()}
        style={[
          styles.backButton,
          { top: contentTopInset + Spacing.two, backgroundColor: theme.surface },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('common.a11y.goBack')}>
        <SymbolView name="chevron.left" tintColor={theme.text} size={28} weight="semibold" />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: contentTopInset, paddingBottom: Layout.tabBarHeight + FooterHeight + Spacing.six },
        ]}>
        <ThemedView type="surfaceElevated" style={styles.imageContainer}>
          {imageSource ? (
            <Image source={{ uri: imageSource }} style={styles.image} contentFit="contain" />
          ) : (
            <ThemedView type="surfaceElevated" style={styles.imagePlaceholder}>
              <Image source={LogoImage} style={styles.placeholderLogo} contentFit="contain" />
              <ThemedText type="h3" themeColor="textMuted" style={styles.placeholderText}>
                {t('products.noImage')}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView type="surface" style={styles.infoCard}>
          <FreshnessAlert updatedAt={product.updatedAt} />
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

          {product.barcode && (
            <View style={styles.metaRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('products.barcode')}
              </ThemedText>
              <ThemedText type="smallMedium">{product.barcode}</ThemedText>
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

          {product.country && (
            <View style={styles.metaRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('products.country')}
              </ThemedText>
              <ThemedText type="smallMedium">
                {t(getCountryTranslationKey(product.country.code), (product.country.code ?? '').toUpperCase())}
              </ThemedText>
            </View>
          )}

          <View style={styles.lastUpdatedRow}>
            <View style={styles.lastUpdatedText}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('common.freshness.lastUpdated')}
              </ThemedText>
              <ThemedText type="smallMedium">{formattedUpdatedAt}</ThemedText>
            </View>
            <FreshnessIndicatorDetailed updatedAt={product.updatedAt} />
          </View>
        </ThemedView>

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

        {product.certificate && (
          <ThemedView type="surface" style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t('products.certificate')}
            </ThemedText>
            <View style={styles.certificateRow}>
              <CertificateBadge status={product.certificate.status} />
              {product.certificate.certificateCode && (
                <ThemedText type="small" themeColor="textSecondary">
                  {product.certificate.certificateCode}
                </ThemedText>
              )}
            </View>
            {validityRow && (
              <View style={styles.metaRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  {validityRow.label}
                </ThemedText>
                <ThemedText type="smallMedium">{validityRow.value}</ThemedText>
              </View>
            )}
            {certificateScanUrl && (
              <ExternalLink
                href={certificateScanUrl}
                onPress={() => track('certificate_scan_opened', { product_id: product.id })}
                asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={t('products.viewScan')}
                  style={styles.scanLink}>
                  <ThemedText type="smallMedium" themeColor="accent">
                    {t('products.viewScan')}
                  </ThemedText>
                  <SymbolView name="arrow.up.right" tintColor={theme.accent} size={14} />
                </Pressable>
              </ExternalLink>
            )}
          </ThemedView>
        )}

        {product.agency && (
          <ThemedView type="surface" style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t('products.certifyingAgency')}
            </ThemedText>
            <Pressable
              onPress={handleAgencyPress}
              accessibilityRole="button"
              accessibilityLabel={t('common.a11y.viewAgency', {
                name: product.agency.name,
              })}>
              <View style={styles.agencyRow}>
                {agencyLogoSource ? (
                  <Image
                    source={{ uri: agencyLogoSource }}
                    style={styles.agencyLogo}
                    contentFit="contain"
                  />
                ) : (
                  <View style={[styles.agencyLogo, styles.agencyLogoPlaceholder, { backgroundColor: theme.border }]}>
                    <ThemedText type="bodyBold" themeColor="textMuted">
                      {product.agency.name.charAt(0)}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.agencyInfo}>
                  <ThemedText type="bodyBold">{product.agency.name}</ThemedText>
                  {product.agency.country && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t(getCountryTranslationKey(product.agency.country.code), (product.agency.country.code ?? '').toUpperCase())}
                    </ThemedText>
                  )}
                </View>
                <SymbolView name="chevron.right" tintColor={theme.textMuted} size={16} />
              </View>
            </Pressable>
          </ThemedView>
        )}
      </ScrollView>

      <ThemedView
        type="surface"
        style={[styles.footer, { borderTopColor: theme.borderSubtle }]}>
        <Pressable
          onPress={handleToggleList}
          accessibilityRole="button"
          accessibilityState={{ selected: inList }}
          accessibilityLabel={inList ? t('products.addedToList') : t('products.addToList')}
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
    flexGrow: 1,
  },
  loader: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.four,
    zIndex: 10,
    padding: Spacing.two,
    borderRadius: Radius.round,
    ...Shadows.sm,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    justifyContent: 'center',
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
    gap: Spacing.three,
  },
  placeholderLogo: {
    width: 120,
    height: 120,
  },
  placeholderText: {
    marginTop: Spacing.two,
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
  lastUpdatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  lastUpdatedText: {
    flex: 1,
    gap: Spacing.half,
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
    alignItems: 'center',
    gap: Spacing.three,
  },
  agencyLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  agencyLogoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  agencyInfo: {
    flex: 1,
    gap: Spacing.half,
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
    // Sits directly on top of the floating tab bar.
    bottom: Layout.tabBarHeight,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
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
