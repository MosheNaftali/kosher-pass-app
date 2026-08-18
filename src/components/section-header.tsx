import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const theme = useTheme();
  const content = (
    <View style={styles.container}>
      <ThemedText type="h4">{title}</ThemedText>
      {actionLabel && (
        <ThemedText type="smallMedium" themeColor="accent" style={styles.action}>
          {actionLabel}
          <SymbolView
            name={{ ios: 'chevron.right', web: 'arrow_forward' }}
            tintColor={theme.accent}
            size={12}
            weight="bold"
          />
        </ThemedText>
      )}
    </View>
  );

  if (onAction) {
    return (
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
