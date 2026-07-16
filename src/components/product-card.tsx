import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { FreshnessIndicator } from './freshness-indicator';
import { KashrutBadge } from './kashrut-badge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { API_BASE_URL } from '@/services/api';
import type { Product } from '@/services/products';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getFreshnessTier } from '@/utils/freshness';
import LogoImage from '@/assets/images/logo.png';

interface ProductCardProps {
  product: Product;
  index?: number;
  onPress: (product: Product) => void;
}

export function ProductCard({ product, index = 0, onPress }: ProductCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const tier = getFreshnessTier(product.updatedAt);

  const imageSource = product.imgUrl
    ? product.imgUrl.startsWith('http')
      ? product.imgUrl
      : `${API_BASE_URL}${product.imgUrl}`
    : null;

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { stiffness: 400, damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 15 });
  };

  return (
    <Animated.View entering={FadeIn.duration(400).delay(index * 60)}>
      <Pressable
        onPress={() => onPress(product)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              transform: [{ scale }],
              borderColor: tier === 'outdated' ? theme.error : 'transparent',
              borderWidth: tier === 'outdated' ? 1.5 : 0,
            },
          ]}>
          <ThemedView style={styles.imageContainer}>
            {imageSource ? (
              <Image source={{ uri: imageSource }} style={styles.image} contentFit="cover" />
            ) : (
              <ThemedView type="surfaceElevated" style={styles.imagePlaceholder}>
                <Image source={LogoImage} style={styles.placeholderLogo} contentFit="contain" />
                <ThemedText type="caption" themeColor="textMuted" style={styles.placeholderText}>
                  {t('products.noImage')}
                </ThemedText>
              </ThemedView>
            )}
            <View style={styles.freshnessOverlay} pointerEvents="none">
              <FreshnessIndicator updatedAt={product.updatedAt} />
            </View>
            {product.agencyId && product.agencyId.logoUrl && (
              <View style={styles.agencyOverlay} pointerEvents="none">
                <Image
                  source={{ uri: product.agencyId.logoUrl.startsWith('http') ? product.agencyId.logoUrl : `${API_BASE_URL}${product.agencyId.logoUrl}` }}
                  style={styles.agencyLogo}
                  contentFit="contain"
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
    backgroundColor: 'transparent',
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
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  agencyOverlay: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    backgroundColor: 'rgb(255, 255, 255)',
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
