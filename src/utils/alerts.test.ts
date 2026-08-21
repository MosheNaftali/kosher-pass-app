import type { AgencyAlert } from '@/services/schemas';

import {
  alertSourceLink,
  buildAlerts,
  resolveAlertTarget,
  sortAlerts,
  toFeedAlert,
  type FeedAlert,
} from './alerts';

const NOW = new Date('2026-08-17T12:00:00.000Z');

function daysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function agencyAlert(overrides: Partial<AgencyAlert> = {}): AgencyAlert {
  return {
    id: 1,
    agencyId: 'KPANAMA',
    source: 'scraper',
    sourceUrl: 'https://kosher.com.pa/noticias-kosher-panama/alerta/',
    publishedAt: null,
    title: 'Alerta',
    description: 'A batch of products is being recalled.',
    imageUrl: null,
    severity: 'info',
    targetType: 'none',
    targetProductId: null,
    targetAgencyId: null,
    targetUrl: null,
    startsAt: null,
    expiresAt: null,
    priority: 0,
    active: true,
    createdAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
    ...overrides,
  } as AgencyAlert;
}

function feedAlert(overrides: Partial<FeedAlert> = {}): FeedAlert {
  return {
    id: 'alert-1',
    severity: 'info',
    target: { type: 'none' },
    title: 'Alerta',
    description: '',
    agencyId: 'KPANAMA',
    timestamp: daysFromNow(-1),
    priority: 0,
    imageUrl: null,
    sourceUrl: 'https://kosher.com.pa/noticias-kosher-panama/alerta/',
    publishedAt: null,
    ...overrides,
  };
}

describe('toFeedAlert', () => {
  it('carries the agency copy through untouched', () => {
    const alert = toFeedAlert(
      agencyAlert({ title: 'Producto retirado', description: 'Lote 402', severity: 'critical' })
    );

    expect(alert.title).toBe('Producto retirado');
    expect(alert.description).toBe('Lote 402');
    expect(alert.severity).toBe('critical');
  });

  it('attributes the alert to its publishing agency', () => {
    expect(toFeedAlert(agencyAlert({ agencyId: 'KMD' })).agencyId).toBe('KMD');
  });

  it('orders by publishedAt when the origin dated the notice', () => {
    // The row is a day old here but the notice is a year old: the agency put it
    // up long before the first scrape reached that origin.
    const alert = toFeedAlert(
      agencyAlert({ publishedAt: daysFromNow(-365), createdAt: daysFromNow(-1) })
    );

    expect(alert.timestamp).toBe(daysFromNow(-365));
  });

  it('falls back to createdAt when the origin published no date', () => {
    const alert = toFeedAlert(agencyAlert({ publishedAt: null, createdAt: daysFromNow(-3) }));

    expect(alert.timestamp).toBe(daysFromNow(-3));
  });

  it('resolves the image through resolveMediaUrl', () => {
    const alert = toFeedAlert(agencyAlert({ imageUrl: 'https://example.com/notice.png' }));

    expect(alert.imageUrl).toBe('https://example.com/notice.png');
  });

  it('drops an unsafe source url', () => {
    // The detail sheet hands this straight to the in-app browser.
    expect(toFeedAlert(agencyAlert({ sourceUrl: 'javascript:alert(1)' })).sourceUrl).toBeNull();
  });

  it('leaves publishedAt null rather than backfilling it with our row age', () => {
    // timestamp falls back to createdAt for ordering; the date shown to the
    // reader must not, because a scrape date is not a publication date.
    const alert = toFeedAlert(agencyAlert({ publishedAt: null, createdAt: daysFromNow(-3) }));

    expect(alert.publishedAt).toBeNull();
    expect(alert.timestamp).toBe(daysFromNow(-3));
  });
});

describe('alertSourceLink', () => {
  it('prefers the url target over the scraped origin', () => {
    const alert = feedAlert({
      target: { type: 'url', url: 'https://example.com/notice' },
      sourceUrl: 'https://example.com/feed',
    });

    expect(alertSourceLink(alert)).toBe('https://example.com/notice');
  });

  it('falls back to the origin the notice was scraped from', () => {
    const alert = feedAlert({ target: { type: 'product', id: 42 } });

    expect(alertSourceLink(alert)).toBe('https://kosher.com.pa/noticias-kosher-panama/alerta/');
  });

  it('returns null when the alert has no external origin at all', () => {
    expect(alertSourceLink(feedAlert({ sourceUrl: null }))).toBeNull();
  });
});

