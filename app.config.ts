import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Expo config.
 *
 * This replaces the previous static `app.json` so that environment-dependent
 * values (API base URL, telemetry keys, ad unit ids) come from the environment
 * instead of being committed. Expo CLI loads `.env` / `.env.local` before
 * evaluating this file, so `process.env` is populated here at build time; see
 * `.env.example` for the full list of variables.
 *
 * Nothing read here is a secret: everything ends up inside the shipped bundle
 * and is readable by anyone with the app. These are public client identifiers
 * (a DSN, a project API key, an ad unit id). Never put a server-side secret in
 * `extra` - use the API for anything that must stay private.
 */

/** Reads a boolean env var, defaulting to `false` for anything but "true". */
function envFlag(value: string | undefined): boolean {
  return value === 'true';
}

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const ADS_ENABLED = envFlag(process.env.ADS_ENABLED);

/**
 * The AdMob plugin is only added when ads are turned on.
 *
 * It injects native AdMob initialization that hard-requires valid app ids -
 * including it in a build that has none makes the app fail at startup. Keeping
 * it conditional means the default (ads off) build never links AdMob at all.
 *
 * Plugin props are camelCase (`androidAppId` / `iosAppId`); the snake_case keys
 * from older docs are silently ignored and the build warns about a missing id.
 */
const adsPlugin: NonNullable<ExpoConfig['plugins']> =
  ADS_ENABLED && process.env.ADMOB_ANDROID_APP_ID && process.env.ADMOB_IOS_APP_ID
    ? [
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: process.env.ADMOB_ANDROID_APP_ID,
          iosAppId: process.env.ADMOB_IOS_APP_ID,
        },
      ],
    ]
    : [];

/**
 * The Sentry plugin uploads source maps during the build so production stack
 * traces name real files and lines instead of a minified bundle offset. It only
 * runs when an org/project pair is configured; without them the app still
 * reports errors, they are just harder to read.
 */
const sentryPlugin: NonNullable<ExpoConfig['plugins']> =
  process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? [
      [
        '@sentry/react-native/expo',
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
        },
      ],
    ]
    : [];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Kosher Pass',
  slug: 'kosher-pass',
  version: '1.0.2',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'kosherpass',
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android'],
  ios: {
    icon: './assets/icons/apple.icon',
    bundleIdentifier: 'com.kosherpass.app',
  },
  android: {
    predictiveBackGestureEnabled: false,
    package: 'com.kosherpass.app',
    versionCode: 5,
    icon: './assets/icons/android-icon-foreground.png',
    adaptiveIcon: {
      // Adaptive icons composite two 108dp layers and the launcher masks the
      // outer ring, so the logo must live in a *separate* foreground layer
      // padded inside the central safe zone. Passing a composed icon (logo
      // already centred on the flat colour) as `backgroundImage` made Android
      // scale it like a backdrop and crop it, which is why the launcher showed
      // a zoomed, clipped glyph.
      foregroundImage: './assets/icons/android-icon-foreground.png',
      backgroundColor: '#1E2D3D',
      monochromeImage: './assets/icons/android-icon-monochrome.png',
    },
    blockedPermissions: [
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE"
    ],
    permissions: ['android.permission.CAMERA'],
  },

  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#1E2D3D',
        image: './assets/images/logo.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Allow Kosher Pass to access your camera to scan product barcodes.',
        recordAudioAndroid: false,
      },
    ],
    'expo-localization',
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission: 'Allow Kosher Pass to show you personalized ads.',
      },
    ],
    [
      "expo-build-properties",
      {
        "android": {
          "enableShrinkResourcesInReleaseBuilds": true,
          "enableMinifyInReleaseBuilds": true
        }
      }
    ],
    "expo-font",
    "expo-image",
    "expo-status-bar",
    "expo-web-browser",
    // ...sentryPlugin,
    ...adsPlugin,
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    apiUrl: API_URL,

    /** `development` | `staging` | `production`. Tags telemetry events. */
    environment: process.env.APP_ENV ?? 'development',

    // Shown on the About screen. Empty values hide the corresponding row rather
    // than shipping a placeholder address that silently swallows user feedback.
    supportEmail: process.env.SUPPORT_EMAIL ?? '',
    developerWebsite: process.env.DEVELOPER_WEBSITE ?? '',

    // Ads. Disabled unless explicitly turned on, so a build without AdMob
    // configured simply renders no banner rather than an empty reserved strip.
    adsEnabled: ADS_ENABLED,
    admobBannerUnitIdIos: process.env.ADMOB_BANNER_UNIT_ID_IOS ?? '',
    admobBannerUnitIdAndroid: process.env.ADMOB_BANNER_UNIT_ID_ANDROID ?? '',
    // 0 means "let AdMob's own auto-refresh own the cadence" - see .env.example.
    admobBannerRefreshSeconds: Number(process.env.ADMOB_BANNER_REFRESH_SECONDS ?? 0),

    // Telemetry. Empty values keep the corresponding SDK inert, so the app runs
    // normally with no accounts configured.
    sentryDsn: process.env.SENTRY_DSN ?? '',
    posthogApiKey: process.env.POSTHOG_API_KEY ?? '',
    posthogHost: process.env.POSTHOG_HOST ?? 'https://eu.i.posthog.com',
  },
});
