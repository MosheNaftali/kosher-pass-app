# AI Guide — Quick File Locator

> **Purpose:** This file is a fast-lookup index for the AI assistant. Before using `glob`/`grep` to find a file or symbol, **check this guide first**. If you cannot find what you need here, search the codebase, and then **append the new finding to this file** in the appropriate section so future sessions don't repeat the work.
>
> **Self-maintenance rule:** Every time you discover the location of a file, function, type, hook, service, or piece of business logic that is not already documented below, you MUST add it to this file in the same turn. Keep entries terse: `path — purpose` (one line). Group by section.

---

## How to use this file

1. User asks "where is X?" / "edit Y" / "add a new Z".
2. Search this file (Ctrl+F) for the relevant keyword.
3. If found, read the listed path and proceed.
4. If not found, use the normal search tools (`glob`, `grep`, `read`) to locate it.
5. **Append the new location to this file** in the matching section (or create a new section if none fits).

Do not duplicate `AGENTS.md` content here — that file is the source of truth for *conventions*. This file is the source of truth for *locations*.

---

## Project root

| Path | Purpose |
|---|---|
| `app/` | Mobile client root (Expo / React Native). **All app work happens here.** |
| `app.json` | Expo config (name, scheme, plugins, experiments). |
| `package.json` | Dependencies, scripts, package metadata. |
| `tsconfig.json` | TypeScript config (`strict: true`, path aliases `@/*` → `src/*`). |
| `eslint.config.js` | ESLint flat config. |
| `AGENTS.md` | **Source of truth for conventions, architecture, theming, i18n, navigation, security.** Read this before any non-trivial change. |
| `README.md` | Developer onboarding. |
| `CLAUDE.md` | Redirects to `AGENTS.md`. |
| `assets/` | Static images and icons. |
| `scripts/` | Build/maintenance scripts (e.g., `reset-project.js`). |

---

## Routes (`src/app/`)

File-based routing via `expo-router`. Route path = file path.

| Route path | File | Purpose |
|---|---|---|
| `/` | `src/app/index.tsx` | Discover / Home screen. |
| `/alerts` | `src/app/alerts.tsx` | Full alerts list. |
| `/scan` | `src/app/scan.tsx` | Barcode scanner. |
| `/my-list` | `src/app/my-list.tsx` | Shopping list + favorite agencies. |
| `/about` | `src/app/about.tsx` | About screen. |
| `/products` | `src/app/products/index.tsx` | Product listing (search + filters). |
| `/products/[id]` | `src/app/products/[id].tsx` | Product detail. |
| `/products` (stack) | `src/app/products/_layout.tsx` | Stack layout for products. |
| `/agencies` | `src/app/agencies/index.tsx` | Agencies directory. |
| `/agencies/[id]` | `src/app/agencies/[id].tsx` | Agency detail. |
| `/agencies` (stack) | `src/app/agencies/_layout.tsx` | Stack layout for agencies. |
| Root layout | `src/app/_layout.tsx` | ThemeProvider + SavedItemsProvider + AppTabs. |

---

## Components (`src/components/`)

| File | Purpose |
|---|---|
| `themed-text.tsx` | Theme-aware `Text` wrapper. Exports `ThemedText`, `ThemedTextProps`. |
| `themed-view.tsx` | Theme-aware `View` wrapper. Exports `ThemedView`, `ThemedViewProps`. |
| `app-tabs.tsx` | Custom bottom tab bar with elevated Scan button. |
| `external-link.tsx` | External link that opens in in-app browser on native. |
| `product-card.tsx` | Product grid/list card. |
| `agency-row.tsx` | Agency list row. |
| `kashrut-badge.tsx` | Colored kashrut level badge. |
| `certificate-badge.tsx` | Certificate status badge. |
| `search-bar.tsx` | Reusable search input. |
| `category-chip.tsx` | Filter/tag chip. |
| `quantity-stepper.tsx` | Shopping list quantity control. |
| `scan-overlay.tsx` | Barcode scanner frame animation. |
| `section-header.tsx` | Section title with optional action. |
| `empty-state.tsx` | Empty/illustrated state. |
| `skeleton-card.tsx` | Shimmer loading placeholder. |
| `ui/collapsible.tsx` | Animated accordion with chevron. Generic design-system component. |

---

## Hooks (`src/hooks/`)

| File | Purpose |
|---|---|
| `use-color-scheme.ts` | Native: re-exports RN's `useColorScheme`. |
| `use-color-scheme.web.ts` | Web: hydration-safe color scheme hook. |
| `use-theme.ts` | Returns `Colors` object for current scheme. |
| `use-debounce.ts` | Debounced value hook. |
| `use-saved-items.tsx` | Favorites + shopping list context (backed by AsyncStorage). |