describe('resolveAlertTarget', () => {
  it('maps a product target', () => {
    expect(resolveAlertTarget(agencyAlert({ targetType: 'product', targetProductId: 42 }))).toEqual(
      { type: 'product', id: 42 }
    );
  });

  it('maps an agency target', () => {
    expect(resolveAlertTarget(agencyAlert({ targetType: 'agency', targetAgencyId: 'KMD' }))).toEqual(
      { type: 'agency', id: 'KMD' }
    );
  });

  it('maps a url target', () => {
    expect(
      resolveAlertTarget(agencyAlert({ targetType: 'url', targetUrl: 'https://example.com/promo' }))
    ).toEqual({ type: 'url', url: 'https://example.com/promo' });
  });

  it('collapses an unsafe url target to none', () => {
    // A javascript: value stored upstream must never reach the in-app browser.
    expect(
      resolveAlertTarget(agencyAlert({ targetType: 'url', targetUrl: 'javascript:alert(1)' }))
    ).toEqual({ type: 'none' });
  });

  it('collapses a target whose id is missing', () => {
    expect(
      resolveAlertTarget(agencyAlert({ targetType: 'product', targetProductId: null }))
    ).toEqual({ type: 'none' });
  });

  it('maps an explicit none target', () => {
    expect(resolveAlertTarget(agencyAlert({ targetType: 'none' }))).toEqual({ type: 'none' });
  });
});

describe('sortAlerts', () => {
  it('puts critical above warning above info', () => {
    const sorted = sortAlerts([
      feedAlert({ id: 'info', severity: 'info' }),
      feedAlert({ id: 'critical', severity: 'critical' }),
      feedAlert({ id: 'warning', severity: 'warning' }),
    ]);

    expect(sorted.map(a => a.id)).toEqual(['critical', 'warning', 'info']);
  });

  it('ranks by priority within a severity band', () => {
    const sorted = sortAlerts([
      feedAlert({ id: 'low', severity: 'info', priority: 0 }),
      feedAlert({ id: 'high', severity: 'info', priority: 10 }),
    ]);

    expect(sorted.map(a => a.id)).toEqual(['high', 'low']);
  });

  it('never lets priority outrank severity', () => {
    // An agency can rank its own announcements against each other; it cannot
    // push a promotion above a recall.
    const sorted = sortAlerts([
      feedAlert({ id: 'promo', severity: 'info', priority: 100 }),
      feedAlert({ id: 'recall', severity: 'critical', priority: 0 }),
    ]);

    expect(sorted[0].id).toBe('recall');
  });

  it('falls back to most recent within equal severity and priority', () => {
    const sorted = sortAlerts([
      feedAlert({ id: 'old', timestamp: daysFromNow(-10) }),
      feedAlert({ id: 'new', timestamp: daysFromNow(-1) }),
    ]);

    expect(sorted.map(a => a.id)).toEqual(['new', 'old']);
  });
});

describe('buildAlerts', () => {
  it('maps and orders the server feed in one pass', () => {
    const alerts = buildAlerts([
      agencyAlert({ id: 1, severity: 'info' }),
      agencyAlert({ id: 2, severity: 'critical' }),
    ]);

    expect(alerts.map(a => a.id)).toEqual(['alert-2', 'alert-1']);
  });

  it('returns an empty feed for an empty response', () => {
    expect(buildAlerts([])).toEqual([]);
  });

  it('does not re-filter the visibility window the api already applied', () => {
    // findVisible() ships only active rows inside their startsAt/expiresAt
    // window, so anything reaching here is meant to be on screen right now.
    const alerts = buildAlerts([
      agencyAlert({ id: 1, startsAt: daysFromNow(10), expiresAt: daysFromNow(-10) }),
    ]);

    expect(alerts).toHaveLength(1);
  });
});
