import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { API_BASE_URL } from '@/services/api';
import type { Agency } from '@/services/agencies';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AgencyRowProps {
  agency: Agency;
  onPress?: (agency: Agency) => void;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function AgencyRow({
  agency,
  onPress,
  showFavorite,
  isFavorite,
  onToggleFavorite,
}: AgencyRowProps) {
  const theme = useTheme();

  const logoSource = agency.logoUrl
    ? agency.logoUrl.startsWith('http')
      ? agency.logoUrl
      : `${API_BASE_URL}${agency.logoUrl}`
    : null;

  return (
    <Pressable onPress={() => onPress?.(agency)}>
      <ThemedView type="surface" style={styles.container}>
        {logoSource ? (
          <Image source={{ uri: logoSource }} style={styles.logo} contentFit="contain" />
        ) : (
          <ThemedView type="surfaceElevated" style={styles.logoPlaceholder}>
            <SymbolView
              name={{ ios: 'building.2.fill', web: 'apartment' }}
              tintColor={theme.textMuted}
              size={24}
            />
          </ThemedView>
        )}

        <ThemedView style={styles.content}>
          <ThemedText type="bodyBold" numberOfLines={1}>
            {agency.name}
          </ThemedText>
          {agency.countryId && (
            <ThemedText type="small" themeColor="textSecondary">
              {agency.countryId.label}
            </ThemedText>
          )}
        </ThemedView>

        {showFavorite && (
          <Pressable onPress={onToggleFavorite} hitSlop={12} style={styles.favoriteButton}>
            <SymbolView
              name={isFavorite ? 'star.fill' : 'star'}
              tintColor={isFavorite ? theme.accent : theme.border}
              size={22}
            />
          </Pressable>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.half,
    backgroundColor: 'transparent',
  },
  favoriteButton: {
    padding: Spacing.two,
  },
});
