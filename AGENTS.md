# AGENTS.md

Mobile client for `Kosher Pass` — an Expo / React Native app targeting iOS, Android, and Web.
Part of the `final_code/` monorepo alongside the NestJS backend packages (`api/`, `worker/`, `shared/`).

## Project Identity

| Field | Value |
|---|---|
| App name | `Kosher Pass` |
| Slug | `kosher-pass` |
| Version | `1.0.0` |
| Package manager | **pnpm** |
| Entry point | `expo-router/entry` |
| Deep link scheme | `kosherpass://` |
| Orientation | `portrait` |

## Tech Stack & Version Pinning

| Dependency | Version | Purpose |
|---|---|---|
| `expo` | `~57.0.4` | Core Expo SDK |
| `react` | `19.2.3` | UI framework |
| `react-native` | `0.86.0` | Native runtime |
| `typescript` | `~6.0.3` | Type system (`strict: true`) |
| `expo-router` | `~57.0.4` | File-based navigation |
| `@expo/ui` | `~57.0.4` | Universal native components (SwiftUI / Jetpack Compose / DOM) |
| `react-native-reanimated` | `4.5.0` | Animations (Keyframe API, FadeIn) |
| `react-native-gesture-handler` | `~2.32.0` | Gesture support |
| `react-native-safe-area-context` | `~5.7.0` | Safe area insets |
| `react-native-screens` | `4.25.2` | Native screen containers |
| `expo-image` | `~57.0.0` | Optimized remote image loading |
| `expo-glass-effect` | `~57.0.0` | Platform glass/blur effects |
| `expo-symbols` | `~57.0.0` | SF Symbols / Material Symbols |
| `expo-web-browser` | `~57.0.0` | In-app browser for external links |
| `expo-splash-screen` | `~57.0.2` | Splash screen |
| `expo-status-bar` | `~57.0.0` | Status bar control |
| `expo-system-ui` | `~57.0.0` | System UI (background color) |
| `expo-device` | `~57.0.0` | Device info |
| `expo-linking` | `~57.0.2` | Deep linking |
| `expo-font` | `~57.0.0` | Custom font loading |
| `expo-constants` | `~57.0.3` | Build constants |
| `expo-camera` | `~57.0.1` | Camera + barcode scanning |
| `expo-haptics` | `~57.0.0` | Haptic feedback |
| `react-native-google-mobile-ads` | `16.4.0` | AdMob banner ads (native only — requires a dev build, no Expo Go) |
| `expo-tracking-transparency` | `~57.0.1` | iOS App Tracking Transparency prompt (personalized ads consent) |
| `@sentry/react-native` | `~7.11.0` | Error monitoring + performance tracing (native — requires a dev build) |
| `posthog-react-native` | `^4.63.2` | Product analytics, consent-gated |
| `zod` | `^4.4.3` | Runtime validation of every API response |
| `@tanstack/react-query` | `5.101.4` | Server-state cache, dedup, retry, background refetch |
| `@tanstack/react-query-persist-client` | `5.101.4` | Persists the cache so the app works offline |
| `@tanstack/query-async-storage-persister` | `5.101.4` | AsyncStorage backend for the persisted cache |
| `@react-native-community/netinfo` | `12.0.1` | Connectivity, bridged into React Query's onlineManager |
| `expo-application` | `~57.0.2` | Required by posthog-react-native |
| `expo-file-system` | `~57.0.4` | Required by posthog-react-native (event queue persistence) |
| `@react-native-async-storage/async-storage` | `2.2.0` | Local persistence for favorites/shopping list |
| `react-native-worklets` | `0.10.0` | Worklet threading for Reanimated |
| `react-native-web` | `~0.21.0` | Web target |
| `i18next` | `26.3.6` | Internationalization framework |
| `react-i18next` | `17.0.9` | React bindings for i18next |
| `expo-localization` | `~57.0.0` | Device locale detection |

**Important:** Expo SDK 57 targets React Native 0.86 and React 19.2.3. Never upgrade React Native or React independently of the Expo SDK version. When adding new dependencies, always use `npx expo install <package>` (not `npm install` or `pnpm add`) so Expo can install the compatible version.

Always read the exact versioned docs at **https://docs.expo.dev/versions/v57.0.0/** before writing any code. Do not guess APIs — they change between SDK versions.

---

## Directory Layout

```
app/
├── app.config.ts                   # Expo config (env-driven; replaces app.json)
├── .env.example                    # Documented env template (copy to .env)
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config (extends expo/tsconfig.base)
├── pnpm-lock.yaml                  # Lockfile
├── AGENTS.md                       # This file — AI instructions & conventions
├── CLAUDE.md                       # Redirects to AGENTS.md
├── README.md                       # Developer onboarding
├── assets/                         # Static assets (images, fonts, icons)
│   ├── images/                     # PNG images (icons, splash, favicon)
│   └── expo.icon/                  # iOS icon set directory
├── scripts/
│   └── reset-project.js            # Bootstrap fresh project state
└── src/
    ├── app/                        # File-based routes (Expo Router)
    │   ├── _layout.tsx             # Root layout — ThemeProvider + SavedItemsProvider + AppTabs; `anchor: 'products'` sets the landing tab
    │   ├── index.tsx               # Entry route for `/` - redirects to /products; the landing tab comes from the anchor, not this file
    │   ├── discover.tsx            # Discover / Home screen (route: /discover) - tab hidden, see DISCOVER_ENABLED
    │   ├── alerts/
    │   │   └── index.tsx           # Alerts tab (route: /alerts) - notices from followed agencies
    │   ├── about.tsx               # About tab (route: /about) - app info + developer contact
    │   ├── scan.tsx                # Barcode scanner (route: /scan)
    │   ├── my-list.tsx             # Shopping list + favorite agencies (route: /my-list)
    │   ├── products/               # Products stack
    │   │   ├── _layout.tsx         # Stack layout
    │   │   ├── index.tsx           # Product listing with search & filters
    │   │   └── [id].tsx            # Product detail
    │   └── agencies/               # Agencies stack
    │       ├── _layout.tsx         # Stack layout
    │       ├── index.tsx           # Agencies directory
    │       └── [id].tsx            # Agency detail
    ├── components/                 # Reusable UI components
    │   ├── ui/                     # Generic design-system components
    │   │   ├── collapsible.tsx     # Animated accordion with chevron
    │   │   └── icon.tsx            # Cross-platform Icon (SF Symbol -> Material Symbol)
    │   ├── app-tabs.tsx            # Custom bottom tab bar with elevated Scan button; hosts the top AdBanner + OfflineBanner
    │   ├── ad-banner.tsx           # Full-width AdMob banner anchored at the TOP of the app (native); hidden on /scan
    │   ├── ad-banner.web.tsx       # Web stub for AdBanner (renders nothing)
    │   ├── external-link.tsx       # Link that opens in in-app browser on native
    │   ├── back-button.tsx         # Floating scrim back affordance for pushed screens
    │   ├── themed-text.tsx         # Theme-aware typography component
    │   ├── themed-view.tsx         # Theme-aware container component
    │   ├── product-card.tsx        # Product grid/list card
    │   ├── agency-row.tsx          # Agency list row
    │   ├── kashrut-badge.tsx       # Colored kashrut level badge
    │   ├── certificate-badge.tsx   # Certificate status badge
    │   ├── freshness-indicator.tsx # Last-updated indicator (compact + detailed variants)
    │   ├── freshness-alert.tsx     # Alert banner for stale/outdated products
    │   ├── search-bar.tsx          # Reusable search input
    │   ├── category-chip.tsx       # Filter/tag chip
    │   ├── quantity-stepper.tsx    # Shopping list quantity control
    │   ├── scan-overlay.tsx        # Barcode scanner frame animation
    │   ├── section-header.tsx      # Section title with optional action
    │   ├── empty-state.tsx         # Empty/illustrated state
    │   └── skeleton-card.tsx       # Shimmer loading placeholder
    ├── constants/
    │   ├── icons.ts                # SF Symbol -> Material Symbol table + resolveIconName()
    │   └── theme.ts                # Design tokens: Colors, Fonts, Spacing, Radius, Shadows
    ├── utils/                      # Pure helpers (no React, no I/O)
    │   ├── agencies.ts             # Country grouping for the agencies directory
    │   ├── alerts.ts               # Server alerts -> feed rows: target resolution + ordering
    │   ├── countries.ts            # Country/continent grouping helpers
    │   └── freshness.ts            # Freshness tier computation from updatedAt
    ├── hooks/                      # React hooks
    │   ├── use-color-scheme.ts     # Native: re-exports RN's useColorScheme
    │   ├── use-color-scheme.web.ts # Web: hydration-safe color scheme hook
    │   ├── use-theme.ts            # Returns Colors object for current scheme
    │   ├── use-debounce.ts         # Debounced value hook
    │   ├── use-saved-items.tsx     # Favorites + shopping list context
    │   ├── use-top-inset.tsx       # Where screen content starts (ad banner vs. safe area)
    │   └── use-screen-tracking.ts  # Auto screen_view + flush on background
    ├── i18n/                       # Internationalization
    │   ├── index.ts                # i18next initialization + config
    │   ├── use-locale.ts           # Locale hook with AsyncStorage persistence
    │   └── resources/
    │       ├── en/translation.json # English strings
    │       └── es/translation.json # Spanish strings
    ├── services/                   # API calls + telemetry
    │   ├── api.ts                  # Base fetch client: timeout, abort, URL guards
    │   ├── products.ts             # Product endpoints
    │   ├── agencies.ts             # Agency endpoints
    │   ├── certificates.ts         # Certificate endpoints
    │   ├── countries.ts            # Country endpoints
    │   ├── alerts.ts               # Alerts endpoint (getAlerts, scoped to the followed agencies)
    │   └── telemetry/              # Analytics + error monitoring facade
    │       ├── index.ts            # track / trackScreen / captureError / initTelemetry
    │       ├── events.ts           # Typed event catalog (AnalyticsEvent union)
    │       ├── posthog.ts          # PostHog adapter (consent-gated)
    │       └── sentry.ts           # Sentry adapter (scrubbed)
    ├── types/
    │   └── declarations.d.ts       # Type declarations (e.g., *.css)
    └── global.css                  # CSS custom properties for web fonts
```

---

## Configuration

### TypeScript (`tsconfig.json`)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/assets/*": ["./assets/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

