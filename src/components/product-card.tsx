import { Image } from 'expo-image';
import { Icon } from '@/components/ui/icon';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { FreshnessIndicator } from './freshness-indicator';
import { KashrutBadge } from './kashrut-badge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { resolveMediaUrl } from '@/services/api';
import type { Product } from '@/services/products';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { staggerDelay } from '@/utils/animation';
import { getFreshnessTier } from '@/utils/freshness';
import LogoImage from '@/assets/images/logo.png';

interface ProductCardProps {
  product: Product;
  index?: number;
  onPress: (product: Product) => void;
}

const noteIcon = { ios: 'exclamationmark.circle.fill', web: 'error' } as const;

export function ProductCard({ product, index = 0, onPress }: ProductCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const tier = getFreshnessTier(product.updatedAt);
  // Notes usually spell out which variant of the product is actually kosher.
  // Showing the first line cut off is what nudges the user into opening the
  // detail screen to read the rest.
  const note = product.notes?.trim() || null;

  const imageSource = resolveMediaUrl(product.imgUrl);
  const agencyLogoSource = resolveMediaUrl(product.agency?.logoUrl);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { stiffness: 400, damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 15 });
  };

  return (
    <Animated.View entering={FadeIn.duration(400).delay(staggerDelay(index))}>
      <Pressable
        onPress={() => onPress(product)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={t(note ? 'common.a11y.viewProductWithNote' : 'common.a11y.viewProduct', {
          name: product.name,
        })}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              transform: [{ scale }],
              borderColor: tier === 'outdated' ? theme.error : theme.border,
              borderWidth: tier === 'outdated' ? 1.5 : StyleSheet.hairlineWidth,
            },
          ]}>
          <ThemedView type="logoPlate" style={styles.imageContainer}>
            {imageSource ? (
              <Image
                source={{ uri: imageSource }}
                style={styles.image}
                contentFit="contain"
                recyclingKey={String(product.id)}
                transition={150}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Image source={LogoImage} style={styles.placeholderLogo} contentFit="contain" />
                <ThemedText
                  type="caption"
                  themeColor="logoPlateForeground"
                  style={styles.placeholderText}>
                  {t('products.noImage')}
                </ThemedText>
              </View>
            )}
            <View style={styles.freshnessOverlay} pointerEvents="none">
              <FreshnessIndicator updatedAt={product.updatedAt} />
            </View>
            {agencyLogoSource && (
              <View
                style={[styles.agencyOverlay, { backgroundColor: theme.logoPlate }]}
                pointerEvents="none">
                <Image
                  source={{ uri: agencyLogoSource }}
                  style={styles.agencyLogo}
                  contentFit="contain"
                  recyclingKey={String(product.id)}
                />
              </View>
            )}
          </ThemedView>

          <ThemedView style={styles.content}>
            <ThemedText type="smallBold" numberOfLines={2}>
              {product.name}
            </ThemedText>
            {product.brand && (
              <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                {product.brand}
              </ThemedText>
            )}
            <KashrutBadge level={product.kashrutLevel} size="sm" showMehadrin={product.isMehadrin} />
            {note && (
              <View style={styles.noteHint}>
                <Icon name={noteIcon} size={12} weight="semibold" tintColor={theme.warning} />
                <ThemedText
                  type="caption"
                  style={[styles.noteHintText, { color: theme.warning }]}
                  numberOfLines={1}>
                  {note}
                </ThemedText>
              </View>
            )}
          </ThemedView>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  imageContainer: {
    aspectRatio: 1,
    width: '100%',
    position: 'relative',
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
    gap: Spacing.two,
  },
  placeholderLogo: {
    width: 64,
    height: 64,
  },
  placeholderText: {
    marginTop: Spacing.one,
  },
  freshnessOverlay: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
  },
  noteHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: -Spacing.one,
  },
  noteHintText: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  agencyOverlay: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    padding: Spacing.one,
    borderRadius: Radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  agencyLogo: {
    width: 28,
    height: 28,
  },
});
