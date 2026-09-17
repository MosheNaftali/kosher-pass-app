import { Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { stiffness: 400, damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 15 });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      // Exposing `selected` as accessibility state is what makes a screen
      // reader announce "selected" for an active filter; without it the chip
      // sounds identical whether or not the filter is applied.
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: selected ? theme.accent : theme.surface,
            borderColor: selected ? theme.accent : theme.border,
            transform: [{ scale }],
          },
        ]}>
        <ThemedText
          type="smallMedium"
          themeColor={selected ? 'accentForeground' : 'text'}>
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
});
