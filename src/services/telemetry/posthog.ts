import PostHog from 'posthog-react-native';

import { APP_VERSION, Config } from '@/constants/config';

import type { TelemetryProperties } from './events';

/**
 * PostHog adapter.
 *
 * Consent-first: the client is created with capturing switched off and is only
 * enabled once {@link setPostHogConsent} is called with `true`. Nothing is sent
 * before the user has answered the tracking prompt, which is both the ATT
 * requirement on iOS and the GDPR-safe default everywhere else.
 *
 * PostHog stays inert when no project key is configured.
 */

let client: PostHog | null = null;
let consentGranted = false;

export function isPostHogEnabled(): boolean {
  return client !== null && consentGranted;
}

export function initPostHog(): void {
  if (client || !Config.posthogApiKey) {
    return;
  }

  client = new PostHog(Config.posthogApiKey, {
    host: Config.posthogHost,
    // Screen views are emitted explicitly from the router, not guessed by the
    // SDK - autocapture on a custom tab bar produces unusable route names.
    captureAppLifecycleEvents: true,
    // Events are batched; a shopper on a supermarket connection should not pay
    // a round trip per tap.
    flushAt: 20,
    flushInterval: 30_000,
    // Nothing leaves the device until consent is granted.
    defaultOptIn: false,
  });

  client.register({
    app_version: APP_VERSION,
    environment: Config.environment,
  });
}

/**
 * Applies the user's tracking decision.
 *
 * Opting out clears the queued events as well, so a user who declines does not
 * have a backlog of pre-consent events flushed later.
 */
export function setPostHogConsent(granted: boolean): void {
  consentGranted = granted;
  if (!client) return;

  if (granted) {
    client.optIn();
  } else {
    client.optOut();
  }
}

/**
 * Drops keys whose value is `undefined`.
 *
 * PostHog's payload type is JSON, which has no `undefined`. Sending the key
 * anyway would create a bogus bucket in every breakdown for that property; an
 * omitted key is correctly reported as "not set" instead.
 */
function compactProperties(
  properties: TelemetryProperties | undefined
): Record<string, string | number | boolean | null> | undefined {
  if (!properties) return undefined;

  const compacted: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined) {
      compacted[key] = value;
    }
  }
  return compacted;
}

export function capturePostHogEvent(
  name: string,
  properties?: TelemetryProperties
): void {
  if (!isPostHogEnabled() || !client) return;
  client.capture(name, compactProperties(properties));
}

export function capturePostHogScreen(
  routeTemplate: string,
  properties?: TelemetryProperties
): void {
  if (!isPostHogEnabled() || !client) return;
  client.screen(routeTemplate, compactProperties(properties));
}

/**
 * Flushes pending events. Called when the app backgrounds so a session's tail
 * is not lost if the OS kills the process.
 */
export function flushPostHog(): void {
  if (!client) return;
  void client.flush().catch(() => {
    // A failed flush is not worth surfacing: the events are retried on the next
    // interval, and a telemetry failure must never break the app.
  });
}
