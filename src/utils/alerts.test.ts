import type { Certificate } from '@/services/certificates';
import type { Product } from '@/services/products';

import {
  buildAlerts,
  deriveCertificateAlerts,
  deriveProductAlerts,
  EXPIRING_SOON_DAYS,
  NEW_PRODUCT_DAYS,
  sortAlerts,
} from './alerts';

const NOW = new Date('2026-08-17T12:00:00.000Z');

function daysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function certificate(overrides: Partial<Certificate> = {}): Certificate {
  return {
    id: 1,
    agencyId: 'KMD',
    agency: null,
    certificateCode: null,
    status: 'valid',
    validFrom: null,
    validUntil: null,
    scanUrl: null,
    metadata: null,
    createdAt: daysFromNow(-100),
    updatedAt: daysFromNow(-1),
    ...overrides,
  } as Certificate;
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Test product',
    nameSearch: null,
    brand: null,
    category: null,
    subCategory: null,
    barcode: null,
    externalId: null,
    kashrutLevel: 'pareve',
    isMehadrin: false,
    country: null,
    agency: null,
    certificate: null,
    active: true,
    notes: null,
    imgUrl: null,
    createdAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
    ...overrides,
  } as Product;
}

describe('deriveCertificateAlerts', () => {
  it('flags a revoked certificate as critical', () => {
    const [alert] = deriveCertificateAlerts([certificate({ status: 'revoked' })], NOW);

    expect(alert.kind).toBe('certificate_revoked');
    expect(alert.severity).toBe('critical');
    expect(alert.target).toEqual({ type: 'agency', id: 'KMD' });
  });

  it('flags an expired certificate as a warning', () => {
    const [alert] = deriveCertificateAlerts([certificate({ status: 'expired' })], NOW);

    expect(alert.kind).toBe('certificate_expired');
    expect(alert.severity).toBe('warning');
  });

  it('flags a valid certificate expiring inside the window, with the day count', () => {
    const [alert] = deriveCertificateAlerts(
      [certificate({ status: 'valid', validUntil: daysFromNow(10) })],
      NOW
    );

    expect(alert.kind).toBe('certificate_expiring');
    expect(alert.days).toBe(10);
  });

  it('ignores a valid certificate expiring beyond the window', () => {
    const alerts = deriveCertificateAlerts(
      [certificate({ status: 'valid', validUntil: daysFromNow(EXPIRING_SOON_DAYS + 1) })],
      NOW
    );

    expect(alerts).toHaveLength(0);
  });

  it('does not emit an expiry alert for a certificate that already lapsed by date', () => {
    // A past `validUntil` on a still-"valid" row is a data lag, not an upcoming
    // expiry - surfacing it as "expires in -5 days" would be nonsense copy.
    const alerts = deriveCertificateAlerts(
      [certificate({ status: 'valid', validUntil: daysFromNow(-5) })],
      NOW
    );

    expect(alerts).toHaveLength(0);
  });

  it('ignores an unparseable validUntil instead of throwing', () => {
    const alerts = deriveCertificateAlerts(
      [certificate({ status: 'valid', validUntil: 'garbage' })],
      NOW
    );

    expect(alerts).toHaveLength(0);
  });

  it('prefers the agency name over the raw id when it is available', () => {
    const [alert] = deriveCertificateAlerts(
      [
        certificate({
          status: 'revoked',
          agency: { id: 'KMD', name: 'Kosher Mexico' } as Certificate['agency'],
        }),
      ],
      NOW
    );

    expect(alert.subject).toBe('Kosher Mexico');
  });
});

describe('deriveProductAlerts', () => {
  it('flags an outdated product', () => {
    const [alert] = deriveProductAlerts([product({ updatedAt: daysFromNow(-400) })], NOW);

    expect(alert.kind).toBe('product_outdated');
    expect(alert.severity).toBe('warning');
  });

  it('flags a genuinely recent product as new', () => {
    const [alert] = deriveProductAlerts([product({ createdAt: daysFromNow(-2) })], NOW);

    expect(alert.kind).toBe('product_new');
    expect(alert.severity).toBe('info');
  });

  it('does not treat an old product as new - the previous screen showed the first six rows regardless of age', () => {
    const alerts = deriveProductAlerts(
      [product({ createdAt: daysFromNow(-(NEW_PRODUCT_DAYS + 1)) })],
      NOW
    );

    expect(alerts).toHaveLength(0);
  });

  it('reports an outdated product once, not also as new', () => {
    const alerts = deriveProductAlerts(
      [product({ createdAt: daysFromNow(-1), updatedAt: daysFromNow(-400) })],
      NOW
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0].kind).toBe('product_outdated');
  });
});

describe('sortAlerts', () => {
  it('keeps critical alerts above newer low-severity ones', () => {
    // The ordering guarantee that matters: a burst of new products must never
    // push a revoked certificate off the top of the feed.
    const alerts = buildAlerts(
      [product({ id: 7, createdAt: daysFromNow(0) })],
      [certificate({ status: 'revoked', updatedAt: daysFromNow(-30) })],
      NOW
    );

    expect(alerts[0].severity).toBe('critical');
    expect(alerts[1].kind).toBe('product_new');
  });

  it('orders equal severities most recent first', () => {
    const sorted = sortAlerts([
      {
        id: 'a',
        kind: 'product_new',
        severity: 'info',
        target: { type: 'product', id: 1 },
        titleKey: 'x',
        subject: 'older',
        timestamp: daysFromNow(-5),
      },
      {
        id: 'b',
        kind: 'product_new',
        severity: 'info',
        target: { type: 'product', id: 2 },
        titleKey: 'x',
        subject: 'newer',
        timestamp: daysFromNow(-1),
      },
    ]);

    expect(sorted.map(a => a.subject)).toEqual(['newer', 'older']);
  });

  it('does not mutate its input', () => {
    const input = buildAlerts([], [certificate({ status: 'revoked' })], NOW);
    const copy = [...input];
    sortAlerts(input);

    expect(input).toEqual(copy);
  });
});
