import type { Certificate } from '@/services/certificates';
import type { Product } from '@/services/products';

import { getFreshnessTier } from './freshness';

/**
 * Derives the alerts feed from data the app already has.
 *
 * The screen used to present "the first six products in the catalog" as if they
 * were news. That is not an alert - it never changes, it warns about nothing,
 * and it trains users to ignore the feed. These are the signals that actually
 * matter to someone deciding whether to put an item in their basket, ordered by
 * how much they should change that decision.
 *
 * Everything here is derived from existing fields (certificate status, validity
 * dates, timestamps), so no schema change is needed. When the backend grows a
 * real events table, this module is the seam to swap.
 */

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertKind =
  | 'certificate_revoked'
  | 'certificate_expired'
  | 'certificate_expiring'
  | 'product_outdated'
  | 'product_new';

export interface DerivedAlert {
  /** Stable React key. */
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  /** Where tapping the alert navigates. */
  target: { type: 'product'; id: number } | { type: 'agency'; id: string };
  /** i18n key for the headline. */
  titleKey: string;
  /** Interpolation values for {@link titleKey}, plus the subtitle line. */
  subject: string;
  /** Days until/since the relevant date, when the copy needs it. */
  days?: number;
  /** Used only for ordering within a severity band. */
  timestamp: string;
}

/** A certificate expiring within this many days is worth surfacing. */
export const EXPIRING_SOON_DAYS = 30;

/** A product created within this many days still counts as new. */
export const NEW_PRODUCT_DAYS = 14;

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Certificate-driven alerts.
 *
 * A revoked certificate is the single most important thing this app can tell
 * someone: a product they may believe is certified no longer is.
 */
export function deriveCertificateAlerts(
  certificates: Certificate[],
  now: Date = new Date()
): DerivedAlert[] {
  const alerts: DerivedAlert[] = [];

  for (const certificate of certificates) {
    const subject = certificate.agency?.name ?? certificate.agencyId;
    const target = { type: 'agency' as const, id: certificate.agencyId };

    if (certificate.status === 'revoked') {
      alerts.push({
        id: `certificate-revoked-${certificate.id}`,
        kind: 'certificate_revoked',
        severity: 'critical',
        target,
        titleKey: 'alerts.certificateRevoked',
        subject,
        timestamp: certificate.updatedAt,
      });
      continue;
    }

    if (certificate.status === 'expired') {
      alerts.push({
        id: `certificate-expired-${certificate.id}`,
        kind: 'certificate_expired',
        severity: 'warning',
        target,
        titleKey: 'alerts.certificateExpired',
        subject,
        timestamp: certificate.updatedAt,
      });
      continue;
    }

    // Still valid, but not for much longer.
    if (certificate.validUntil) {
      const expiresAt = new Date(certificate.validUntil);
      if (!Number.isNaN(expiresAt.getTime())) {
        const days = daysBetween(now, expiresAt);
        if (days >= 0 && days <= EXPIRING_SOON_DAYS) {
          alerts.push({
            id: `certificate-expiring-${certificate.id}`,
            kind: 'certificate_expiring',
            severity: 'warning',
            target,
            titleKey: 'alerts.certificateExpiring',
            subject,
            days,
            timestamp: certificate.validUntil,
          });
        }
      }
    }
  }

  return alerts;
}

/**
 * Product-driven alerts: genuinely new entries, and entries that have gone so
 * long without a refresh that their kashrut status should not be trusted.
 */
export function deriveProductAlerts(
  products: Product[],
  now: Date = new Date()
): DerivedAlert[] {
  const alerts: DerivedAlert[] = [];

  for (const product of products) {
    if (getFreshnessTier(product.updatedAt, now) === 'outdated') {
      alerts.push({
        id: `product-outdated-${product.id}`,
        kind: 'product_outdated',
        severity: 'warning',
        target: { type: 'product', id: product.id },
        titleKey: 'alerts.productOutdated',
        subject: product.name,
        timestamp: product.updatedAt,
      });
      continue;
    }

    const createdAt = new Date(product.createdAt);
    if (!Number.isNaN(createdAt.getTime())) {
      const age = daysBetween(createdAt, now);
      // `age >= 0` guards against a clock skew putting createdAt in the future.
      if (age >= 0 && age <= NEW_PRODUCT_DAYS) {
        alerts.push({
          id: `product-new-${product.id}`,
          kind: 'product_new',
          severity: 'info',
          target: { type: 'product', id: product.id },
          titleKey: 'alerts.productNew',
          subject: product.name,
          timestamp: product.createdAt,
        });
      }
    }
  }

  return alerts;
}

/**
 * Merges and orders alerts: severity first, then most recent.
 *
 * Sorting by recency alone would let a batch of new products bury a revoked
 * certificate, which is the one thing that must never scroll off the top.
 */
export function sortAlerts(alerts: DerivedAlert[]): DerivedAlert[] {
  return [...alerts].sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

export function buildAlerts(
  products: Product[],
  certificates: Certificate[],
  now: Date = new Date()
): DerivedAlert[] {
  return sortAlerts([
    ...deriveCertificateAlerts(certificates, now),
    ...deriveProductAlerts(products, now),
  ]);
}
