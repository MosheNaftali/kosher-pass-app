import { isSafeExternalUrl, resolveMediaUrl } from '@/services/api';
import type { AgencyAlert } from '@/services/schemas';

/**
 * Turns the alerts the server sends into the rows the Alerts tab renders.
 *
 * This module used to *derive* the feed: it read the catalog the app happened
 * to have loaded and announced conclusions about it - this certificate row
 * says 'revoked', this product has not been touched in a while. That was an
 * inference dressed up as an announcement. No agency had published any of it,
 * so nobody could be held to it, and catalog bookkeeping fired as loudly as a
 * genuine recall.
 *
 * Every alert now originates with a certifying agency, on that agency's own
 * channel, scraped by the backend (see `AlertsScrapingService` in the worker).
 * What is left here is the anti-corruption work that still has to happen on
 * the client: deciding where a row navigates, resolving its image, and
 * ordering the feed.
 */

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface FeedAlert {
  /** Stable React key. */
  id: string;
  severity: AlertSeverity;
  /** Where tapping the alert navigates. */
  target:
    | { type: 'product'; id: number }
    | { type: 'agency'; id: string }
    | { type: 'url'; url: string }
    | { type: 'none' };
  /** Headline, as the publishing agency wrote it. */
  title: string;
  /** Body line, as the publishing agency wrote it. May be empty. */
  description: string;
  /** The agency that published it, for attribution on the row. */
  agencyId: string | null;
  /** Ordering only: when the agency published it, falling back to row age. */
  timestamp: string;
  /** Tie-break within a severity band; higher shows first, ahead of recency. */
  priority: number;
  /** Thumbnail, already resolved through {@link resolveMediaUrl}. */
  imageUrl: string | null;
  /**
   * The agency's own notice this alert was scraped from, safety-checked the
   * same way a `url` target is. The detail sheet's "view source" action falls
   * back to it when the alert declares no `url` target of its own.
   */
  sourceUrl: string | null;
  /**
   * When the agency published the notice, or `null` when it never said. Unlike
   * {@link timestamp} this is not backfilled with our own row age: a scrape
   * date is not a publication date, and showing one as the other would put a
   * claim in the agency's mouth.
   */
  publishedAt: string | null;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/**
 * Resolves an alert's server-declared target into something safe to navigate
 * to. A `url` target is checked through `isSafeExternalUrl` - a
 * `javascript:`/custom-scheme value must never reach `handleAlertPress`'s
 * in-app browser - and collapses to `{ type: 'none' }` when it fails that
 * check, same as a `product`/`agency` type missing its id.
 */
export function resolveAlertTarget(alert: AgencyAlert): FeedAlert['target'] {
  switch (alert.targetType) {
    case 'product':
      return alert.targetProductId !== null
        ? { type: 'product', id: alert.targetProductId }
        : { type: 'none' };
    case 'agency':
      return alert.targetAgencyId !== null
        ? { type: 'agency', id: alert.targetAgencyId }
        : { type: 'none' };
    case 'url':
      return alert.targetUrl !== null && isSafeExternalUrl(alert.targetUrl)
        ? { type: 'url', url: alert.targetUrl }
        : { type: 'none' };
    case 'none':
    default:
      return { type: 'none' };
  }
}

/**
 * Maps one server alert onto its feed row.
 *
 * `publishedAt` wins over `createdAt` for ordering because the two differ: an
 * agency's notice only enters our database the first time its origin is
 * scraped, so a first sync against a new agency would otherwise dump years of
 * back catalog at the top of the feed as if it had all just happened.
 */
export function toFeedAlert(alert: AgencyAlert): FeedAlert {
  return {
    id: `alert-${alert.id}`,
    severity: alert.severity,
    target: resolveAlertTarget(alert),
    title: alert.title,
    description: alert.description,
    agencyId: alert.agencyId,
    timestamp: alert.publishedAt ?? alert.createdAt,
    priority: alert.priority,
    imageUrl: resolveMediaUrl(alert.imageUrl),
    sourceUrl: isSafeExternalUrl(alert.sourceUrl) ? alert.sourceUrl : null,
    publishedAt: alert.publishedAt,
  };
}

/**
 * The link the detail sheet's "view source" action opens, or `null` when the
 * alert carries no external origin at all.
 *
 * A `url` target wins over `sourceUrl`: it is the page the agency pointed this
 * particular notice at, while `sourceUrl` is only the channel it was scraped
 * from. Both have already passed `isSafeExternalUrl`.
 */
export function alertSourceLink(alert: FeedAlert): string | null {
  return alert.target.type === 'url' ? alert.target.url : alert.sourceUrl;
}

/**
 * Orders the feed: severity first, then priority, then most recent.
 *
 * Sorting by recency alone would let a run of routine notices bury a recall,
 * which is the one thing that must never scroll off the top. `priority` sits
 * *below* severity deliberately: it lets an agency rank its own announcements
 * against each other, not push a promotion above a recall.
 */
export function sortAlerts(alerts: FeedAlert[]): FeedAlert[] {
  return [...alerts].sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    const byPriority = b.priority - a.priority;
    if (byPriority !== 0) return byPriority;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/**
 * The Alerts tab's feed.
 *
 * No filtering by `active`/`startsAt`/`expiresAt` happens here: the api's
 * `findVisible()` already scopes the response to active alerts inside their
 * visibility window, so every alert reaching this function is meant to be on
 * screen right now. Nor is there any filtering by agency - the request itself
 * only asked for the agencies the user follows.
 */
export function buildAlerts(alerts: AgencyAlert[]): FeedAlert[] {
  return sortAlerts(alerts.map(toFeedAlert));
}
