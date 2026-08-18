import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

import { Config } from '@/constants/config';

import {
  toRouteTemplate,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
  type TelemetryProperties,
} from './events';
import {
  capturePostHogEvent,
  capturePostHogScreen,
  flushPostHog,
  initPostHog,
  isPostHogEnabled,
  setPostHogConsent,
} from './posthog';
import {
  addSentryBreadcrumb,
  captureSentryException,
  initSentry,
  isSentryEnabled,
  setSentryScreen,
} from './sentry';

/**
 * The telemetry facade.
 *
 * Screens, hooks and services import from here and nowhere else - never from
 * `@sentry/react-native` or `posthog-react-native` directly. That buys three
 * things: the vendors stay swappable, consent is enforced in one place, and a
 * telemetry outage can never take the app down with it.
 *
 * Two channels, deliberately separate:
 *   - **Analytics** (PostHog) answers "what do users do". Requires consent.
 *   - **Errors** (Sentry) answers "what is broken". Runs regardless of the
 *     tracking prompt, because crash reporting is not behavioural advertising
 *     and carries no user identity (see the scrubber in `./sentry`).
 *
 * Every entry point is failure-tolerant: a throw inside telemetry is swallowed,
 * because a broken analytics call must never break a shopper's session.
 */

let started = false;

/** Whether either backend is configured. Useful for a debug screen. */
export function isTelemetryConfigured(): boolean {
  return Boolean(Config.sentryDsn || Config.posthogApiKey);
}

/**
 * Boots both SDKs and resolves the tracking consent.
 *
 * Safe to call more than once. Errors are contained: if a vendor SDK fails to
 * initialize the app carries on with telemetry silently disabled.
 */
export async function initTelemetry(): Promise<void> {
  if (started) return;
  started = true;

  try {
    initSentry();
    initPostHog();
  } catch (error) {
    console.warn('[telemetry] initialization failed', error);
    return;
  }

  // iOS App Tracking Transparency. On Android and web this resolves to granted
  // without showing anything.
  try {
    const { status } = await requestTrackingPermissionsAsync();
    const granted = status === 'granted';
    setPostHogConsent(granted);
    track('tracking_consent_result', { granted });
  } catch {
    // No answer means no consent - the safe default.
    setPostHogConsent(false);
  }
}

/**
 * Records a product-analytics event.
 *
 * The event name and its payload are checked against the catalog in `./events`,
 * so a typo or a missing property is a compile error rather than a silently
 * malformed row in the dashboard.
 */
export function track<N extends AnalyticsEventName>(
  name: N,
  properties: AnalyticsEventProperties<N>
): void {
  try {
    capturePostHogEvent(name, properties as TelemetryProperties);
    // The same event doubles as a Sentry breadcrumb, so a crash report shows
    // the actions that led up to it without a second instrumentation pass.
    addSentryBreadcrumb(name, properties as TelemetryProperties);
  } catch (error) {
    console.warn('[telemetry] track failed', error);
  }
}

/**
 * Records a screen view. `path` is collapsed to a route template, so
 * `/products/1423` is reported as `/products/:id` rather than creating a
 * separate series per product.
 */
export function trackScreen(path: string): void {
  try {
    const template = toRouteTemplate(path);
    capturePostHogScreen(template);
    setSentryScreen(template);
  } catch (error) {
    console.warn('[telemetry] trackScreen failed', error);
  }
}

/**
 * Reports an unexpected error.
 *
 * For handled, expected failures (a 404, a cancelled request) prefer a `track`
 * event - Sentry is for things that should not happen.
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  try {
    captureSentryException(error, context);
  } catch (nested) {
    console.warn('[telemetry] captureError failed', nested);
  }
}

/** Flushes buffered analytics. Call when the app backgrounds. */
export function flushTelemetry(): void {
  try {
    flushPostHog();
  } catch {
    // Nothing actionable; the events retry on the next interval.
  }
}

export { isPostHogEnabled as isAnalyticsEnabled, isSentryEnabled as isErrorReportingEnabled };
export { toRouteTemplate } from './events';
export type { AnalyticsEvent, AnalyticsEventName, SearchSource } from './events';
