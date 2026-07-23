# Kosher Pass — Mobile App

Cross-platform mobile client for `Kosher Pass`, built with Expo SDK 57 and React Native 0.86. Targets iOS, Android, and Web.

Part of the `final_code/` monorepo alongside the NestJS backend (`api/`, `worker/`, `shared/`).

## Prerequisites

- Node.js 22+
- pnpm
- Expo CLI (`pnpm add -g @expo/cli`)

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Start the backend API (from `../server/api`)

   ```bash
   cd ../server/api
   pnpm start
   ```

   The app expects the API at `http://localhost:3000` by default. Override it by setting `extra.apiUrl` in `app.json` or via an environment config.

3. Start the app

   **Native (iOS/Android) requires a development build** — the AdMob module (`react-native-google-mobile-ads`) is native code, so the app does **not** run in Expo Go:

   ```bash
   pnpm ios        # builds and launches on the iOS simulator (expo run:ios)
   pnpm android    # builds and launches on the Android emulator (expo run:android)
   ```

   The first build compiles the native project and can take several minutes. Re-run `npx expo prebuild` whenever `app.json` plugins change.

   **Web** works without a dev build (ads are stubbed out):

   ```bash
   pnpm web
   ```

## Ads (AdMob)

An anchored banner shows above the tab bar on all tabs except Scan.

- Dev builds always serve Google's test banner (`TestIds.BANNER`).
- Before release, replace the placeholder ids with your AdMob account values:
  - `app.json` → `plugins["react-native-google-mobile-ads"]`: `androidAppId`, `iosAppId` (app ids, `ca-app-pub-…~…`)
  - `app.json` → `extra`: `admobBannerUnitIdIos`, `admobBannerUnitIdAndroid` (banner unit ids, `ca-app-pub-…/…`). Empty = banner hidden in release builds.
- iOS shows the App Tracking Transparency prompt on first launch; denying it falls back to non-personalized ads.


## Scripts

| Command | Description |
|---|---|
| `pnpm start` | Launch Expo dev server (use with a dev build, not Expo Go) |
| `pnpm ios` | Build and run on iOS simulator (expo run:ios) |
| `pnpm android` | Build and run on Android emulator (expo run:android) |
| `pnpm web` | Start with web target |
| `pnpm lint` | Run ESLint via `expo lint` |

## Project structure

```
src/
├── app/                  # File-based routes (Expo Router)
│   ├── index.tsx         # Discover / Home
│   ├── alerts.tsx        # Alerts list
│   ├── scan.tsx          # Barcode scanner
│   ├── my-list.tsx       # Shopping list + favorite agencies
│   ├── products/         # Products stack
│   └── agencies/         # Agencies stack
├── components/           # Reusable UI components
├── constants/            # Design tokens (colors, fonts, spacing)
├── hooks/                # Custom hooks (theme, debounce, saved items)
├── services/             # API calls (products, agencies, certificates)
├── types/                # Type declarations
└── global.css            # CSS custom properties for web
```

## Tech stack

| Tech | Version |
|---|---|
| Expo SDK | 57 |
| React Native | 0.86 |
| React | 19.2 |
| TypeScript | 6.0 |
| Expo Router | 57 |
| @expo/ui | 57 |
| expo-camera | 57 |
| expo-haptics | 57 |
| react-native-google-mobile-ads | 16.4 |
| expo-tracking-transparency | 57 |
| @react-native-async-storage/async-storage | 2.2.0 |

## Configuration

- Deep link scheme: `kosherpass://`
- Type-safe routes: `experiments.typedRoutes: true`
- React Compiler: `experiments.reactCompiler: true`
- Web output: static SPA
- API base URL: `http://localhost:3000` (configurable via `Constants.expoConfig.extra.apiUrl`)

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router file-based routing](https://docs.expo.dev/router/introduction/)
- [@expo/ui universal components](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal.md)
- [AI instructions (AGENTS.md)](./AGENTS.md)