- `strict: true` is mandatory. Do not disable or weaken strictness.
- Path aliases: `@/components/foo` resolves to `src/components/foo`. `@/assets/icon.png` resolves to `assets/icon.png`.
- Use path aliases for all cross-directory imports. Use relative imports (`./`, `../`) only within the same directory.

### Expo Config (`app.config.ts`)

There is **no `app.json`** — it was replaced by `app.config.ts` so that environment-dependent
values are read from `process.env` at build time instead of being committed. Expo CLI loads
`.env` / `.env.local` before evaluating the file.

- `typedRoutes: true` enables type-safe `<Link href="...">` and `router.push(...)`. Always use typed routes.
- `reactCompiler: true` enables the React Compiler for automatic memoization. Avoid manual `useMemo`/`useCallback` — the compiler handles optimization.
- `userInterfaceStyle: "automatic"` means the app follows the device light/dark setting.
- When adding Expo plugins (camera, notifications, maps, etc.), add them to the `plugins` array.
- **Plugins that need credentials are added conditionally.** The Sentry plugin only appears when
  `SENTRY_ORG` + `SENTRY_PROJECT` are set; the AdMob plugin only when `ADS_ENABLED=true` **and**
  both app ids are present. AdMob's native init hard-fails at startup with invalid ids, so a
  half-configured build must not link it at all. Follow this pattern for any future native plugin
  that requires keys.
- `android.permissions` deliberately lists **only** `CAMERA`. `expo-camera` would add
  `RECORD_AUDIO` by default; the plugin is configured with `recordAudioAndroid: false` because the
  app never captures audio. An unused microphone permission is a store-review flag for no benefit.
- **Never add `ACCESS_NETWORK_STATE` or `VIBRATE` to `android.blockedPermissions`.** NetInfo's
  reachability listener is declared by `@react-native-community/netinfo`, and it silently reports
  *offline* when the permission is stripped (its `ConnectivityManager` calls throw and are caught).
  React Query then pauses every query and the app renders nothing behind the `OfflineBanner` — a
  total blackout, not a visible error. `VIBRATE` is what `expo-haptics` needs on Android. Blocking
  either is a functional regression disguised as permission hygiene.

### Environment configuration

Never read `Constants.expoConfig?.extra` directly. Everything goes through
**`src/constants/config.ts`**, which types, validates and defaults every value in one place:

```tsx
import { Config, APP_VERSION, IS_PRODUCTION } from '@/constants/config';

Config.apiUrl;        // string
Config.environment;   // 'development' | 'staging' | 'production'
Config.adsEnabled;    // boolean
Config.sentryDsn;     // string ('' when unconfigured)
```

**Adding a new config value** — all four steps, in the same turn:

1. Add the variable to `.env.example` with a comment explaining what it is and where to get it.
2. Read it in `app.config.ts` and publish it under `extra`, with a sensible default.
3. Add the field to the `AppConfig` interface and the `Config` object in `src/constants/config.ts`.
4. Consume it via `Config.<field>`.

**Nothing in `extra` is secret.** Every value ends up inside the shipped bundle and is readable by
anyone with the app — these are public client identifiers only (a DSN, a project API key, an ad
unit id). Anything that must stay private belongs behind the API. `SENTRY_AUTH_TOKEN` is the one
build-time-only variable: it is used by the source-map upload and is never published to `extra`.

---

## Architectural Rules

### 1. Expo Router file-based routing — no `@react-navigation/*` imports

Expo SDK 57 no longer supports importing from `@react-navigation/*` packages. Use the Expo Router equivalents:

- `useNavigation()` from `expo-router` (not `@react-navigation/native`)
- `<Stack>`, `<Tabs>` from `expo-router` (not `@react-navigation/stack` or `@react-navigation/bottom-tabs`)
- `useFocusEffect()` from `expo-router`
- Navigation types from `expo-router` built-ins

### 2. UI component priority

1. **`@expo/ui` universal components** — prefer these for cross-platform built-in look and feel. They delegate to SwiftUI on iOS, Jetpack Compose on Android, and DOM on web. Use for: buttons, text, switches, pickers, lists, bottom sheets, collapsibles, sliders, checkboxes, text inputs, icons.
2. **`react-native` primitives** — use when `@expo/ui` does not provide the needed component or you need fine-grained layout control. Common primitives: `View`, `ScrollView`, `FlatList`, `Pressable`, `TextInput`.
3. **Custom wrappers** (`ThemedText`, `ThemedView`) — use these for consistent theming. Always import from `@/components/themed-text` and `@/components/themed-view` for text and containers.

When choosing between `@expo/ui/universal` and platform-specific packages (`@expo/ui/swift-ui`, `@expo/ui/jetpack-compose`), always prefer universal unless you need a platform-specific control, modifier, or behavior that the universal API does not expose.

**Icons go through `Icon` from `@/components/ui/icon`.** Never import `SymbolView` from `expo-symbols` directly. `expo-symbols` renders nothing on Android or web unless it is given a *per-platform* name — an SF Symbol string alone is iOS-only, which is exactly the bug that left the bottom tab bar blank on Android. The wrapper accepts the SF Symbol string the app is written against and resolves the Material Symbol equivalent through the table in `src/constants/icons.ts`, so `name="bell"` renders on all three platforms. A glyph that genuinely differs per platform can pass `{ ios, android, web }` instead; anything explicit wins over the table. **When you introduce a new glyph, add its SF -> Material entry to `src/constants/icons.ts` in the same change** — an unmapped name degrades to iOS-only (nothing on Android/web) rather than to a wrong icon.

### 3. Platform variants via file extensions, not runtime checks

Use Expo Router's platform-specific file extensions:

- `.web.tsx` — web-only implementation
- `.ios.tsx` — iOS-only implementation
- `.android.tsx` — Android-only implementation
- `.tsx` — shared implementation (fallback when no platform-specific file exists)

Do **not** use `Platform.OS === 'ios'` conditionals for entire component implementations. Platform files are cleaner, tree-shakeable, and type-safe. The `Platform` API is acceptable for small style tweaks (e.g., `Platform.select({ ios: 50, android: 80 })` for tab bar insets).

### 4. All styles via `StyleSheet.create`

```tsx
// CORRECT
import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
});

// WRONG — never use inline style objects
<View style={{ flex: 1, padding: 16 }} />
```

- Styles go at the bottom of the file, after the component.
- Use the `Spacing` constants from `@/constants/theme` instead of hardcoded values.

### 5. All code, comments, commit messages, and logs in English

No exceptions. The entire codebase is English-only.

### 6. Target: iOS, Android, Web

Every screen and component must work on all three platforms. Test or consider behavior on:
- iOS (native navigation, safe areas, SwiftUI-backed `@expo/ui`)
- Android (Jetpack Compose-backed `@expo/ui`, predictive back gesture disabled)
- Web (static export SPA, DOM-backed `@expo/ui`, CSS modules for web-only styles)

### 7. No comments except JSDoc documentation

Do **not** write inline or block comments in the code. The only exception is **JSDoc**
(`/** ... */`) documenting a public API — an exported function, component, hook, type or constant —
where the *why*, the contract, or a non-obvious constraint is not already clear from the name and
types.

- **Allowed:** a JSDoc block above an exported symbol explaining behavior, parameters, return
  value, or a subtle invariant.
- **Forbidden:** explanatory `//` or `/* ... */` comments inside function bodies, section banners,
  commented-out code, "what this does" narration, or restating the code in words.
- When a comment would be needed to explain *what* the code does, rename or extract instead.

---

## TypeScript Conventions

### Strict mode — no `any`

```tsx
// WRONG
function getData(): any { ... }

// CORRECT — be explicit or use `unknown`
function getData(): Product | null { ... }
function getData(): unknown { ... }

// When you must defer typing, use `unknown` and narrow with type guards
const raw: unknown = await fetch(...);
if (isProduct(raw)) { /* raw is Product here */ }
```

### Type-only imports

```tsx
import type { ThemeColor } from '@/constants/theme';
import { Colors } from '@/constants/theme';
```

### Props typing

```tsx
// Interface for component props (public API)
export interface ThemedTextProps extends TextProps {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
}

// Type alias for unions, intersections, utilities
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
```

- Use `interface` for public-facing props (extends well, produces better DX errors).
- Use `type` for unions, intersections, mapped types, and utility types.
- Always export prop types alongside the component — consumers need them.

### Imports organized by group

```tsx
// 1. Expo / third-party
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

// 2. Internal (path aliases)
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Colors } from '@/constants/theme';

// 3. Relative (same directory only)
import { AnimatedIcon } from './animated-icon';
```

### Non-null assertions — avoid in production code

```tsx
// WRONG
const name = user!.name;

// CORRECT
const name = user?.name ?? 'Unknown';
if (!user) return null;
```

### Enums — use string unions over TypeScript enums

```tsx
// PREFERRED
type Status = 'idle' | 'loading' | 'success' | 'error';

// AVOID
enum Status { Idle, Loading, Success, Error }
```

---

## Design System & Theming

### Visual language — avoid AI-default UI

The UI must read as a designed product, not as a generated one. The generic "AI"
look is a recognizable set of tics: a rounded pill with a tinted fill, a hairline
border and a leading icon wrapped around a single line of text; a badge for every
value; gradient text; sparkle glyphs; a card nested in a card. Resist it.

- **No container for a single fact.** A status, count or timestamp that fits on one
  line is text, not a pill. Do not wrap it in a rounded, tinted, bordered chip with
  an icon. A small colored dot is the most decoration a plain status line should
  carry - see `FreshnessIndicatorDetailed`.
- **An icon must add information.** No decorative glyphs next to labels, no
  checklist-style icons on every row. If the text already says it, the icon is noise.
- **Prefer hierarchy over boxes.** Establish emphasis with size, weight and color
  (`Typography`, `text`/`textSecondary`/`textMuted`) before reaching for a border, a
  fill or a shadow.
- **Do not state one fact twice.** A date and a "N days ago" pill, a heading and a
  badge that restates it - pick the one that carries the meaning.
- **Corners are earned.** Only genuinely pill-shaped controls (chips, the CTA
  button, the tab bar) use `Radius.round`; cards use `Radius.lg`/`xl`. Not everything
  is a rounded rectangle.
- **Motion is a hint, not a performance.** Fades and short slides only - no bouncing
  entrances, no spring overshoot on full-height surfaces.
- **No gradients, glows or "magic" affordances** (sparkles, shine sweeps, animated
  gradients) anywhere in the app.
- Extend an existing pattern (`KashrutBadge`, `CertificateBadge`, `FreshnessAlert`,
  metatype rows) when a new element is needed, instead of inventing a new badge shape.

