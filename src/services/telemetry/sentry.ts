import * as Sentry from '@sentry/react-native';

import { APP_VERSION, Config, IS_PRODUCTION } from '@/constants/config';

import type { TelemetryProperties } from './events';

/**
 * Sentry adapter.
 *
 * Nothing outside `services/telemetry` imports `@sentry/react-native` directly -
 * screens go through the facade in `./index`. That keeps the vendor swappable
 * and means error reporting can be disabled in one place.
 *
 * Sentry stays completely inert when no DSN is configured, so the app runs
 * normally on a machine with no Sentry account.
 */

let initialized = false;

export function isSentryEnabled(): boolean {
  return initialized;
}

export function initSentry(): void {
  if (initialized || !Config.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: Config.sentryDsn,
    environment: Config.environment,
    // Ties an event to the exact build, so a regression can be traced to a
    // release instead of "sometime last week".
    release: `kosher-pass@${APP_VERSION}`,

    // Performance tracing is sampled hard in production: full tracing on a
    // consumer app is expensive and adds nothing once the shape is known.
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

    // Breadcrumbs record what the user did before a crash. Console breadcrumbs
    // are off in production - they are noisy and the most likely place for a
    // stray log to carry user data into the report.
    enableCaptureFailedRequests: true,
    integrations: IS_PRODUCTION
      ? integrations => integrations.filter(i => i.name !== 'Breadcrumbs')
      : undefined,

    // Local development produces nothing worth a quota slot.
    enabled: !__DEV__,

    beforeSend(event) {
      return scrubEvent(event);
    },
  });

  initialized = true;
}

/**
 * Last-line scrub before an event leaves the device.
 *
 * The app has no login and stores no personal data, so there is little to leak -
 * but a URL can still carry a scanned barcode or a typed search term through a
 * query string, and `beforeSend` is the one place that is guaranteed to run for
 * every event, including ones Sentry's own integrations generate.
 */
function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  if (event.request?.url) {
    event.request.url = stripQueryString(event.request.url);
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
      const url = breadcrumb.data?.url;
      if (typeof url === 'string') {
        return { ...breadcrumb, data: { ...breadcrumb.data, url: stripQueryString(url) } };
      }
      return breadcrumb;
    });
  }

  // The app never sets a user identity; strip anything an SDK inferred.
  delete event.user;

  return event;
}

function stripQueryString(url: string): string {
  const [base] = url.split('?');
  return base;
}

export function captureSentryException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (!initialized) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function addSentryBreadcrumb(
  message: string,
  data?: TelemetryProperties
): void {
  if (!initialized) return;
  Sentry.addBreadcrumb({ message, data, level: 'info' });
}

/**
 * Records the current screen so a crash report says where it happened.
 * Sentry calls this a "transaction"; it is what groups issues by screen.
 */
export function setSentryScreen(routeTemplate: string): void {
  if (!initialized) return;
  Sentry.getCurrentScope().setTransactionName(routeTemplate);
}

export { Sentry };
