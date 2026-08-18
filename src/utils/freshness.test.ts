import { FRESHNESS_THRESHOLDS, getDaysSince, getFreshnessTier } from './freshness';

/**
 * Freshness drives whether the app tells a shopper "this was verified recently"
 * or "do not trust this". The boundaries are asserted exactly, because an
 * off-by-one here silently downgrades a warning the user needed.
 */

const NOW = new Date('2026-08-17T12:00:00.000Z');

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('getDaysSince', () => {
  it('returns 0 for a timestamp in the future (clock skew must not read as fresh-negative)', () => {
    const future = new Date(NOW.getTime() + 60_000).toISOString();
    expect(getDaysSince(future, NOW)).toBe(0);
  });

  it('floors partial days', () => {
    const hours36 = new Date(NOW.getTime() - 36 * 60 * 60 * 1000).toISOString();
    expect(getDaysSince(hours36, NOW)).toBe(1);
  });

  it('treats an unparseable timestamp as infinitely old rather than as fresh', () => {
    // A corrupt date must fail towards caution: the worst outcome is telling a
    // user data is stale when it is not, never the reverse.
    expect(getDaysSince('not-a-date', NOW)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('getFreshnessTier', () => {
  it('classifies the exact tier boundaries', () => {
    expect(getFreshnessTier(daysAgo(FRESHNESS_THRESHOLDS.fresh), NOW)).toBe('fresh');
    expect(getFreshnessTier(daysAgo(FRESHNESS_THRESHOLDS.fresh + 1), NOW)).toBe('aging');
    expect(getFreshnessTier(daysAgo(FRESHNESS_THRESHOLDS.aging), NOW)).toBe('aging');
    expect(getFreshnessTier(daysAgo(FRESHNESS_THRESHOLDS.aging + 1), NOW)).toBe('stale');
    expect(getFreshnessTier(daysAgo(FRESHNESS_THRESHOLDS.stale), NOW)).toBe('stale');
    expect(getFreshnessTier(daysAgo(FRESHNESS_THRESHOLDS.stale + 1), NOW)).toBe('outdated');
  });

  it('classifies a corrupt timestamp as outdated', () => {
    expect(getFreshnessTier('', NOW)).toBe('outdated');
  });
});
