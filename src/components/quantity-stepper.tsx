import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface QuantityStepperProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function QuantityStepper({ quantity, onIncrease, onDecrease }: QuantityStepperProps) {
  const theme = useTheme();

  return (
    <ThemedView type="surfaceElevated" style={styles.container}>
      <Pressable onPress={onDecrease} style={styles.button} hitSlop={8}>
        <SymbolView
          name={{ ios: 'minus', web: 'remove' }}
          tintColor={quantity > 1 ? theme.text : theme.textMuted}
          size={16}
          weight="bold"
        />
      </Pressable>

      <ThemedText type="bodyMedium" style={styles.quantity}>
        {quantity}
      </ThemedText>

      <Pressable onPress={onIncrease} style={styles.button} hitSlop={8}>
        <SymbolView
          name={{ ios: 'plus', web: 'add' }}
          tintColor={theme.text}
          size={16}
          weight="bold"
        />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.two,
  },
  button: {
    padding: Spacing.two,
  },
  quantity: {
    minWidth: 28,
    textAlign: 'center',
  },
});
