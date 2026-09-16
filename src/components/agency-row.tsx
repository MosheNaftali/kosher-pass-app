import { Icon } from '@/components/ui/icon';
import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { resolveMediaUrl } from '@/services/api';
import type { Agency } from '@/services/agencies';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCountryTranslationKey } from '@/utils/countries';

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
  const { t } = useTranslation();

  const logoSource = resolveMediaUrl(agency.logoUrl);

  return (
    <Pressable
      onPress={() => onPress?.(agency)}
      accessibilityRole="button"
      accessibilityLabel={t('common.a11y.viewAgency', { name: agency.name })}>
      <ThemedView type="surface" style={styles.container}>
        {logoSource ? (
          <Image
            source={{ uri: logoSource }}
            style={styles.logo}
            contentFit="contain"
            recyclingKey={agency.id}
          />
        ) : (
          <ThemedView type="surfaceElevated" style={styles.logoPlaceholder}>
            <Icon
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
          {agency.country && (
            <ThemedText type="small" themeColor="textSecondary">
              {t(getCountryTranslationKey(agency.country.code), (agency.country.code ?? '').toUpperCase())}
            </ThemedText>
          )}
        </ThemedView>

        {showFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={12}
            style={styles.favoriteButton}
            accessibilityRole="button"
            accessibilityState={{ selected: Boolean(isFavorite) }}
            accessibilityLabel={t(
              isFavorite ? 'common.a11y.removeFromFavorites' : 'common.a11y.addToFavorites'
            )}>
            <Icon
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
