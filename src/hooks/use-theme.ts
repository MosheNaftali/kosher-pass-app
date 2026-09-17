/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, TintAlpha } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return Colors[theme];
}

/** Alpha suffix for a translucent fill, tuned for the active color scheme. */
export function useTintAlpha() {
  return useColorScheme() === 'dark' ? TintAlpha.dark : TintAlpha.light;
}
