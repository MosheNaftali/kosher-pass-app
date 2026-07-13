import { SymbolView, type SFSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EmptyStateProps {
  icon: SFSymbol;
  title: string;
  message?: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <SymbolView name={icon} tintColor={theme.textMuted} size={56} weight="light" />
      <ThemedText type="h4" style={styles.title}>
        {title}
      </ThemedText>
      {message && (
        <ThemedText type="body" themeColor="textSecondary" style={styles.message}>
          {message}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.seven,
    gap: Spacing.three,
    minHeight: 300,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