---

## Services (`src/services/`)

All API calls go through here. Base URL is in `api.ts` via `expo-constants`.

| File | Purpose |
|---|---|
| `api.ts` | Base fetch client + `API_BASE_URL`. Exports `apiGet`, `apiPost`, etc. |
| `products.ts` | Product endpoints (`getProducts`, `getProductById`, ...). |
| `agencies.ts` | Agency endpoints. |
| `certificates.ts` | Certificate endpoints. |
| `countries.ts` | Country endpoints (`getCountriesWithAgencies` — returns countries with their agencies). |

---

## i18n (`src/i18n/`)

| File | Purpose |
|---|---|
| `index.ts` | i18next init, locale detection, exports configured `i18n` instance. |
| `use-locale.ts` | `useLocale()` hook — get/set locale, persists to AsyncStorage. |
| `resources/en/translation.json` | English strings (fallback). |
| `resources/es/translation.json` | Spanish strings. |

When adding a new language: copy `en/translation.json`, translate, register in `index.ts` (`SUPPORTED_LOCALES` + `resources`).

---

## Theme & constants

| File | Purpose |
|---|---|
| `src/constants/theme.ts` | **Single source of truth for design tokens.** Exports `Colors` (light/dark), `ThemeColor`, `Fonts`, `Typography`, `Spacing`, `Radius`, `Shadows`, `BottomTabInset`, `MaxContentWidth`. |

Every color key must exist in **both** `Colors.light` and `Colors.dark`.

---

## Types

| File | Purpose |
|---|---|
| `src/types/declarations.d.ts` | Type declarations (e.g., `*.css` modules). |
| `src/global.css` | CSS custom properties for web fonts. |

---

## Common tasks → where to edit

| Task | Edit / add at |
|---|---|
| Add a new screen | Create `src/app/<route>/index.tsx` (or flat `src/app/<route>.x`). See AGENTS.md "Adding a new screen". |
| Add a new tab | Add `TabTrigger` in `src/components/app-tabs.tsx`. |
| Add a new API endpoint | Add typed function in `src/services/<domain>.ts`. |
| Add a new theme color | Add key to **both** `Colors.light` and `Colors.dark` in `src/constants/theme.ts`. |
| Add a new i18n string | Add key to **both** `src/i18n/resources/en/translation.json` and `es/translation.json`. |
| Add a new language | See "Adding a new language" above. |
| Add a new component (generic) | `src/components/ui/<name>.tsx`. |
| Add a new component (feature) | `src/components/<name>.tsx`. |
| Change bottom tab bar | `src/components/app-tabs.tsx` (and `.web.tsx` variant if needed). |
| Change root theme/provider chain | `src/app/_layout.tsx`. |
| Add a new hook | `src/hooks/use-<name>.ts` (or `.tsx` if it uses JSX/Context). |
| Update package versions | **Never** manually edit `package.json` versions. Use `npx expo install <pkg>`. |
| Change Expo config (scheme, plugins) | `app.json`. |
| Add a new platform variant | Create `<name>.web.tsx` / `.ios.tsx` / `.android.tsx` next to base file. |

---

## Conventions quick reminders

(Full list in `AGENTS.md`. These are the ones most often forgotten.)

- **Package manager:** `pnpm` only. Never `npm` or `yarn`.
- **New deps:** `npx expo install <pkg>` (not `pnpm add`).
- **Components:** named exports. Exception: route files and platform-switched files use `export default`.
- **Styles:** `StyleSheet.create` at the bottom. Never inline objects.
- **Types:** `strict: true`. No `any`. Use `unknown` + type guards.
- **Path aliases:** `@/components/foo`, `@/hooks/foo`, etc. Relative imports only within the same directory.
- **i18n:** every user-facing string must go through `t()`. Never hardcode.
- **Theming:** use `ThemedText` / `ThemedView` wrappers. Use `Spacing` constants, not hardcoded numbers.
- **React Compiler is ON:** no manual `useMemo` / `useCallback`.
- **API calls:** always go through `src/services/`. Never `fetch` directly in a component.
- **Commits:** never commit without explicit user authorization.

---

## Discovered locations log

> **Maintain this section.** Append a one-line entry every time you locate something not already documented above. Format: `<path> — <one-line purpose>`.

<!-- AI: append new entries below this line. Keep entries terse and grouped by section. -->
