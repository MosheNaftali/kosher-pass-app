import { Colors } from './theme';

function channelToLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const normalized = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => channelToLinear(parseInt(normalized.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * A color placed on a surface it was paired with. Every token here exists in
 * both palettes, so the assertion runs for both schemes.
 */
const FOREGROUND_ON_FILL: readonly (readonly [keyof typeof Colors.light, keyof typeof Colors.light])[] = [
  ['primaryForeground', 'primary'],
  ['accentForeground', 'accent'],
  ['warningForeground', 'warning'],
  ['logoPlateForeground', 'logoPlate'],
  ['surfaceContrastForeground', 'surfaceContrast'],
];

/**
 * Body/verdict text on the dark surfaces. Light mode's low-emphasis tones
 * (`textMuted`, `dairy`) are intentionally excluded - this suite pins the dark
 * palette, which is what the surrounding change repaired.
 */
const DARK_TEXT_ON_SURFACE: readonly (readonly [keyof typeof Colors.dark, keyof typeof Colors.dark])[] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['text', 'surfaceElevated'],
  ['textSecondary', 'surface'],
  ['textSecondary', 'background'],
  ['textMuted', 'surface'],
  ['textMuted', 'background'],
  ['accent', 'surface'],
  ['success', 'surface'],
  ['pareve', 'surface'],
  ['dairy', 'surface'],
  ['meat', 'surface'],
  ['chalavYisrael', 'surface'],
  ['warning', 'surface'],
  ['error', 'surface'],
  ['unknown', 'surface'],
];

const AA_NORMAL_TEXT = 4.5;

describe('theme palette', () => {
  it('defines every color key in both schemes', () => {
    expect(Object.keys(Colors.dark).sort()).toEqual(Object.keys(Colors.light).sort());
  });

  it.each(['light', 'dark'] as const)(
    'keeps every foreground legible on the fill it is paired with (%s)',
    scheme => {
      for (const [foreground, background] of FOREGROUND_ON_FILL) {
        const ratio = contrastRatio(Colors[scheme][foreground], Colors[scheme][background]);
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      }
    }
  );

  it.each(DARK_TEXT_ON_SURFACE)(
    'meets AA for dark %s on %s',
    (foreground, background) => {
      const ratio = contrastRatio(Colors.dark[foreground], Colors.dark[background]);
      expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    }
  );
});
