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

2. Configure the environment

   ```bash
   cp .env.example .env
   ```

   `.env` is gitignored. Every variable is documented in `.env.example`; all of them are optional
   for local development — the app falls back to `http://localhost:3000` and runs with telemetry
   and ads disabled.

3. Start the backend API (from `../server/api`)

   ```bash
   cd ../server/api
   pnpm start
   ```

   The app expects the API at `http://localhost:3000` by default. Override it with `API_URL` in
   `.env`. Testing on a physical device? Use your machine's LAN IP, not `localhost`.

4. Start the app

   **Native (iOS/Android) requires a development build** — the AdMob module (`react-native-google-mobile-ads`) is native code, so the app does **not** run in Expo Go:

   ```bash
   pnpm ios        # builds and launches on the iOS simulator (expo run:ios)
   pnpm android    # builds and launches on the Android emulator (expo run:android)
   ```

   The first build compiles the native project and can take several minutes. Re-run
   `npx expo prebuild` whenever the `plugins` array in `app.config.ts` changes.

   **Web** works without a dev build (ads are stubbed out):

   ```bash
   pnpm web
   ```

## Internal Documentation
### Execute clean build
1. Reset builds
   ```bash
   npx expo prebuild --clean
   ```

2. Restore changes
#### Android
- Put jks file in android/app
- Put credentials in android/gradle.properties
   ```bash
   MYAPP_UPLOAD_STORE_FILE={name-of-file-jks-or-keystore}
   MYAPP_UPLOAD_KEY_ALIAS={key-alias}
   MYAPP_UPLOAD_STORE_PASSWORD={store-password}
   MYAPP_UPLOAD_KEY_PASSWORD={key-password}
   ```
- Add the next lines to android/app/build.gradle
```gradle
android {
    ... 
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ... 
            signingConfig signingConfigs.release
        }
    }
}
```
#### IOS

### App Name Localization (Native)

The app name displayed on the device home screen changes based on the device's language.

#### iOS

1. Run `npx expo prebuild --clean --platform ios` to regenerate the iOS project.

2. Create localized `InfoPlist.strings` files for each language:

   **Spanish** (`ios/hebrewcalendar/es.lproj/InfoPlist.strings`):
   ```
   "CFBundleDisplayName" = "Calendario Hebreo";
   ```

   **English** (`ios/hebrewcalendar/en.lproj/InfoPlist.strings`):
   ```
   "CFBundleDisplayName" = "Hebrew Calendar";
   ```

3. To add a new language, create the corresponding `.lproj` directory and `InfoPlist.strings` file:
   ```bash
   mkdir -p ios/hebrewcalendar/<language-code>.lproj
   ```

#### Android

1. Run `npx expo prebuild --clean --platform android` to regenerate the Android project.

2. Remove from `strings.xml` on (`android/app/src/main/res/values/strings.xml`)
    ```xml
    <string name="app_name">Calendario Hebreo</string>
    ```

3. Create localized `strings.xml` files for each language:

   **Spanish** (`android/app/src/main/res/values-es/strings.xml`):
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <resources>
       <string name="app_name">Calendario Hebreo</string>
   </resources>
   ```

   **English** (`android/app/src/main/res/values-en/strings.xml`):
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <resources>
       <string name="app_name">Hebrew Calendar</string>
   </resources>
   ```

3. To add a new language, create the corresponding `values-<language-code>` directory and `strings.xml` file:
   ```bash
   mkdir -p android/app/src/main/res/values-<language-code>
   ```

## Generate Release Build
1. Change the versionCode and versionName on android/app/build.gradle
   ```gradle
   android {
       ... 
       defaultConfig {
           versionCode 10 // increment this
           versionName "1.0.$versionCode" // increment this
       }
   }
   ```
2. Generate release build
   ```bash
   cd android
   ./gradlew app:bundleRelease
   cd ..
   ```
Find the generated app bundle in `android/app/build/outputs/bundle/release/app-release.aab`


## Offline support

The app is used inside supermarkets, where connectivity is worst. Server responses are cached by
TanStack Query and **persisted to AsyncStorage**, so a cold start with no network still shows the
last known catalog.

- Cached content stays on screen during a background refetch — a spinner never replaces data the
  user is already reading.
- An `OfflineBanner` makes the cached state visible. That matters here: a certificate revoked while
  the device was offline would still render as valid from cache, and the user needs to know.
- The persisted cache is invalidated by app version, so a build that changes a response shape never
  rehydrates data the new schemas reject.

## API response validation

Every response is parsed by a zod schema in `src/services/schemas.ts`; the TypeScript types are
inferred from those schemas, so validation and types cannot drift. The schemas also rename the
server's entity relation columns (`agencyId` → `agency`, `certificateId` → `certificate`) so screens
never read `product.agencyId.logoUrl`.

## Telemetry

Two optional services, both inert until you configure them — the app runs fine with neither.

