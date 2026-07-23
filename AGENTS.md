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
├── app.json                        # Expo config (name, plugins, experiments)
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
    │   ├── _layout.tsx             # Root layout — ThemeProvider + SavedItemsProvider + AppTabs
    │   ├── index.tsx               # Discover / Home screen (route: /)
    │   ├── alerts.tsx              # Full alerts list (route: /alerts)
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
    │   │   └── collapsible.tsx     # Animated accordion with chevron
    │   ├── app-tabs.tsx            # Custom bottom tab bar with elevated Scan button; hosts the AdBanner
    │   ├── ad-banner.tsx           # Anchored AdMob banner (native); hidden on /scan
    │   ├── ad-banner.web.tsx       # Web stub for AdBanner (renders nothing)
    │   ├── external-link.tsx       # Link that opens in in-app browser on native
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
    │   └── theme.ts                # Design tokens: Colors, Fonts, Spacing, Radius, Shadows
    ├── utils/                      # Pure helpers (no React, no I/O)
    │   ├── countries.ts            # Country/continent grouping helpers
    │   └── freshness.ts            # Freshness tier computation from updatedAt
├── hooks/
│   ├── use-color-scheme.ts     # Native: re-exports RN's useColorScheme
│   ├── use-color-scheme.web.ts # Web: hydration-safe color scheme hook
│   ├── use-theme.ts            # Returns Colors object for current scheme
│   ├── use-debounce.ts         # Debounced value hook
│   └── use-saved-items.tsx     # Favorites + shopping list context
├── i18n/                       # Internationalization
│   ├── index.ts                # i18next initialization + config
│   ├── use-locale.ts           # Locale hook with AsyncStorage persistence
│   └── resources/
│       ├── en/translation.json # English strings
│       └── es/translation.json # Spanish strings
├── services/                   # API calls
    │   ├── api.ts                  # Base fetch client + API_BASE_URL
    │   ├── products.ts             # Product endpoints
    │   ├── agencies.ts             # Agency endpoints
    │   └── certificates.ts         # Certificate endpoints
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

### Expo Config (`app.json`)

```json
{
  "expo": {
    "scheme": "kosherpass",
    "userInterfaceStyle": "automatic",
    "plugins": ["expo-router", ["expo-splash-screen", { "backgroundColor": "#208AEF", "imageWidth": 76 }]],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "web": { "output": "static" }
  }
}
```

- `typedRoutes: true` enables type-safe `<Link href="...">` and `router.push(...)`. Always use typed routes.
- `reactCompiler: true` enables the React Compiler for automatic memoization. Avoid manual `useMemo`/`useCallback` — the compiler handles optimization.
- `userInterfaceStyle: "automatic"` means the app follows the device light/dark setting.
- Web output is `"static"` (SPA). If switching to SSR (`"server"`), update the router configuration accordingly.
- When adding Expo plugins (camera, notifications, maps, etc.), add them to the `plugins` array.

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
| `BottomTabInset` | Bottom padding screens must reserve (tab bar height + `AdBannerHeight` on native) |
| `AdBannerHeight` | Height reserved for the anchored AdMob banner (50 native, 0 web) |
| `MaxContentWidth` | Max width for content (800px) |

### Colors

```ts
export const Colors = {
  light: {
    background: '#FAF9F6',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceContrast: '#1E2D3D',
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
    warning: '#B46A18',
    error: '#B91C1C',
    dairy: '#4A7CB5',
    meat: '#B55A4A',
    pareve: '#2D6A4F',
    chalavYisrael: '#5B4AB5',
    unknown: '#9CA3AF',
  },
  dark: { /* mirrored keys with dark values */ },
} as const;
```

- Every color key **must exist in both** `light` and `dark`.
- `as const` ensures the values are read-only and enables `ThemeColor` type inference.
- Use `ThemeColor` as the prop type when a component accepts a color key from the theme.

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
- Renders `AppTabs` (custom tab navigator): Discover (`/`), Products (`/products`), Scan (`/scan`), My List (`/my-list`), Agencies (`/agencies`).

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

Tabs:
- **Discover** (`/`) — Home feed with alerts, featured products, and categories
- **Products** (`/products`) — Browse, search, and filter all products
- **Scan** (`/scan`) — Barcode scanner (elevated, gold accent)
- **My List** (`/my-list`) — Shopping list + favorite agencies
- **Agencies** (`/agencies`) — Certifying agencies directory

---

## State Management & Data Fetching

### Philosophy

- **React hooks + Context first.** No Redux, Zustand, or other state libraries unless the app's scale demonstrably justifies them.
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

export async function getProducts(search?: string): Promise<Product[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiGet<Product[]>(`/products${params}`);
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    return await apiGet<Product>(`/products/${id}`);
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null;
    throw error;
  }
}
```

### Loading, error, and empty states

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
// src/services/api.ts
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000';

export const apiClient = {
  get: async (path: string) => fetch(`${API_BASE_URL}${path}`).then(r => r.json()),
  // ... post, put, delete
};
```

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
- `FreshnessIndicatorDetailed` — inline pill with icon + "Updated N days ago" label, used in the detail screen's "Last updated" row. Always renders (even when `fresh`).
- `FreshnessAlert` — banner rendered at the top of the product detail's info card. Returns `null` unless tier is `stale` or `outdated`. Uses `theme.warning` / `theme.error` tinted backgrounds.

