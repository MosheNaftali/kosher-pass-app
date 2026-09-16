import { Icon } from '@/components/ui/icon';
import { Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedView } from './themed-view';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder, autoFocus, onSubmit }: SearchBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedView type="surface" style={styles.container}>
      <Icon
        name={{ ios: 'magnifyingglass', web: 'search' }}
        tintColor={theme.textMuted}
        size={18}
        weight="medium"
      />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder={placeholder ?? t('common.searchPlaceholder')}
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        clearButtonMode="while-editing"
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {Platform.OS !== 'ios' && value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.a11y.clearSearch')}>
          <Icon
            name={{ ios: 'xmark.circle.fill', web: 'close' }}
            tintColor={theme.textMuted}
            size={18}
          />
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Platform.select({ ios: Spacing.three, default: Spacing.two }),
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
    minHeight: 22,
  },
});
