import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.5);

  opacity.value = withRepeat(
    withTiming(1, { duration: 1200 }),
    -1,
    true
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <Animated.View
            style={[
              styles.image,
              { backgroundColor: theme.borderSubtle },
              animatedStyle,
            ]}
          />
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.title,
                { backgroundColor: theme.borderSubtle },
                animatedStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.subtitle,
                { backgroundColor: theme.borderSubtle },
                animatedStyle,
              ]}
            />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  image: {
    aspectRatio: 1,
    width: '100%',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    height: 16,
    borderRadius: Radius.sm,
    width: '90%',
  },
  subtitle: {
    height: 12,
    borderRadius: Radius.sm,
    width: '60%',
  },
});