**Card treatment:** The `ProductCard` wraps the image in a `View` with `position: 'relative'`, places the compact indicator absolutely at `top: Spacing.two, right: Spacing.two`, and for the `outdated` tier applies a 1.5px border in `theme.error`.

**i18n:** All labels and copy live under `common.freshness.*`:

- `lastUpdated` — label for the detail screen row
- `lastUpdatedDaysAgo` — interpolation `{{days}}` used by the detailed indicator
- `fresh` / `aging` / `stale` / `outdated` — short tier labels
- `staleAlertTitle` / `staleAlertBody` — banner copy (title interpolates `{{days}}`)
- `outdatedAlertTitle` / `outdatedAlertBody` — banner copy (title interpolates `{{days}}`)

**When to add a new tier:** Update both `FRESHNESS_THRESHOLDS` and the `tierColor` / `tierIcon` / `tierTranslationKey` maps in the relevant components in lockstep. Then add the matching translation keys to `en` and `es`.

### Pattern: ads (AdMob anchored banner)

The app shows a single AdMob banner anchored directly above the bottom tab bar, visible on every tab **except `/scan`** (the camera UI owns the full screen there).

**Architecture:**

- `src/components/ad-banner.tsx` — native implementation. Renders a `BannerAd` (`react-native-google-mobile-ads`) at the fixed 320x50 `BannerAdSize.BANNER`, absolutely positioned above the tab bar. On `onAdFailedToLoad` it renders nothing.
- `src/components/ad-banner.web.tsx` — web stub returning `null`. `react-native-google-mobile-ads` is a native-only module; the platform-extension resolution keeps it out of the web bundle.
- `src/components/app-tabs.tsx` — hosts the banner: `<AdBanner />` rendered as a sibling of `Tabs`, skipped when `useSegments()[0] === 'scan'`.
- `Layout.adBannerHeight` (`src/constants/theme.ts`) — 50 on iOS/Android, 0 on web. `Layout.bottomTabInset` already **includes** it, so every screen that pads `Layout.bottomTabInset + Spacing.six` clears the banner automatically.

**Configuration (`app.json`):**

- Plugin: `["react-native-google-mobile-ads", { "androidAppId": "...", "iosAppId": "..." }]`. **The plugin props are camelCase** (`androidAppId` / `iosAppId`) — the snake_case keys from older docs are silently ignored and the build warns "No 'androidAppId' was provided". Google sample app ids are committed as placeholders; replace them with the real AdMob app ids before release.
- `expo.extra.admobBannerUnitIdIos` / `expo.extra.admobBannerUnitIdAndroid` — release banner unit ids, read via `Constants.expoConfig.extra`. Empty string → banner hidden in release builds. **`__DEV__` always uses `TestIds.BANNER`** regardless of config.
- `expo-tracking-transparency` plugin sets `NSUserTrackingUsageDescription`; the banner requests ATT on mount and passes `requestNonPersonalizedAdsOnly` when consent is denied.

**Hard requirement — dev builds only:** AdMob is native code. After `expo prebuild` the app no longer runs in **Expo Go**. Use `pnpm ios` / `pnpm android` (`expo run:*`) or an EAS development build. The web target is unaffected (stub).

**Why fixed 320x50 instead of `ANCHORED_ADAPTIVE_BANNER`:** adaptive banners have a device-dependent height, which would force every screen's static `StyleSheet` bottom padding through a runtime context. The fixed size keeps the layout deterministic — one constant in `theme.ts`, zero per-screen plumbing. To upgrade later: measure the rendered height via `onLayout`, expose it through a provider, and replace the constant.

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

## Security

### Never hardcode secrets

- API keys, tokens, secrets, and endpoint URLs **must never** be hardcoded in source code.
- Use environment configuration (`app.json` extras or `.env` files via `expo-constants`).
- Commit `.env.example` with placeholder values; add `.env` to `.gitignore`.

### Credential storage

- Use **`expo-secure-store`** for tokens, passwords, and any sensitive data.
- Install: `npx expo install expo-secure-store`
- **Never** store credentials in `AsyncStorage` (it's unencrypted on Android).

### Networking

- All API calls must use **HTTPS** in production.
- Validate all user input before sending to the backend.
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

## Testing (Future)

### Current state

No testing framework is set up yet. The README references [Jest setup guide](https://docs.expo.dev/develop/unit-testing/).

### When testing is added

- Place test files next to their target: `src/components/foo.test.tsx` next to `src/components/foo.tsx`.
- Test coverage goal: critical business logic, API services, navigation guards.
- Component tests: use `@testing-library/react-native`.
- Add `pnpm test` script to `package.json`.

### 7. Cross-boundary API changes

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
- English only — code, comments, logs, commits.
- Loading, error, empty states required on every data-fetching screen.
- No secrets in source code — use env config + `expo-secure-store`.
- React Compiler handles memoization — avoid manual `useMemo`/`useCallback`.
- All API calls go through `src/services/`.
- Platform variants use file extensions (`.web.tsx`, `.ios.tsx`, `.android.tsx`).
- Never commit without user authorization.
- Destructive operations require user confirmation.
