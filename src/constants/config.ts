import Constants from 'expo-constants';

/**
 * Typed access to the values `app.config.ts` publishes through
 * `expo.extra`.
 *
 * Every screen and service reads configuration from here rather than touching
 * `Constants.expoConfig?.extra` directly, so the shape is validated and
 * defaulted in exactly one place. Values are resolved at build time and are
 * readable inside the shipped bundle - they are public client identifiers, not
 * secrets. See `.env.example`.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

export interface AppConfig {
  apiUrl: string;
  environment: AppEnvironment;
  supportEmail: string;
  developerWebsite: string;
  adsEnabled: boolean;
  admobBannerUnitIdIos: string;
  admobBannerUnitIdAndroid: string;
  sentryDsn: string;
  posthogApiKey: string;
  posthogHost: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function readString(key: string, fallback: string): string {
  const value = extra[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function readBoolean(key: string, fallback: boolean): boolean {
  const value = extra[key];
  return typeof value === 'boolean' ? value : fallback;
}

function readEnvironment(): AppEnvironment {
  const value = extra.environment;
  return value === 'production' || value === 'staging' ? value : 'development';
}

export const Config: AppConfig = {
  apiUrl: readString('apiUrl', 'http://localhost:3000'),
  environment: readEnvironment(),
  supportEmail: readString('supportEmail', ''),
  developerWebsite: readString('developerWebsite', ''),
  adsEnabled: readBoolean('adsEnabled', false),
  admobBannerUnitIdIos: readString('admobBannerUnitIdIos', ''),
  admobBannerUnitIdAndroid: readString('admobBannerUnitIdAndroid', ''),
  sentryDsn: readString('sentryDsn', ''),
  posthogApiKey: readString('posthogApiKey', ''),
  posthogHost: readString('posthogHost', 'https://eu.i.posthog.com'),
};

/** App version shown in the UI and attached to telemetry as the release name. */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '1.0.0';

export const IS_PRODUCTION = Config.environment === 'production';
