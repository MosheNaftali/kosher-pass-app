import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

import { resolveIconName } from './icons';

/**
 * The app is authored against SF Symbols, which only render on iOS. Every icon
 * must carry a Material Symbol equivalent for Android and web, or the bottom
 * tab bar (and the rest of the UI) silently renders empty. These assertions pin
 * the resolution rules that guarantee it.
 */
describe('resolveIconName', () => {
  it('maps an SF Symbol string to a Material Symbol for Android and web', () => {
    expect(resolveIconName('bell')).toEqual({
      ios: 'bell',
      android: 'notifications',
      web: 'notifications',
    });
  });

  it('resolves every icon used by the tab bar', () => {
    const expected = [
      ['bell', 'notifications'],
      ['cube.box', 'inventory_2'],
      ['barcode.viewfinder', 'qr_code_scanner'],
      ['cart', 'shopping_cart'],
      ['building.2', 'apartment'],
    ] as const satisfies readonly (readonly [SFSymbol, AndroidSymbol])[];

    for (const [ios, material] of expected) {
      expect(resolveIconName(ios)).toEqual({ ios, android: material, web: material });
    }
  });

  it('fills the missing platform slots of a partial object from the table', () => {
    expect(resolveIconName({ ios: 'star.fill', web: 'star' })).toEqual({
      ios: 'star.fill',
      android: 'star',
      web: 'star',
    });
  });

  it('never lets the table override an explicit platform value', () => {
    expect(resolveIconName({ ios: 'bell', android: 'notifications_off', web: 'notifications_off' })).toEqual({
      ios: 'bell',
      android: 'notifications_off',
      web: 'notifications_off',
    });
  });

  it('distinguishes the filled and outline variants', () => {
    expect(resolveIconName('star').android).toBe('star_border');
    expect(resolveIconName('star.fill').android).toBe('star');
  });

  it('degrades to iOS-only (no wrong glyph) for an unmapped symbol', () => {
    expect(resolveIconName('definitely.not.a.real.symbol' as never)).toEqual({
      ios: 'definitely.not.a.real.symbol',
      android: undefined,
      web: undefined,
    });
  });
});