| | Service | Enable with | Purpose |
|---|---|---|---|
| Errors | [Sentry](https://sentry.io) | `SENTRY_DSN` | Crashes, JS errors, performance |
| Analytics | [PostHog](https://posthog.com) | `POSTHOG_API_KEY` | Events, funnels, retention |

- Sentry is **disabled in `__DEV__`** — local development never spends quota.
- PostHog is **consent-gated**: nothing is captured until the user accepts the App Tracking
  Transparency prompt. Sentry runs regardless, sets no user identity, and strips query strings
  before sending.
- Set `SENTRY_ORG` + `SENTRY_PROJECT` (and `SENTRY_AUTH_TOKEN` as a CI/EAS secret) to upload
  source maps during EAS builds, so production stack traces are readable.
- Never call a vendor SDK from a screen. Use the facade:

  ```tsx
  import { track, captureError } from '@/services/telemetry';
  ```

  Events are a typed catalog in `src/services/telemetry/events.ts` — see AGENTS.md.

## Ads (AdMob)

A full-width banner (adaptive, capped at 60dp tall) is anchored at the **top** of the app, above
every screen, on all tabs except Scan. It is laid out in flow, so screens are pushed down by it and
nothing ever overlaps it. **Off by default.**

- Set `ADS_ENABLED=true` in `.env` to turn it on. While it is `false`, the AdMob native plugin is
  left out of the build entirely.
- Dev builds always serve Google's adaptive test banner (`TestIds.ADAPTIVE_BANNER`).
- Before release, fill in your AdMob values in `.env`:
  - `ADMOB_ANDROID_APP_ID` / `ADMOB_IOS_APP_ID` — app ids (`ca-app-pub-…~…`). **Both are
    required**; without them the plugin is skipped, because AdMob's native init fails at startup
    with invalid ids.
  - `ADMOB_BANNER_UNIT_ID_IOS` / `ADMOB_BANNER_UNIT_ID_ANDROID` — banner unit ids
    (`ca-app-pub-…/…`). Empty = banner hidden in release builds.
- iOS shows the App Tracking Transparency prompt on first launch; denying it falls back to
  non-personalized ads.

### Refresh cadence

A banner earns per impression, so it has to refresh — but refreshing too often is what gets an
AdMob account suspended. There are two mutually exclusive ways to do it:

1. **AdMob auto-refresh (default, recommended).** Leave `ADMOB_BANNER_REFRESH_SECONDS=0` and set
   the refresh rate on the ad unit in the AdMob console (30–120s; 60s is Google's recommendation).
   Google owns the cadence, so it cannot drift out of policy.
2. **In-app refresh.** Set `ADMOB_BANNER_REFRESH_SECONDS` to the interval you want. The banner then
   reloads **on a screen change**, never more often than that interval and never while the app is
   backgrounded. Values under 30 are clamped up to 30 (AdMob's floor).

**Do not enable both** — the two stack, and the real refresh rate ends up roughly double what
either intends. Turn the ad unit's automatic refresh off in the console before using option 2.


## Scripts

| Command | Description |
|---|---|
| `pnpm start` | Launch Expo dev server (use with a dev build, not Expo Go) |
| `pnpm ios` | Build and run on iOS simulator (expo run:ios) |
| `pnpm android` | Build and run on Android emulator (expo run:android) |
| `pnpm web` | Start with web target |
| `pnpm lint` | Run ESLint via `expo lint` |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |
| `pnpm test` | Run the Jest suite |
| `pnpm test:watch` | Jest in watch mode |

## Project structure

```
src/
├── app/                  # File-based routes (Expo Router)
│   ├── index.tsx         # Entry route (/) — redirects to /products
│   ├── discover.tsx      # Discover / Home (tab currently hidden)
│   ├── alerts/           # Alerts feed (notices from followed agencies)
│   ├── scan.tsx          # Barcode scanner
│   ├── my-list.tsx       # Shopping list + favorite agencies
│   ├── products/         # Products stack
│   └── agencies/         # Agencies stack
├── components/           # Reusable UI components
├── constants/            # Design tokens (colors, fonts, spacing)
├── hooks/                # Custom hooks (theme, debounce, saved items, screen tracking)
├── services/             # API calls, validation, caching
│   ├── schemas.ts        # zod schemas — the source of truth for API types
│   ├── query-client.ts   # TanStack Query client + persisted offline cache
│   └── telemetry/        # Analytics + error monitoring facade
├── utils/                # Pure helpers (freshness, alerts, countries)
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
| @sentry/react-native | 7.11 |
| posthog-react-native | 4.63 |
| zod | 4.4 |
| @tanstack/react-query | 5.101 |

## Configuration

Configuration lives in **`app.config.ts`** (there is no `app.json`), which reads `.env` at build
time and publishes values under `expo.extra`. In code, read them through
`Config` in `src/constants/config.ts` — never `Constants.expoConfig.extra` directly.

- Deep link scheme: `kosherpass://`
- Type-safe routes: `experiments.typedRoutes: true`
- React Compiler: `experiments.reactCompiler: true`
- Web output: static SPA
- API base URL: `http://localhost:3000` (override with `API_URL` in `.env`)
- Android permissions: `CAMERA` only — the app never records audio

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router file-based routing](https://docs.expo.dev/router/introduction/)
- [@expo/ui universal components](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal.md)
- [AI instructions (AGENTS.md)](./AGENTS.md)
