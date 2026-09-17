import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FAF9F6',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceContrast: '#1E2D3D',
    surfaceContrastForeground: '#FFFFFF',

    primary: '#1E2D3D',
    primaryForeground: '#FFFFFF',

    accent: '#D4A853',
    accentForeground: '#1E2D3D',

    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',

    border: '#E5E0D8',
    borderSubtle: '#F0EDE7',

    success: '#2D6A4F',
    warning: '#A85F12',
    warningForeground: '#FFFFFF',
    error: '#B91C1C',

    dairy: '#4A7CB5',
    meat: '#B55A4A',
    pareve: '#2D6A4F',
    chalavYisrael: '#5B4AB5',
    unknown: '#9CA3AF',

    overlay: 'rgba(0, 0, 0, 0.55)',
    overlayForeground: '#FFFFFF',
    logoPlate: '#FFFFFF',
    logoPlateForeground: '#6B7280',
  },
  dark: {
    background: '#111111',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    surfaceContrast: '#2C3A4A',
    surfaceContrastForeground: '#FFFFFF',

    primary: '#D4A853',
    primaryForeground: '#1E2D3D',

    accent: '#D4A853',
    accentForeground: '#1E2D3D',

    text: '#F0F0F0',
    textSecondary: '#9CA3AF',
    textMuted: '#8E939C',
    textInverse: '#1A1A1A',

    border: '#48484A',
    borderSubtle: '#2C2C2E',

    success: '#52A882',
    warning: '#D48C2E',
    warningForeground: '#1E2D3D',
    error: '#EF4444',

    dairy: '#6A9ACF',
    meat: '#D1796A',
    pareve: '#52A882',
    chalavYisrael: '#9A88E0',
    unknown: '#8E939C',

    overlay: 'rgba(0, 0, 0, 0.55)',
    overlayForeground: '#FFFFFF',
    logoPlate: '#FFFFFF',
    logoPlateForeground: '#6B7280',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Alpha suffix appended to a theme color to build a translucent fill
 * (`${theme.accent}${tint}`). A tint that reads on a light surface is nearly
 * invisible on a dark one, so the suffix is a function of the active scheme -
 * read it through `useTintAlpha` rather than hardcoding one.
 */
export const TintAlpha = { light: '15', dark: '2A' } as const;

export const KashrutLevelColors: Record<KashrutLevel, ThemeColor> = {
  unknown: 'unknown',
  pareve: 'pareve',
  dairy: 'dairy',
  meat: 'meat',
  dairy_chalav_yisrael: 'chalavYisrael',
};

export type KashrutLevel = 'unknown' | 'pareve' | 'dairy' | 'meat' | 'dairy_chalav_yisrael';

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Typography = {
  hero: { fontSize: 36, lineHeight: 40, fontWeight: '700' as const },
  h1: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  h3: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
  h4: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  smallMedium: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 48,
  ten: 64,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Height of the AdMob banner slot (standard 320x50) on native platforms. The
// web build has no AdMob SDK, so it reserves nothing.
//
// The banner bar is anchored at the *top* of the app, above every screen, spans
// the full width, and is laid out in flow (see `AdBanner` / `AppTabs`) - so
// screens are pushed down by it rather than overlapped. The bar measures itself
// at runtime, so this is only what the slot reserves until the first layout
// pass; keeping the two in sync is not required for correctness.
const adBannerHeight = Platform.select({ ios: 60, android: 60, default: 0 }) ?? 0;

// Height of the floating tab bar. Screens that anchor their own chrome (a
// footer CTA, for example) sit on top of this, and every scroll view reserves
// it as bottom padding so its last row is not trapped under the bar.
const tabBarHeight = Platform.select({ ios: 80, android: 90 }) ?? 0;

export const Layout = {
  tabBarHeight,
  adBannerHeight,
  maxContentWidth: 800,
  screenPadding: Spacing.four,
} as const;

export const AdBannerHeight = Layout.adBannerHeight;
export const MaxContentWidth = Layout.maxContentWidth;
