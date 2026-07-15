export type FreshnessTier = 'fresh' | 'aging' | 'stale' | 'outdated';

export const FRESHNESS_THRESHOLDS = {
  fresh: 3,
  aging: 4,
  stale: 10,
} as const;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getDaysSince(updatedAt: string, now: Date = new Date()): number {
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) {
    return Number.POSITIVE_INFINITY;
  }
  const diffMs = now.getTime() - updated.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / MS_PER_DAY);
}

export function getFreshnessTier(updatedAt: string, now: Date = new Date()): FreshnessTier {
  const days = getDaysSince(updatedAt, now);
  if (days <= FRESHNESS_THRESHOLDS.fresh) return 'fresh';
  if (days <= FRESHNESS_THRESHOLDS.aging) return 'aging';
  if (days <= FRESHNESS_THRESHOLDS.stale) return 'stale';
  return 'outdated';
}