### Single source of truth: `src/constants/theme.ts`

All design tokens live here:

| Export | Purpose |
|---|---|
| `Colors` | Light/dark color palettes (readonly object) |
| `ThemeColor` | Union type of all color keys |
| `Fonts` | Platform-specific font families |
| `Typography` | Font size / weight / line-height tokens |
| `Spacing` | Numeric spacing scale (half through ten) |
| `Radius` | Border radius tokens |
| `Shadows` | Elevation shadow styles |
| `Layout.tabBarHeight` | *Estimate* of the floating tab bar's height, used before the first layout pass; screens dock to the measured `useTopInset().tabBarHeight` at runtime |
| `AdBannerHeight` | *Minimum* height reserved for the top AdMob banner (50 native, 0 web); the adaptive banner's real height is measured at runtime |
| `MaxContentWidth` | Max width for content (800px) |

### Colors

```ts
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
  dark: { /* mirrored keys with dark values */ },
} as const;
```

- Every color key **must exist in both** `light` and `dark`.
- `as const` ensures the values are read-only and enables `ThemeColor` type inference.
- Use `ThemeColor` as the prop type when a component accepts a color key from the theme.
- **A fill that carries text carries its own `…Foreground` token.** `primary`/`primaryForeground`,
  `accent`/`accentForeground`, `warning`/`warningForeground`,
  `surfaceContrast`/`surfaceContrastForeground`. Never paint a fill in one token and its label in
  another (`textInverse` in particular flips to near-black in dark mode and disappears on dark
  fills) - that is what made the active My List tab unreadable.
- `overlay` / `overlayForeground` are a scheme-independent scrim pair for anything that floats over
  arbitrary content (the back button, the scan hint). Because the scrim is always dark, its
  foreground is always light.
- `logoPlate` / `logoPlateForeground` are a fixed light tile for logos and product imagery. Agency
  and product artwork is designed for light backgrounds, so it is placed on a light plate in **both**
  schemes rather than on `surface`, which is why dark/transparent logos used to vanish.
- **Translucent fills go through `useTintAlpha()`**, never a hardcoded alpha suffix. A tint that
  reads on a light surface is invisible on a dark one, so `` `${theme[color]}${useTintAlpha()}` ``
  resolves to `15` in light and `2A` in dark.
- `warning` is intentionally dark enough (light `#A85F12`) that it clears AA both as text on a light
  surface and as a fill under `warningForeground`; the same is true of the raised dark text/verdict
  tones (`textMuted`, `success`/`pareve`, `chalavYisrael`). `src/constants/theme.test.ts` pins every
  one of these ratios, so a new token must be chosen to satisfy it.

### How to add a new color

