import { SymbolView, type SymbolViewProps } from 'expo-symbols';

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
 */
export function Icon({ name, ...rest }: IconProps) {
  return <SymbolView name={resolveIconName(name)} {...rest} />;
}

export type { IconName };
