import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

/**
 * A cross-platform icon reference.
 *
 * The app is written against SF Symbols (iOS), so every call site names an icon
 * with its SF Symbol string. `expo-symbols` renders nothing on Android and web
 * unless it is also given the equivalent Material Symbol, so `resolveIconName`
 * looks the Material name up in the table below and fills both non-iOS slots in.
 *
 * A call site that needs to diverge per platform can pass the full object
 * instead; anything already provided wins over the table.
 */
export type IconName =
  | SFSymbol
  | { ios?: SFSymbol; android?: AndroidSymbol; web?: AndroidSymbol };

/**
 * SF Symbol -> Material Symbol. Material Symbols is the single font family
 * `expo-symbols` bundles for Android and web, so both non-iOS slots resolve to
 * the same name.
 *
 * Only names actually used by the app are listed. Add the entry in the same
 * change that introduces a new glyph - an unmapped name renders nothing on
 * Android/web rather than falling back to a wrong icon.
 */
const MATERIAL_SYMBOL_BY_SF_SYMBOL: Partial<Record<SFSymbol, AndroidSymbol>> = {
  'arrow.up.right': 'north_east',
  'barcode.viewfinder': 'qr_code_scanner',
  'bell': 'notifications',
  'bell.slash': 'notifications_off',
  'building.2': 'apartment',
  'building.2.fill': 'apartment',
  'camera.fill': 'photo_camera',
  'cart': 'shopping_cart',
  'cart.badge.plus': 'add_shopping_cart',
  'checkmark': 'check',
  'checkmark.circle.fill': 'check_circle',
  'checkmark.seal': 'verified',
  'checkmark.seal.fill': 'verified',
  'chevron.down': 'keyboard_arrow_down',
  'chevron.left': 'chevron_left',
  'chevron.right': 'chevron_right',
  'circle': 'radio_button_unchecked',
  'clock': 'schedule',
  'cube.box': 'inventory_2',
  'envelope': 'mail',
  'envelope.fill': 'mail',
  'exclamationmark.circle.fill': 'error',
  'exclamationmark.octagon.fill': 'report',
  'exclamationmark.triangle': 'warning',
  'exclamationmark.triangle.fill': 'warning',
  'flashlight.off.fill': 'flashlight_off',
  'flashlight.on.fill': 'flashlight_on',
  'globe': 'public',
  'hammer.fill': 'construction',
  'info.circle': 'info',
  'keyboard': 'keyboard',
  'line.3.horizontal.decrease': 'tune',
  'magnifyingglass': 'search',
  'minus': 'remove',
  'person.fill': 'person',
  'plus': 'add',
  'sparkles': 'auto_awesome',
  'star': 'star_border',
  'star.fill': 'star',
  'trash': 'delete',
  'wifi.slash': 'wifi_off',
  'xmark': 'close',
  'xmark.circle.fill': 'close',
};

export interface ResolvedIconName {
  ios?: SFSymbol;
  android?: AndroidSymbol;
  web?: AndroidSymbol;
}

export function resolveIconName(name: IconName): ResolvedIconName {
  if (typeof name !== 'string') {
    const material =
      name.android ??
      name.web ??
      (name.ios ? MATERIAL_SYMBOL_BY_SF_SYMBOL[name.ios] : undefined);
    return {
      ios: name.ios,
      android: name.android ?? material,
      web: name.web ?? material,
    };
  }

  const material = MATERIAL_SYMBOL_BY_SF_SYMBOL[name];
  return { ios: name, android: material, web: material };
}
