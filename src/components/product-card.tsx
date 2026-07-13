import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, useSharedValue, withSpring } from 'react-native-reanimated';

import { KashrutBadge } from './kashrut-badge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { API_BASE_URL } from '@/services/api';
import type { Product } from '@/services/products';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ProductCardProps {
  product: Product;
  index?: number;
  onPress: (product: Product) => void;
}

export function ProductCard({ product, index = 0, onPress }: ProductCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

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
            },
          ]}>
          <ThemedView style={styles.imageContainer}>
            {imageSource ? (
              <Image source={{ uri: imageSource }} style={styles.image} contentFit="cover" />
            ) : (
              <ThemedView type="surfaceElevated" style={styles.imagePlaceholder}>
                <SymbolView
                  name={{ ios: 'cube.box', web: 'inventory_2' }}
                  tintColor={theme.textMuted}
                  size={32}
                />
              </ThemedView>
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
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
});