1. Add the key-value pair to **both** `Colors.light` and `Colors.dark`.
2. The `ThemeColor` type updates automatically (it's derived from the intersection of both keys).
3. Use `theme['newColor']` or `themeColor={'newColor'}` in components.

### ThemedText and ThemedView

Always use these wrappers instead of raw `Text` and `View` when you need theme-aware colors:

```tsx
import { ThemedText, ThemedTextProps } from '@/components/themed-text';
import { ThemedView, ThemedViewProps } from '@/components/themed-view';

// ThemedText auto-colors based on theme
<ThemedText type="h1">Welcome</ThemedText>
<ThemedText type="body" themeColor="textSecondary">Subtitle</ThemedText>

// ThemedView auto-backgrounds based on theme
<ThemedView type="surface" style={styles.card}>...</ThemedView>
```

### Spacing scale

```ts
Spacing.half   // 2
Spacing.one    // 4
Spacing.two     // 8
Spacing.three   // 12
Spacing.four    // 16
Spacing.five    // 20
Spacing.six     // 24
Spacing.seven   // 32
Spacing.eight   // 40
Spacing.nine    // 48
Spacing.ten     // 64
```

Use these in `StyleSheet.create` calls:

```tsx
const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
```

---

## Internationalization (i18n)

The app supports multiple languages using `i18next` + `react-i18next` with device locale detection via `expo-localization`.

### Supported locales

| Locale | Language | Status |
|---|---|---|
| `en` | English | Primary (fallback) |
| `es` | Spanish | Full translation |

### Architecture

```
src/i18n/
├── index.ts              # i18next initialization, locale detection, exports configured i18n instance
├── use-locale.ts         # useLocale() hook — gets/sets locale, persists to AsyncStorage
├── resources/
│   ├── en/
│   │   └── translation.json   # English strings (single namespace: "translation")
│   └── es/
│       └── translation.json   # Spanish strings (mirror structure)
```

### Adding a new language

1. Copy `src/i18n/resources/en/translation.json` to `src/i18n/resources/<locale>/translation.json`
2. Translate every key (keep the JSON structure identical)
3. Add the locale code to `SUPPORTED_LOCALES` in `src/i18n/index.ts`
4. Import and register the new resource in `i18n.init({ resources: { ... } })`

### Adding a new string

1. Add the key + English value to `src/i18n/resources/en/translation.json` under the appropriate section
2. Add the same key + translated value to `src/i18n/resources/es/translation.json`
3. Use `t('section.key')` in components

Key naming convention: dot-notation paths mirroring UI hierarchy (`scan.cameraPermissionTitle`, `products.addToList`).

### Runtime rules

- **`useTranslation()` from `react-i18next`** — use in every component/screen that has user-facing text
- **`t('key', { var: value })` for interpolation** — never concatenate translated strings with variables directly
- **Never hardcode user-facing strings** — all strings must go through `t()` or come from the API
- **Proper nouns (names, brands, agency labels) come from the API** — do not translate them
- **Country display is code-based** — `CountryEntity.code` is an ISO 3166-1 alpha-2 identifier (e.g. `mx`, `pa`). Resolve it to a translated name with `getCountryTranslationKey(code)` + `t(key, code?.toUpperCase() ?? '')` (the second arg is a fallback for rows whose `code` is `null` or the i18n key is missing). See the "Pattern: country display" section below.
- **Locale is detected from device** on first launch via `expo-localization`, then persisted in AsyncStorage (`@kosher-pass:locale`)
- **Fallback is always English** — missing keys in a locale fall through to `en`
- **`I18nextProvider` wraps the root** in `_layout.tsx`, outside `ThemeProvider` — i18n is available to all components

### Pattern: translating mapped labels (badges, chips)

For components that display labels based on data values (e.g., `KashrutBadge`, `CertificateBadge`, category chips), use a **translation key map**:

```tsx
// In kashrut-badge.tsx
const kashrutTranslationKeys: Record<KashrutLevel, string> = {
  unknown: 'common.kashrut.unknown',
  pareve: 'common.kashrut.pareve',
  dairy: 'common.kashrut.dairy',
  meat: 'common.kashrut.meat',
  dairy_chalav_yisrael: 'common.kashrut.chalavYisrael',
};

export function KashrutBadge({ level }: { level: KashrutLevel }) {
  const { t } = useTranslation();
  return <ThemedText>{t(kashrutTranslationKeys[level])}</ThemedText>;
}
```

### Pattern: filter chips with separate value and label

For filter/sort controls where the display label must be translated but the underlying value must stay in English (for API calls), use arrays of `{ translationKey, value }` pairs:

```tsx
const CATEGORIES = [
  { translationKey: 'common.categories.snacks', value: 'Snacks' },
  { translationKey: 'common.categories.beverages', value: 'Beverages' },
  // ...
];

// In render:
{CATEGORIES.map(cat => (
  <CategoryChip
    key={cat.value}
    label={t(cat.translationKey)}
    onPress={() => filterBy(cat.value)}
  />
))}
```

### Pattern: country display (code → translated name)

The server stores a stable ISO 3166-1 alpha-2 code on every country (e.g. `mx`, `pa`, `us`). The display name is **not** sent by the API — the app resolves the code through i18n. Translations live under `common.countries.<code>` in `src/i18n/resources/<locale>/translation.json` for every supported code. To keep this DRY, the helper `getCountryTranslationKey(code)` in `@/utils/countries` returns the i18n key for a given code.

1. **Always resolve through `t()`** — the `CountryOption` / `countryId` payload only carries the ISO `code` (the server does not return a `label`). The pattern is `t(getCountryTranslationKey(country.code), (country.code ?? '').toUpperCase())`. The second argument to `t()` is the fallback shown when the code is `null` (rows not yet backfilled) or the i18n key is missing (a new code was added but a translation was not). The upper-cased code (e.g. `MX`, `PA`) is a stable, locale-independent fallback — for a friendlier one, add a `common.countries.<code>` entry in both locales.
2. **Search in the active locale** — when implementing a country search input (filter sheet, etc.), compare the query against the *translated* name, not against the raw `code`. Otherwise Spanish users typing "méjico" would not match "México" / `mx`. Compute the translated name for every country up front and match against it.
3. **Sort by the translated name** — when ordering countries inside a continent or in the active filter chips, sort by the translated display string so that "México" sorts next to "México" and "Estados Unidos" sorts under "E" in Spanish. (The pure helper `groupCountriesByContinent` falls back to sorting by `code` because it has no access to `t`; re-sort in the component if you need locale-aware order.)
4. **Adding a new country** — insert the row in the DB with the appropriate `code` (ISO 3166-1 alpha-2), add `common.countries.<code>` to **both** `en/translation.json` and `es/translation.json` (and any future locale), and the helper picks it up automatically.

```tsx
import { getCountryTranslationKey } from '@/utils/countries';
import { useTranslation } from 'react-i18next';

function CountryRow({ country }: { country: CountryOption }) {
  const { t } = useTranslation();
  return (
    <ThemedText>
      {t(getCountryTranslationKey(country.code), (country.code ?? '').toUpperCase())}
    </ThemedText>
  );
}
```

### Pattern: filter bottom sheet (modal)

When a screen has many filters (Kashrut, Mehadrin, Category, Agency, etc.), do **not** render all of them inline — they take too much vertical space. Instead:

1. Show a compact trigger button next to the search bar (`line.3.horizontal.decrease` / `tune` icon).
2. If any filter is active, display a small badge with the active count on the trigger.
3. Optionally show a horizontal scrollable row of removable "active filter chips" below the search bar.
4. Tapping the trigger opens a `Modal` styled as a bottom sheet (see `src/app/products/index.tsx`):
   - `transparent` modal with a dark backdrop (`rgba(0,0,0,0.5)`)
   - Slide-in-down animation via `react-native-reanimated` — use a **timed** slide with `Easing.out(Easing.cubic)` (~280ms), **not** `springify()`, to avoid overshoot/rebounding on a full-height sheet
   - Sheet uses `theme.surface` background, `Radius.xl` top corners, `Shadows.lg`
   - Pull-up handle bar at the top
   - Sections inside use `FilterSection` (uppercase label + chip wrap) with `flexWrap: 'wrap'` chips
   - Footer with "Cancel" (ghost button) and "Apply" (accent button)
5. Use a "pending state" inside the sheet so users can stage changes before applying; only commit to the parent state on Apply.

Never render 4+ horizontal-scroll filter rows inline on a list screen.

### Pattern: country filter (continent → country → agency)

When a screen needs a country filter (products, agencies, scan results, etc.), follow the two-level Country + Agency pattern:

1. **Single data source.** Call `getCountriesWithAgencies()` from `@/services/countries` once. This returns `[{ id, code, continent, agencies: [{ id, name }] }]` — countries with their active agencies bundled. `code` is the ISO 3166-1 alpha-2 identifier used to resolve a translated display name via `getCountryTranslationKey()`; the API does not return a `label`, so the only fallback when `code` is `null` or the i18n key is missing is the upper-cased `code` itself. Derive both the country list and the agency list from this single response.
2. **Country first, Agency optional.** Render the "Country" section above the "Agency" section. Country is primary; Agency is a secondary refinement, scoped to the selected countries.
3. **Group countries by continent** using `groupCountriesByContinent()` from `@/utils/countries`. The grouping is client-side (the `Country` entity has no continent column) and lives in a small lookup table; anything unmapped is filtered out. Continent labels go through `common.continents.<key>` translation keys.
4. **Inline chevron row per continent** (do **not** use the generic `Collapsible` here — it doesn't match the bottom-sheet density). Each row has:
   - Continent label + a `selectedCount/total` badge (accent when selected, muted otherwise)
   - A `chevron.down` icon that rotates 180° on expand
   - A `CategoryChip` wrap of countries when open — labels are the **translated** country name (`t(getCountryTranslationKey(country.code), (country.code ?? '').toUpperCase())`), not the raw `code`
5. **Auto-expand the rows that already have a pending selection** so users see what they picked without hunting. The auto-expand must only fire once per row per sheet open — use a `useRef` flag to guard it.
6. **Multi-select countries.** State is `Set<number>` of country IDs, mirrored as `pendingCountryIds` inside the sheet. Toggling a country creates a new `Set` so React detects the change.
7. **Scope the Agency list to the pending country selection.** Compute `availableAgencies` from `pendingCountryIds` (not `selectedCountryIds`) so the sheet reflects the staged state. When no countries are pending, show all agencies.
8. **Search inputs in each section.** Add a `SearchBar` at the top of both the Country and Agency sections. Country search filters the continent groups (hide empty groups). Agency search filters the agency chips. **Country search must match against the translated name** (call `t(getCountryTranslationKey(country.code), (country.code ?? '').toUpperCase())` first and compare), not against the raw `code`, so users can search in their own language. Use local state (`countrySearch`, `agencySearch`) that resets when the sheet opens.
9. **Active filter chips row.** Wrap the horizontal `FlatList` in a `View` with `paddingHorizontal: Spacing.four` (do **not** put `paddingHorizontal` on `contentContainerStyle` — it has been observed to be ignored on some RN versions, causing chips to bleed off the left edge). Keep `paddingTop` and `gap` on `contentContainerStyle` so the scroll content is correct. Country chip labels use the translated name.
10. **Cap the active country chips at 6**, then add a static `+N more` chip that opens the filter sheet (use `common.filters.moreSelected` for the label). Chips with a defined `onRemove` show an `xmark` glyph; the `+N more` chip is tap-only.

### Pattern: active filter chip row

The horizontal row of removable filter chips below the search bar has a known left-overflow bug if `paddingHorizontal` is placed on the `FlatList`'s `contentContainerStyle`. Always wrap the `FlatList` in a `View` that owns the horizontal padding:

```tsx
<View style={styles.activeChipsWrapper}>   // paddingHorizontal: Spacing.four
  <FlatList
    horizontal
    data={activeChips}
    contentContainerStyle={styles.activeChipsList}  // paddingTop + gap ONLY
    renderItem={...}
  />
</View>
```

The chip itself keeps `paddingHorizontal: Spacing.three` internal padding so the label and dismiss glyph have breathing room.

### Locale switching

To build a language picker, use the `useLocale()` hook from `@/i18n/use-locale`:

```tsx
import { useLocale } from '@/i18n/use-locale';
const { locale, setLocale } = useLocale();
// setLocale('es') switches to Spanish, persists choice to AsyncStorage
```

---

## Navigation Patterns

### Root layout (`src/app/_layout.tsx`)

- Wraps everything in `ThemeProvider` (from `expo-router`, with `DarkTheme`/`DefaultTheme`).
- Wraps everything in `SavedItemsProvider` for favorites and shopping list state.
- Renders `AppTabs` (custom tab navigator): Alerts (`/alerts`), Products (`/products`), My List (`/my-list`), Agencies (`/agencies`), About (`/about`). Scan (`/scan`) and Discover (`/discover`) are currently hidden - see "Hidden tabs" below.
- Exports `unstable_settings = { anchor: 'products' }` so the headless tab navigator lands on
  Products instead of the shortest route name. See "Headless tabs register *only* the routes a
  `TabTrigger` points at" below before changing the tab set.
- `SafeAreaView` handles the **horizontal edges only**. The top edge belongs to `AppTabs`, which
  either gives it to the ad banner or hands it to screens through `useTopInset()` - see the ads
  pattern below. Never add `edges={['top']}` here: it would double-pad every screen.

### Adding a new screen

1. Create the route file in `src/app/` following Expo Router conventions:
   - `src/app/feature/index.tsx` → `/feature`
   - `src/app/feature/[id].tsx` → `/feature/123` (dynamic segment)
   - `src/app/feature/_layout.tsx` → optional nested layout
2. Add a `Screen` or `TabTrigger` in the parent `_layout.tsx`.
3. Use `<Link href="/feature">` or `router.push('/feature')` for navigation.

### Navigation APIs

```tsx
import { Link, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';

// Declarative navigation
<Link href="/profile/123">Go to Profile</Link>
<Link href={{ pathname: '/profile/[id]', params: { id: '123' } }}>Go to Profile</Link>

// Imperative navigation
const router = useRouter();
router.push('/profile/123');
router.back();
router.replace('/home');

// URL parameters
const { id } = useLocalSearchParams<{ id: string }>();

// Refetch data when screen gains focus
useFocusEffect(
  useCallback(() => {
    fetchData();
    return () => { /* cleanup */ };
  }, [])
);
```

### Tab navigation

The app uses a single custom tab bar (`src/components/app-tabs.tsx`) built with `Tabs`, `TabList`, `TabTrigger`, `TabSlot` from `expo-router/ui`. It renders the same UI across iOS, Android, and Web, including an elevated Scan button in the center.

**Keep the visible entry count odd.** Every entry is a `flex: 1` slot, so the raised Scan button only reads as centred when the same number of tabs flanks it. The Scan trigger is currently commented out, so the bar renders five entries (Alerts, Products, My List, Agencies, About) — restoring Scan, or Discover, makes six and pulls the gold button off centre unless another tab is dropped.

Tabs:
- **Alerts** (`/alerts`) — Landing tab: the notices published by the agencies the user follows
- **Products** (`/products`) — Browse, search, and filter all products
- **Scan** (`/scan`) — Barcode scanner (elevated, gold accent) — currently commented out of `tabKeys`
- **My List** (`/my-list`) — Shopping list + favorite agencies
- **Agencies** (`/agencies`) — Certifying agencies directory
- **About** (`/about`) — App info, version, and developer contact

#### Hidden tabs

A tab that has to disappear from the bar temporarily is gated by a module-level flag in
`src/components/app-tabs.tsx` rather than deleted, so bringing it back is a one-line change and the
screen keeps its git history. **Discover** is currently hidden this way; **Scan** is commented out
inline in `tabKeys` (its route, `src/app/scan.tsx`, is untouched).

- `DISCOVER_ENABLED = false` drops its entry from `tabKeys`.
- The screen itself lives at `src/app/discover.tsx` (route `/discover`), reachable by URL but not
  linked from anywhere.
- `src/app/index.tsx` is a `<Redirect href="/products" />` and is **required**: a cold start and a
  bare `kosherpass://` deep link both resolve to the `/` URL, and `/` is not a screen the headless
  tab navigator registers. Delete it and the app opens on Expo Router's "Unmatched Route" screen.
  It does not decide the landing *tab* - the anchor in `_layout.tsx` does.

#### Headless tabs register *only* the routes a `TabTrigger` points at

`AppTabs` uses Expo Router's **headless** `Tabs`, and its `TabList` is the navigator's entire
screen list. Routes with no trigger - `index`, `discover`, `scan` - are **not** registered as
screens, so an `index.tsx` that returns `<Redirect />` never renders as a *tab*; it exists only to
answer the `/` URL that a cold start or a bare deep link resolves to.

That default is the first screen after `sortRoutes`, which sorts non-dynamic routes by **name
length**. With no anchor the five tabs are ordered `about` (5) < `alerts` (6) < `my-list` (7) <
`products`/`agencies` (8), so About became the landing screen the moment it was added.

`src/app/_layout.tsx` therefore exports `unstable_settings = { anchor: 'products' }`. `anchor`
pins both the navigator's `initialRouteName` and the first position in the sorted screen list, so
Products is the landing screen. The `/` URL itself is answered separately by `src/app/index.tsx`,
which redirects to `/products` - the anchor does **not** cover it. **Any change to the landing tab
must update the anchor** - reordering `tabKeys` is not enough.

The anchor is matched against the route node's name **in the tab navigator itself**, so the exact
string depends on the route's shape. A directory that owns a `_layout.tsx` collapses to a single
route named after the directory (`products/_layout.tsx` -> `products`), while a directory with no
layout of its own keeps the `/index` suffix on its index route (`alerts/index.tsx` -> `alerts/index`,
a flat `about.tsx` -> `about`). An anchor that does not match exactly fails at startup with
`Couldn't find a screen named ... to use as 'initialRouteName'`. When in doubt, log the route tree or
check the valid-options list in the `invalid anchor` error, which enumerates every accepted name.

To restore Discover: flip the flag to `true`, delete `src/app/index.tsx`, rename `discover.tsx` back
to `index.tsx`, point the tab's `href` at `/`, and update the anchor in `_layout.tsx` if Discover
should land first. Both restorations bring the bar to six entries - see "Keep the visible entry
count odd" above.

---

## State Management & Data Fetching

### Philosophy

- **Server state lives in TanStack Query, client state in hooks + Context.** The two are
  deliberately separate. Query owns anything that comes from the API: caching, deduplication,
  cancellation, retry, background refetch and the persisted offline cache. Do **not** re-implement
  that with `useState` + `useEffect` in a screen.
- **No Redux, Zustand, or other client-state libraries** unless the app's scale demonstrably
  justifies them. React Query is not one of these - it is a server-state cache, and it exists here
  because the app is used inside supermarkets where the network is worst.
- **Co-locate state** as close to where it's consumed as possible. Lift state only when needed.
- **Server state** (API responses) should live in the screen/component that fetches it unless shared across screens.
- **Persistent local state** (favorites, shopping list) lives in `SavedItemsProvider` and is backed by `@react-native-async-storage/async-storage`.

### API calls in `src/services/`

Each domain gets its own service file:

```
src/services/
├── api.ts            # Base API client (base URL, headers, auth tokens)
├── products.ts       # Product-related API calls
├── agencies.ts       # Agency-related API calls
└── certificates.ts   # Certificate-related API calls
```

Service file template:

```tsx
import { apiGet } from './api';

export interface Product {
  id: number;
  name: string;
  // ...
}

export async function getProducts(
  search?: string,
  options?: ApiRequestOptions,
): Promise<Product[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiGet<Product[]>(`/products${params}`, options);
}

export async function getProductById(
  id: number,
  options?: ApiRequestOptions,
): Promise<Product | null> {
  try {
    return await apiGet<Product>(`/products/${id}`, options);
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null;
    throw error;
  }
}
```

**`apiGet` requires a schema.** There is no untyped fetch path: the response is parsed by a zod
schema from `src/services/schemas.ts`, and the return type is inferred from it. `response.json() as T`
is a cast that checks nothing at runtime, and this app's entire output is a kashrut verdict - a
malformed or tampered payload must not be able to reach the UI.

The schemas are also the **anti-corruption layer**. The API mirrors TypeORM entities, where a
relation column is named after its foreign key even though it carries the whole row (`agencyId` is
an `Agency`). The rename happens once, in `schemas.ts`, so everything above it reads
`product.agency`, `product.certificate`, `product.country`. Never reintroduce the wire names above
that boundary.

Schema tolerance is deliberate and asymmetric:

- Unknown extra properties are **stripped**, so the server can add a field without breaking
  deployed apps.
- A missing or wrong-typed **required** field is a **hard failure** - rendering "pareve" from an
  absent `kashrutLevel` is worse than showing an error.
- `kashrutLevel` and `certificateStatus` **fall back** instead of failing: hiding a real product
  from someone standing in a shop is worse than showing it with an unknown level.
- Product listings drop individual malformed rows (`resilientProductPage`) rather than blanking the
  catalog, and report the drops so a data-quality problem does not hide behind a shorter list.

**Every service function takes an optional `ApiRequestOptions` as its last parameter** and passes
it straight to `apiGet`. Callers use it to cancel:

```tsx
useEffect(() => {
  const controller = new AbortController();
  getProducts(undefined, { signal: controller.signal })
    .then(setProducts)
    .catch(err => {
      if (isAbortError(err)) return;   // superseded or unmounted - not an error state
      setError(err.message);
    });
  return () => controller.abort();
}, []);
```

### Fetching data: use the query hooks

Screens do not call the service layer directly. `src/hooks/use-queries.ts` exposes one hook per
resource; each forwards React Query's `AbortSignal` into the service, so cancellation on unmount
and on a superseded search is automatic.

```tsx
const productsQuery = useProductsQuery({ name: debouncedSearch.trim() || undefined });
const products = flattenProductPages(productsQuery.data?.pages);

// Cached pages render while a refetch runs, so the skeleton only shows when
// there is genuinely nothing yet.
const showSkeleton = productsQuery.isPending;
// Only surface an error when there is no cached content to fall back on.
const error = productsQuery.isError && products.length === 0 ? productsQuery.error : null;
```

Two rules that follow from the offline cache:

1. **`isPending`, not `isLoading`/`isFetching`, gates the skeleton.** A background refetch must
   never blank content the user is already reading.
2. **An error state only wins when the list is empty.** Offline with a warm cache is a working
   app, not an error screen - the `OfflineBanner` is what communicates the difference.

Adding a resource means adding a hook there and a key to `queryKeys` in
`src/services/query-client.ts`. Never write an inline query key: a typo'd key is a cache entry
nothing can invalidate.

### Loading, error, and empty states

**On a screen with pull-to-refresh, the empty and error states go *inside* the list, via
`ListEmptyComponent` — never as a sibling that replaces it.** Swiping down to retry is wanted most
exactly when the screen is empty (a failed request, a feed with nothing in it yet), and a plain
`View` in that slot has nothing to pull. Give the list `contentContainerStyle={[styles.listContent,
isEmpty && { flexGrow: 1 }]}` so the empty state can take the viewport and centre itself. Only the
*initial* load replaces the list, with a spinner — there is nothing to refresh yet. See
`src/app/alerts/index.tsx`.

If a state genuinely has nothing to fetch (the alerts feed with an empty follow list, whose query is
disabled), guard the refresh handler with an early return rather than firing a request the screen
does not want — an unscoped one can return far more than the user asked for.


Every screen that fetches data **must** handle three states:

```tsx
type Status = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export default function ProductsScreen() {
  const [status, setStatus] = useState<Status>('idle');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus('loading');
    getProducts()
      .then(data => {
        setProducts(data);
        setStatus(data.length === 0 ? 'empty' : 'success');
      })
      .catch(err => {
        setError(err.message);
        setStatus('error');
      });
  }, []);

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'error') return <ErrorScreen message={error} onRetry={...} />;
  if (status === 'empty') return <EmptyScreen message="No products found" />;

  return <ProductList products={products} />;
}
```

### Environment configuration for API URLs

Never hardcode API URLs. Use `expo-constants` or an environment config module:

```tsx
// Anywhere that needs configuration:
import { Config } from '@/constants/config';

Config.apiUrl;  // typed, validated, defaulted in one place
```

See the "Environment configuration" section above for how to add a new value.

---

## Component Patterns

### File structure

One component per file. Co-locate related files:

```
src/components/
├── product-card.tsx           # Component
├── product-card.test.tsx      # Tests (when testing is set up)
├── product-list.tsx           # Parent component
├── product-list.test.tsx
└── ui/                        # Generic/reusable design-system components
    └── collapsible.tsx
```

### Component template

```tsx
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

import { ThemedView, type ThemedViewProps } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export interface ProductCardProps extends ThemedViewProps {
  product: {
    id: string;
    name: string;
  };
  onPress?: (id: string) => void;
}

export function ProductCard({ product, onPress, style, ...rest }: ProductCardProps) {
  return (
    <ThemedView type="surface" style={[styles.card, style]} {...rest}>
      <ThemedText type="smallBold">{product.name}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
});
```

### Rules

- **Named exports** for all components. No `export default function` except for route files (`_layout.tsx`, `index.tsx`) where Expo Router requires it, and platform-switched files (`app-tabs.tsx`/`app-tabs.web.tsx`) where the default export serves as the platform-dispatched module.
- **Expose prop types** alongside the component so consumers need them.
- **Spread remaining props** (`...rest`) onto the root element so `style`, `testID`, and accessibility props work.
- **Colocate styles** at the bottom of the file via `StyleSheet.create`.
- **Extract reusable subcomponents** when a single file exceeds ~200 lines or when the subcomponent is reused elsewhere.

### Pattern: floating back button (`BackButton`) — scrim, not surface

Pushed screens (`products/[id]`, `agencies/[id]`) float a back affordance over whatever content occupies
the top of the screen. Never style it as a themed surface: a `surface` pill over a `surfaceElevated`
image is 1.2:1, and a hardcoded light pill leaves a white blob in dark mode with a near-white glyph on
it (the two screens had drifted to opposite bugs). Use **`BackButton`** from
`src/components/back-button.tsx`, which paints `theme.overlay` under `theme.overlayForeground` - a
scheme-independent scrim, legible over a photo in either scheme - and positions itself from
`useTopInset().contentTopInset` so it clears the ad banner. Callers pass only `onPress`.

### Pattern: logo and product-image plates

Agency logos and product photos are authored against light backgrounds, so rendering them straight on
`surface` makes them disappear - dark/transparent artwork on the dark surface, light artwork on the
light one. Every such asset therefore sits on a **fixed light plate** (`theme.logoPlate`, white in both
schemes) with `overflow: 'hidden'`, and any placeholder glyph or caption on that plate uses
`theme.logoPlateForeground` (not `textMuted`, which is near-white in dark mode and vanishes on a white
plate). Applies to `agency-row.tsx`, both detail screens, and `product-card.tsx`. The plate is also
what the product grid/tile reserves behind an image, which is why the image container is `logoPlate`
rather than `surfaceElevated`.

### Pattern: Freshness indicator (last-updated warnings)

Products expose an `updatedAt` ISO string. The longer a product goes without an update, the more cautious a customer should be about trusting it. The freshness system turns that staleness into a visible, color-coded signal across the product list and the detail screen.

**Source of truth** lives in `src/utils/freshness.ts`:

| Export | Purpose |
|---|---|
| `FreshnessTier` | `'fresh' \| 'aging' \| 'stale' \| 'outdated'` |
| `FRESHNESS_THRESHOLDS` | Tunable day counts (`fresh: 14`, `aging: 60`, `stale: 120`) |
| `getDaysSince(updatedAt, now?)` | Integer days between `updatedAt` and now |
| `getFreshnessTier(updatedAt, now?)` | Tier classification |

**Tiers and visual mapping:**

| Tier | Days since `updatedAt` | Color (theme) | Icon (SF / Web) | Where it appears |
|---|---|---|---|---|
| `fresh` | ≤ 14 | `success` | `checkmark.seal.fill` / `verified` | Detail screen "Last updated" row only |
| `aging` | 15–60 | `warning` | `clock` / `schedule` | Card overlay + detail row |
| `stale` | 61–120 | `warning` | `exclamationmark.triangle.fill` / `warning` | Card overlay + detail row + alert banner at top of info card |
| `outdated` | > 120 | `error` | `exclamationmark.octagon.fill` / `report` | Card overlay + red-tinted card border + detail row + red alert banner |

**Components** in `src/components/`:

- `FreshnessIndicator` (compact) — small circular glyph, top-right overlay on the `ProductCard` image. Returns `null` when tier is `fresh`.
- `FreshnessIndicatorDetailed` — an understated status line (a small tier-colored dot plus plain caption text), used in the detail screen's "Last updated" row. It is deliberately **not** a pill or badge - see "Visual language — avoid AI-default UI". Always renders (even when `fresh`).
- `FreshnessAlert` — banner rendered at the top of the product detail's info card. Returns `null` unless tier is `stale` or `outdated`. Uses `theme.warning` / `theme.error` tinted backgrounds.

**Card treatment:** The `ProductCard` wraps the image in a `View` with `position: 'relative'`, places the compact indicator absolutely at `top: Spacing.two, right: Spacing.two`, and for the `outdated` tier applies a 1.5px border in `theme.error`.

**i18n:** All labels and copy live under `common.freshness.*`:

- `lastUpdated` — label for the detail screen row
- `lastUpdatedDaysAgo` — interpolation `{{days}}` used by the detailed indicator for 2+ days
- `updatedToday` / `lastUpdatedOneDayAgo` — singular copy so the line never reads "0 days ago"
- `fresh` / `aging` / `stale` / `outdated` — short tier labels
- `staleAlertTitle` / `staleAlertBody` — banner copy (title interpolates `{{days}}`)
- `outdatedAlertTitle` / `outdatedAlertBody` — banner copy (title interpolates `{{days}}`)

**When to add a new tier:** Update both `FRESHNESS_THRESHOLDS` and the `tierColor` / `tierIcon` / `tierTranslationKey` maps in the relevant components in lockstep. Then add the matching translation keys to `en` and `es`.

### Pattern: alerts come from the agencies, not from our database

The Alerts tab shows **only what a certifying agency published**, on that agency's own channel.
There is no client-side derivation any more.

It used to derive the feed: revoked/expired/expiring certificates, outdated products, new products
— all computed in the app from the catalog it happened to have loaded. That was an inference dressed
up as an announcement. Nobody had published any of it, so nobody could be held to it, and routine
catalog bookkeeping (a product whose `updatedAt` had aged past a threshold) fired as loudly as a real
recall. **Do not reintroduce a client-derived alert.** If a signal is worth alerting on, it belongs
in a channel an agency controls, or as a hand-written row on the server.

**Where alerts come from:** the worker scrapes each agency's configured alert origin
(`AlertsScrapingService` + one adapter per agency, mirroring the product-scraping registry) and
upserts them into the `alerts` table. Operators can also hand-write a row via `server/postman/` for
an announcement that has no upstream origin.

**Only the agencies the user follows.** `alerts.agencyId` is the *publishing* agency (entirely
separate from `targetAgencyId`, which is a navigation destination). `AlertsScreen` reads
`favoriteAgencies` from `useSavedItems()` and passes it to `useAlertsQuery(agencyIds)`, which sends
one repeated `agencyId` query param per agency. An alert from a supervisor whose hechsher this user
does not rely on is noise, and burying a real recall under it is the failure mode that matters.

**An empty follow list does not hit the network.** `useAlertsQuery` is `enabled: agencyIds.length > 0`
because an absent `agencyId` filter means "every agency" to the api — the exact opposite of what a
user who follows nobody asked for. The screen shows a follow-an-agency prompt instead
(`alerts.noAgenciesFollowedTitle` / `…Message`), which is a third state distinct from loading and
from an empty feed.

**Wiring:** `src/services/alerts.ts` (`getAlerts`, `buildAlertsQuery`) fetches, validated by
`alertSchema` / `AgencyAlert` in `src/services/schemas.ts`. `src/utils/alerts.ts` turns each
`AgencyAlert` into a `FeedAlert` (`toFeedAlert`) and orders the feed (`sortAlerts`), with
`buildAlerts(alerts)` doing both. The query key includes the sorted follow list, so following one
more agency is a different query rather than a stale version of the same one.

**Never run alert copy through `t()`.** Title and description are the publishing agency's own words,
not this app's translated strings. Translating a kashrut notice would mean rewording a claim we did
not make — and a string containing `{{`/`}}`-shaped text would break interpolation. Only the empty
states and the screen title are translated.

**Ordering is severity, then `priority`, then recency**, and `priority` sits *below* severity on
purpose: it lets an agency rank its own announcements against each other, never push a promotion
above a recall. The recency key is `publishedAt ?? createdAt` — those differ, because an agency's
notice only enters our database the first time its origin is scraped, and using row age would dump
a whole back catalog at the top of the feed as if it had all just happened.

**Target navigation:** `resolveAlertTarget` maps the server's
`targetType`/`targetProductId`/`targetAgencyId`/`targetUrl` into `{ type: 'product' | 'agency' |
'url' | 'none' }`, checking a `url` through `isSafeExternalUrl()` and collapsing to `none` when it
fails — same rule as every other server-supplied URL in this app. `AlertsScreen.handleAlertPress`
opens a `url` target the way `ExternalLink` does (`openBrowserAsync` on native, a normal navigation
on web). A row whose target is `none` is not pressable and renders no chevron.

**Rows can legitimately have no description.** Several origins publish a heading and an image and no
prose at all (Kosher Panama's notices are photographed shelf labels). `AlertRow` falls back to the
publishing agency's name for the secondary line and hides it entirely when there is nothing to show;
the image renders in place of the severity icon, already resolved through `resolveMediaUrl()`.

**Not re-filtered client-side:** the server's `AlertsService.findVisible()` already scopes the
response to `active` rows inside their `startsAt`/`expiresAt` window, so `buildAlerts` does not
repeat that check — every row it receives is meant to be shown right now.

### Pattern: agencies directory grouped by country

`src/app/agencies/index.tsx` renders a `SectionList`, one section per country, built by the pure
helper `groupAgenciesByCountry(agencies, getCountryLabel)` in `@/utils/agencies`.

- **Order is locale-aware.** Sections sort by the *translated* country name, never by the ISO code
  — "Estados Unidos" belongs under E in Spanish even though its code is `us`. The screen passes
  `code => t(getCountryTranslationKey(code), code.toUpperCase())` as the label resolver; the helper
  itself never touches i18n, which keeps it pure and testable.
- **Agencies sort by name inside each section**, and rows with no country collapse into one
  trailing bucket labelled `agencies.unknownCountry`.
- **Grouping needs the whole directory.** A country's agencies can land on any page, so the screen
  auto-advances the infinite query up to `MAX_AUTO_PAGES` (10 × 50 rows) before falling back to
  scroll-driven paging. Any future grouped-and-sorted list over a paginated endpoint must do the
  same — grouping only the first page silently reorders itself as the user scrolls.

### Pattern: `ExternalLink` with `asChild`

`Link asChild` renders through expo-router's `Slot`, which forwards props through radix's
`mergeProps`. That helper merges `style` with `{ ...slotStyle, ...childStyle }`, so **anything that
is not a plain object is silently dropped**: an array style (`[styles.card, { borderColor }]`, the
house pattern) is spread into `{}` and additionally **throws in development**
(`expo-router/build/ui/Slot.js` checks for it), and a **function** style
(`({ pressed }) => [...]`) is spread into `{}` too — which is what made the About screen's
"Development Services" card collapse to a column instead of laying out as a row.

`ExternalLink` therefore resolves both shapes on its child before handing it to `Link`:
`StyleSheet.flatten` for an array, and for a function, evaluation against a pressed state it tracks
through the child's own `onPressIn`/`onPressOut`. Call sites need no special handling. If another
`asChild` wrapper around `Link` is ever added, it must repeat this resolution.

### Pattern: ads (AdMob banner anchored at the top)

The app shows a single AdMob banner **at the very top of the window, above every screen**, visible on every tab **except `/scan`** (the camera UI owns the full screen there).

**It is laid out in flow, not floated.** The banner is a sibling *above* the tab navigator, so the screen below is pushed down by it and no app UI ever sits over it. That is a policy requirement, not a preference: an obscured ad is an AdMob violation. It also means a screen must not pad for the notch when the banner is up - the banner already absorbed the status-bar inset.

**Architecture:**

- `src/components/ad-banner.tsx` — native implementation. Renders a `BannerAd` (`react-native-google-mobile-ads`) at `BannerAdSize.INLINE_ADAPTIVE_BANNER`, full device width, capped with `maxHeight={MAX_BANNER_HEIGHT}` (60). It absorbs `insets.top` as its own padding, measures its total height with `onLayout`, and reports it upwards.

  **Why this size:** "full width but no taller than N" has exactly one supported expression - inline adaptive plus `maxHeight`. The *anchored* adaptive sizes derive their height from the screen height (~90dp on a tall phone) and ignore `maxHeight`; a hand-written `<width>x50` custom size has far thinner inventory and no-fills. When the auction has nothing that fits the slot it falls back to a 320x50 creative centred in the bar - narrower than asked, never taller.

  **Dev builds use `TestIds.ADAPTIVE_BANNER`, not `TestIds.BANNER`.** The latter always serves a 320x50 test creative whatever size was requested, which makes a full-width slot look broken in development and sends you chasing a layout bug that does not exist.
- `src/components/ad-banner.web.tsx` — web stub exporting a `null` component and `isAdBannerAvailable = false`. `react-native-google-mobile-ads` is native-only; the platform extension keeps it out of the web bundle.
- `src/components/app-tabs.tsx` — hosts the banner as the first child of its root view, skipped when `useSegments()[0] === 'scan'` or when `isAdBannerAvailable` is false. It publishes the resolved top geometry through `TopInsetProvider`, and also hosts `OfflineBanner` so that overlay floats *below* the ad rather than over it.
- `src/hooks/use-top-inset.tsx` — `useTopInset()` returns `{ contentTopInset, contentTop }`.
  **Every screen pads its container with `contentTopInset`, never with `insets.top`.** It is `0`
  while the banner is up and `insets.top` when it is not, so a screen works identically with ads on,
  off, or hidden. `contentTop` is the absolute y where content begins, for chrome that floats over a
  screen. Outside the tab shell (tests) the hook falls back to the plain safe-area inset.
- `Layout.adBannerHeight` (`src/constants/theme.ts`) — 50 on iOS/Android, 0 on web: the slot's
  *minimum*, and what is reserved until the bar's first `onLayout`. `Layout.tabBarHeight` is what
  screens reserve at the bottom - it no longer includes any ad height.

**Refresh cadence.** Impressions are the revenue, but over-refreshing is what gets an account suspended, so the cadence has exactly one owner at a time:

- `ADMOB_BANNER_REFRESH_SECONDS=0` (default) — AdMob's own per-ad-unit auto-refresh owns it. Nothing in the app requests a second ad.
- Any other value — in-app refresh: the banner remounts (a new `key`, the only reload path that works across SDK versions) **on a route change**, never more often than the configured interval, never while `AppState` is not `active`. Values below 30s are clamped up to AdMob's 30s floor.

Enabling both stacks them and roughly doubles the effective rate — turn the ad unit's automatic refresh off in the console before setting a non-zero value here. A *failed* load produces no impression, so it is retried after 30s regardless of the setting, while the slot keeps its reserved height (a failed fill must not shift the whole app).

**Configuration (`.env` → `app.config.ts` → `Config`):**

- Plugin: `["react-native-google-mobile-ads", { "androidAppId": "...", "iosAppId": "..." }]`, added only when `ADS_ENABLED=true` **and** both app ids are set. **The plugin props are camelCase** — the snake_case keys from older docs are silently ignored and the build warns "No 'androidAppId' was provided".
- `ADMOB_BANNER_UNIT_ID_IOS` / `ADMOB_BANNER_UNIT_ID_ANDROID` — release banner unit ids. Empty → no banner and no reserved slot in release builds. **`__DEV__` always uses `TestIds.BANNER`** regardless of config.
- `expo-tracking-transparency` sets `NSUserTrackingUsageDescription`; the banner requests ATT on mount and passes `requestNonPersonalizedAdsOnly` when consent is denied.

**Hard requirement — dev builds only:** AdMob is native code. After `expo prebuild` the app no longer runs in **Expo Go**. Use `pnpm ios` / `pnpm android` (`expo run:*`) or an EAS development build. The web target is unaffected (stub).

**Changing the banner size** is a one-line change in `ad-banner.tsx`: the height is measured, never assumed, so nothing else in the layout has to follow (keep `Layout.adBannerHeight` roughly in step to avoid a first-frame jump).

---

## Performance

### React Compiler is ON

`experiments.reactCompiler: true` is enabled in `app.json`. The compiler automatically applies memoization at build time. **Do not** manually wrap components in `React.memo`, `useMemo`, or `useCallback` unless profiling with React DevTools proves it is necessary. Manual memoization can conflict with the compiler's optimizations.

### List performance

- Use `FlatList` (not `ScrollView`) for any list longer than ~20 items.
- For very large lists (500+ items) or complex item layouts, consider `@shopify/flash-list` (first install it with `npx expo install @shopify/flash-list`).
- Always provide `keyExtractor` to `FlatList`.
- Use `getItemLayout` when items have a fixed height for O(1) scrolling.

### Image optimization

- **Remote images:** use `expo-image` (`Image` from `expo-image`) instead of React Native's `Image`. It provides caching, blurhash placeholders, and progressive loading.
- **Local/static images:** use `require()` with React Native's `Image` or `expo-image`.
- For icons, prefer `@expo/ui`'s `Icon` component (with `md` and `sf` props for Material Design / SF Symbols) or `expo-symbols` over image-based icons.

### Route lazy loading

When the route count grows, enable `asyncRoutes` in `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["expo-router", { "asyncRoutes": { "production": true, "default": false } }]
    ]
  }
}
```

This splits each route into its own bundle, reducing initial load time.

---

## Telemetry (analytics + error monitoring)

Two backends, one facade. **Never import `@sentry/react-native` or `posthog-react-native` from a
screen, component or hook** — everything goes through `@/services/telemetry`. That keeps the
vendors swappable, enforces consent in one place, and guarantees a telemetry failure can never
break a user's session (every entry point swallows its own errors).

| Channel | Backend | Consent required | Answers |
|---|---|---|---|
| Analytics | PostHog | **Yes** — gated on the ATT prompt | "What do users do?" |
| Errors | Sentry | No | "What is broken?" |

Sentry runs without the tracking prompt on purpose: crash reporting is not behavioural
advertising, it sets no user identity, and `beforeSend` strips query strings and any inferred
user object before an event leaves the device. PostHog is created with `defaultOptIn: false` and
only starts capturing once consent is granted.

Both are inert when unconfigured (`SENTRY_DSN` / `POSTHOG_API_KEY` empty), so the app runs
normally with no accounts set up. Sentry is additionally disabled under `__DEV__`.

### The API

```tsx
import { track, captureError, trackScreen } from '@/services/telemetry';

track('product_viewed', { product_id: 42, kashrut_level: 'pareve', /* ... */ });
captureError(error, { screen: 'products', action: 'load_products' });
```

- **`track(name, properties)`** — a product-analytics event. Also recorded as a Sentry breadcrumb,
  so a crash report shows the actions leading up to it with no second instrumentation pass.
- **`captureError(error, context)`** — an *unexpected* error. For handled, expected failures (a
  404, a cancelled request) use a `track` event instead; Sentry is for things that should not happen.
- **`trackScreen(path)`** — do not call this manually. `useScreenTracking` in the root layout
  covers every route automatically, so a new screen needs no instrumentation.

### Adding an event

Events are a **typed catalog**, not free-form strings. Add a variant to the `AnalyticsEvent`
discriminated union in `src/services/telemetry/events.ts`; the compiler then enforces the payload
at every call site. This is what stops a catalog from rotting into `product_view` /
`productViewed` / `view_product` six months in.

Rules for a new event:

- `name` is snake_case, past tense, `object_verb`.
- Properties are **scalars only** (`TelemetryPropertyValue`). Flatten instead of nesting:
  `countries_count: 3`, never `countries: [...]`.
- Absent values are `undefined`, never `''` — the PostHog adapter drops undefined keys so they
  report as "not set" rather than creating a bogus empty bucket in every breakdown.
- **No PII and no free text the user typed.** Search terms are recorded as
  `query_length` + `results_count`, never as content. Barcodes are the one exception and are
  deliberate: a product barcode is a public identifier, and `barcode_not_found` is the app's
  most valuable signal — a ranked backlog of products real shoppers wanted and the catalog
  did not have.
- Any value that could be an id in a path must go through `toRouteTemplate` before it reaches an
  event, so `/products/1423` is reported as `/products/:id`. High-cardinality properties make a
  dashboard unusable and leak browsing history into event names.

### Where telemetry is already wired

`api.ts` emits `api_error` for every failed request (route template only, never the query
string), and `AppErrorBoundary` reports render crashes with the React component stack. Neither
needs touching when you add a screen.

---

## Security

### Never hardcode secrets

- API keys, tokens, secrets, and endpoint URLs **must never** be hardcoded in source code.
- Use environment configuration (`app.json` extras or `.env` files via `expo-constants`).
- Commit `.env.example` with placeholder values; add `.env` to `.gitignore`.

### Credential storage

- Use **`expo-secure-store`** for tokens, passwords, and any sensitive data.
- Install: `npx expo install expo-secure-store`
- **Never** store credentials in `AsyncStorage` (it's unencrypted on Android).
- **Validate anything read back out of `AsyncStorage`.** Persisted data outlives the code that
  wrote it: an older app version, a partial write or a hand-edited store can all produce entries
  that no longer match the current shape. Narrow with a type guard and drop what does not
  validate — see `isShoppingListItem` in `use-saved-items.tsx`. Casting straight into state
  crashes at render.

### Networking

- All API calls must use **HTTPS** in production. `API_URL` comes from the environment
  (`app.config.ts` -> `Config.apiUrl`); it must never be hardcoded and must never be plain `http`
  in a build that leaves your machine — iOS ATS and the Android cleartext policy block it.
- Validate all user input before sending to the backend.
- **Treat every server-supplied URL as untrusted.** Media paths and external links go through
  `resolveMediaUrl()` / `isSafeExternalUrl()` in `@/services/api`, which reject anything that is
  not `http:`/`https:`. A `javascript:` or custom-scheme value stored in the database must never
  reach an `<Image>` source or a browser.
- Every request carries a timeout (15s default) and accepts an `AbortSignal`. A screen that
  fetches must abort on unmount, and a search must abort the superseded request — otherwise a
  slow older response can overwrite newer results.
- Sanitize data before rendering (guard against XSS on web).

### App integrity

- Do not disable SSL verification or certificate pinning for production builds.
- When using `expo-web-browser` for OAuth or payments, validate redirect URLs.

---

## Adding a Feature — Step-by-Step Playbooks

### Adding a new screen

1. Create the route file in `src/app/<name>/index.tsx` (or a flat file `src/app/<name>.tsx` for simple screens).
2. For a screen with a dynamic parameter, use `src/app/<name>/[id].tsx`.
3. If the screen needs URL params, use `useLocalSearchParams<{ id: string }>()`.
4. If it's a new tab, add a `TabTrigger` in `src/components/app-tabs.tsx`.
5. For a pushed screen (not a tab), add a `<Stack.Screen name="...">` in the parent layout.
6. Navigate with `<Link href="/name">` or `router.push('/name')`.

### Adding a new UI component

1. Determine placement:
   - Generic/design-system component → `src/components/ui/<name>.tsx`
   - Feature-specific component → `src/components/<name>.tsx`
2. Export the component with a named export.
3. Export its props interface.
4. Use `ThemedView`/`ThemedText` for theme-aware colors.
5. All styles via `StyleSheet.create` at the bottom of the file.
6. Use `Spacing` constants instead of hardcoded numbers.

### Adding a new API endpoint

1. Create or update a service file in `src/services/<domain>.ts`.
2. Export a typed function (params typed, return type explicit).
3. Handle errors: return `null` for expected 404s, throw for unexpected errors.
4. Consume the function in a screen with full loading/error/empty state handling.

### Adding a new theme color

1. Add the key-value pair to **both** `Colors.light` and `Colors.dark` in `src/constants/theme.ts`.
2. The `ThemeColor` union type updates automatically.
3. Use the new key in `ThemedText`/`ThemedView`'s `themeColor`/`type` prop.

### Adding a new platform variant

1. Create `<name>.web.tsx` (and optionally `.ios.tsx`, `.android.tsx`) alongside the base `<name>.tsx`.
2. Export the same symbols — Expo Router resolves the correct file per platform.
3. Keep platform differences minimal. Prefer `@expo/ui` universal components that adapt automatically.

---

## AI Authorization & Safety Rules

### Commits require explicit user authorization

**Never** create commits, amend commits, force-push, or perform any Git write operation (`git commit`, `git push`, `git tag`, `git merge`, `git rebase`) without the user explicitly requesting it. When the user asks to commit, review `git status` and `git diff` first, stage only the intended files, and write a concise English commit message matching the existing repo style.

### Destructive or high-impact operations require confirmation

Before running any of the following, **ask the user for confirmation** and explain what the command does:

- `npx expo prebuild --clean` — wipes and regenerates native `ios/` and `android/` directories
- `npx expo-doctor` with `--fix-dependencies` — can change package versions
- `rm -rf` or any deletion of directories beyond temporary files
- `pnpm install` with version changes — may update lockfile across the monorepo
- `npx expo upgrade` — upgrades Expo SDK version (major impact)
- Any command that modifies files outside `app/` (touching `api/`, `worker/`, `shared/`, `docker-compose.yml`)
- Any command that changes `app.json` plugins, `tsconfig.json`, or `package.json` scripts in a non-trivial way
- Any `curl` or network request that writes data (POST, PUT, DELETE) to a server
- Any `docker` command that affects running containers

If the user explicitly requested the command, you may proceed without re-confirming.

### Routine operations (no confirmation needed)

These are safe to run without asking:

- `npx expo lint` — linting
- `pnpm typecheck` or `npx tsc --noEmit` — type checking
- `npx expo start` — start dev server
- `pnpm install` (additive, no version changes) — adding a new dependency
- `git status`, `git diff`, `git log` — read-only Git operations
- Reading files, searching code, exploring the directory tree

---

## AI Maintenance Rules

The AI assistant is expected to keep the project metadata in sync **automatically**, in the same turn it makes a change. Treat the following as mandatory:

### 0. `FILE_STRUCTURE.md` (root) — **MASTER CATALOG**

**THE MOST IMPORTANT RULE:** Whenever a file or folder is created, renamed, or deleted ANYWHERE in the project (app/, server/, assets/), update `/final_code/FILE_STRUCTURE.md` in the same turn. This is the primary catalog the AI uses to locate files across the entire monorepo. Leaving it stale is a bug. **All entries and descriptions must be written in English.**

### 1. `AGENTS.md` (this file)

Update if the change affects:
- Architecture, invariants, or rules
- Navigation patterns or route structure
- Design system tokens or theme conventions
- Component patterns or naming conventions
- Tech stack versions or new dependencies
- Security rules or environment configuration
- Any convention documented here

**Add new conventions proactively.** If you notice a pattern emerging that isn't documented (e.g., a new kind of component, a new service pattern, a new platform convention), add it to the relevant section. This file is the single source of truth for "how this app works."

### 2. `README.md`

Update if:
- New dev scripts are added to `package.json`
- New prerequisites or setup steps are introduced
- New environment variables are required
- A new service, tool, or workflow is introduced
- The project structure changes significantly

### 3. `package.json`

- When adding tooling (linters, test runners, CI scripts), add the corresponding script.
- When adding a new dependency, document its purpose in a comment or in this AGENTS.md.

### 4. File structure alignment

When creating new directories under `src/`, ensure:
- The directory follows existing naming conventions (`components/`, `hooks/`, `services/`, `constants/`)
- The directory purpose is clear from its name
- An `index.ts` barrel export is added if the directory contains multiple files that are imported together

### 5. `tsconfig.json` paths

If a new top-level source directory is created (e.g., `src/utils/`, `src/stores/`), add a corresponding path alias.

### 6. Cross-repo awareness

This app lives in the `final_code/` monorepo. Changes to the app must not break `api/`, `worker/`, or `shared/`. If the app adds a new API endpoint requirement, the corresponding backend service files (`api/src/*`) must be created or updated. If a data type is shared between app and backend, it should be defined in `shared/` and imported by both.

---

## Testing

`pnpm test` runs Jest (`jest-expo` preset). `pnpm typecheck` and `pnpm lint` must both pass clean
before any change is considered done.

### What is covered

| Area | File |
|---|---|
| Agencies directory grouping/ordering | `src/utils/agencies.test.ts` |
| Freshness tiers, clock skew, corrupt dates | `src/utils/freshness.test.ts` |
| Alert feed mapping, target safety, severity/priority/recency ordering | `src/utils/alerts.test.ts` |
| Query-string contract with the API DTOs | `src/services/products.test.ts` |
| Response validation + anti-corruption renaming | `src/services/schemas.test.ts` |
| URL scheme guards | `src/services/api.test.ts` |
| Route-template cardinality guard | `src/services/telemetry/events.test.ts` |
| Cross-platform icon-name resolution (SF -> Material) | `src/constants/icons.test.ts` |
| Palette contrast ratios (AA) and light/dark key parity | `src/constants/theme.test.ts` |
| Persisted shopping list validation | `src/hooks/use-saved-items.test.tsx` |
| Root error boundary catch/report/retry | `src/components/app-error-boundary.test.tsx` |
| `ExternalLink` child style resolution through `Link asChild` | `src/components/external-link.test.tsx` |

The server side has its own suite: `pnpm test` from `server/`.

### Conventions

- Test files sit next to their target: `foo.test.ts` beside `foo.ts`.
- Priority is **pure logic and boundaries** - anything that decides what a shopper is told, and
  anything that parses untrusted input. Rendering assertions come second.
- `jest.setup.ts` stubs telemetry, `expo-constants`, AsyncStorage and NetInfo, so no test can reach
  the network or a real analytics account.
- **`renderHook` and `render` are async in RNTL 14** (React 19 concurrent rendering) - they must be
  awaited, and state updates wrapped in `await act(async () => ...)`.
- **pnpm caveat:** `transformIgnorePatterns` in `package.json` matches the
  `node_modules/.pnpm/<name>@<version>/` layout by prefix. The stock jest-expo pattern assumes a
  flat `node_modules` and silently leaves every React Native package untransformed.

---

### 7. Endpoints belong in the Postman collection

If a change adds, removes, or reshapes an HTTP endpoint on the backend, `server/postman/kosher-pass.postman_collection.json` must be updated in the same turn — new route, removed route, new or renamed query param, changed body, different status code. That collection is the only client for the api's unauthenticated write endpoints (there is no admin UI), so a route missing from it is a route nobody can reach. The full rule lives in `server/AGENTS.md` → "AI maintenance rules".

### 8. Cross-boundary API changes

When a task modifies anything that affects the contract between the app (mobile client) and the server (api/worker) — such as request parameters, response shapes, new or removed endpoints, DTO changes, query params, error codes, or shared type definitions — the AI **must**, after completing the task, produce a **ready-to-paste prompt** that the user can pass to a separate session working on the other side. The prompt must:
- Clearly state which side was changed (server or app).
- List every endpoint affected (method + path).
- Show the old vs. new request/response shapes (TypeScript types or JSON examples).
- Specify what the other side needs to update (service files, types, components, etc.).
- Be self-contained — the receiving session should be able to act on it without additional context.

---

## Quick Reference: Expo v57 Docs

The AI must fetch the versioned docs, not guess:

| Topic | URL |
|---|---|
| Full SDK reference | `https://docs.expo.dev/versions/v57.0.0/` |
| Expo Router | `https://docs.expo.dev/versions/v57.0.0/sdk/router.md` |
| Native Tabs | `https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs.md` |
| Stack Navigator | `https://docs.expo.dev/versions/v57.0.0/sdk/router/stack.md` |
| Expo UI (Universal) | `https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal.md` |
| Expo UI (SwiftUI) | `https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui.md` |
| Expo UI (Jetpack Compose) | `https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose.md` |
| expo-image | `https://docs.expo.dev/versions/v57.0.0/sdk/image.md` |
| expo-secure-store | `https://docs.expo.dev/versions/v57.0.0/sdk/securestore.md` |
| expo-constants | `https://docs.expo.dev/versions/v57.0.0/sdk/constants.md` |
| expo-web-browser | `https://docs.expo.dev/versions/v57.0.0/sdk/webbrowser.md` |
| Reanimated | `https://docs.expo.dev/versions/v57.0.0/sdk/reanimated.md` |
| expo-splash-screen | `https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen.md` |
| expo-linking | `https://docs.expo.dev/versions/v57.0.0/sdk/linking.md` |
| Using TypeScript | `https://docs.expo.dev/guides/typescript/` |
| Using ESLint | `https://docs.expo.dev/guides/using-eslint/` |
| Unit Testing | `https://docs.expo.dev/develop/unit-testing/` |
| Static Rendering (Web) | `https://docs.expo.dev/router/web/static-rendering/` |
| Full docs index (llms.txt) | `https://docs.expo.dev/llms.txt` |

---

## Conventions Summary

- `pnpm` is the package manager — never use `npm` or `yarn`.
- Named exports for components (except route files and platform-switched files).
- `StyleSheet.create` — no inline styles.
- TypeScript `strict: true` — no `any`.
- Path aliases `@/` for cross-directory imports.
- `@expo/ui` universal components preferred over raw RN primitives for interactive controls.
- Icons go through `Icon` from `@/components/ui/icon` — never `expo-symbols`' `SymbolView` directly; new glyphs get a Material entry in `src/constants/icons.ts` in the same change.
- English only — code, comments, logs, commits.
- No comments except JSDoc on exported public APIs — never narrate code inline.
- Loading, error, empty states required on every data-fetching screen.
- No secrets in source code — use env config + `expo-secure-store`.
- Config is read through `Config` in `@/constants/config`, never `Constants.expoConfig.extra` directly.
- Telemetry goes through `@/services/telemetry` — never import a vendor SDK in a screen.
- Server state goes through the hooks in `@/hooks/use-queries` — never hand-roll fetch state in a screen.
- Every API response is validated by a zod schema; types are inferred from the schemas, never hand-written.
- Screens read `product.agency` / `.certificate` / `.country`, never the wire names `agencyId` / `certificateId` / `countryId`.
- Screens pad their top with `useTopInset().contentTopInset`, never with `insets.top` directly.
- Every interactive element carries `accessibilityRole` and a label; toggles also carry `accessibilityState`.
- Every service function accepts an optional `ApiRequestOptions`; fetching screens abort on unmount.
- Server-supplied URLs pass through `resolveMediaUrl` / `isSafeExternalUrl` before use.
- React Compiler handles memoization — avoid manual `useMemo`/`useCallback`.
- All API calls go through `src/services/`.
- Platform variants use file extensions (`.web.tsx`, `.ios.tsx`, `.android.tsx`).
- Never commit without user authorization.
- Destructive operations require user confirmation.
