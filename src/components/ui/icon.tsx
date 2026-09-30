import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet } from 'react-native';

import { resolveIconName, type IconName } from '@/constants/icons';

export interface IconProps extends Omit<SymbolViewProps, 'name'> {
  /**
   * An SF Symbol string, or a full `{ ios, android, web }` object when a glyph
   * needs to differ per platform. See `resolveIconName`.
   */
  name: IconName;
}

/**
 * Cross-platform icon.
 *
 * Thin wrapper over `expo-symbols`' `SymbolView` that resolves the SF Symbol
 * name to its Material Symbol equivalent so the icon renders on Android and web
 * too. Use this everywhere instead of importing `SymbolView` directly.
 *
 * `expo-symbols` renders the Material glyph on Android as a `Text` whose
 * `fontSize` is scaled by the device font scale, while the surrounding box stays
 * a fixed `size`. Anyone whose system font size is not the default therefore gets
 * a glyph that no longer fills its box: with a smaller scale it renders shrunk
 * and flush-left, which reads as the icon sitting left of the label it should be
 * centered over. Centering the glyph in its box (which is inert at the default
 * scale, where the glyph already fills it) keeps the icon aligned everywhere.
 */
export function Icon({ name, style, ...rest }: IconProps) {
  return <SymbolView name={resolveIconName(name)} style={[styles.icon, style]} {...rest} />;
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export type { IconName };
