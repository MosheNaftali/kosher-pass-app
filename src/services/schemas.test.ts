import {
  agencySchema,
  certificateSchema,
  kashrutLevelSchema,
  paginatedAgenciesSchema,
  productSchema,
  resilientProductPage,
} from './schemas';

/**
 * These schemas are the app's only runtime guarantee that an API response is
 * what it claims to be. The app's answer is "is this kosher?", so the tests
 * below are as much about what must *fail* as what must pass.
 */

const validAgency = {
  id: 'KMD',
  name: 'Kosher Mexico',
  countryId: { id: 1, code: 'mx' },
  websiteUrl: 'https://example.org',
  logoUrl: '/logos/kmd.png',
  contactInfo: null,
  active: true,
  metadata: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const validProduct = {
  id: 42,
  name: 'Olive oil',
  brand: 'Acme',
  category: 'Grocery',
  subCategory: null,
  barcode: '7501234567890',
  externalId: null,
  kashrutLevel: 'pareve',
  isMehadrin: false,
  countryId: { id: 1, code: 'mx' },
  agencyId: validAgency,
  certificateId: null,
  active: true,
  notes: null,
  imgUrl: '/img/42.png',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('anti-corruption renaming', () => {
  it('renames the entity relation columns to domain names', () => {
    // The server names a relation after its foreign key even though it carries
    // the whole row. Screens must never see `product.agencyId.logoUrl`.
    const parsed = productSchema.parse(validProduct);

    expect(parsed.agency?.name).toBe('Kosher Mexico');
    expect(parsed.country?.code).toBe('mx');
    expect(parsed.certificate).toBeNull();
    expect(parsed).not.toHaveProperty('agencyId');
    expect(parsed).not.toHaveProperty('countryId');
    expect(parsed).not.toHaveProperty('certificateId');
  });

  it('renames the agency country too', () => {
    const parsed = agencySchema.parse(validAgency);

    expect(parsed.country?.code).toBe('mx');
    expect(parsed).not.toHaveProperty('countryId');
  });

  it('keeps certificate.agencyId, which is a genuine foreign key', () => {
    const parsed = certificateSchema.parse({
      id: 1,
      agencyId: 'KMD',
      agency: null,
      certificateCode: null,
      status: 'valid',
      validFrom: null,
      validUntil: null,
      scanUrl: null,
      metadata: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(parsed.agencyId).toBe('KMD');
  });
});

describe('normalization', () => {
  it('collapses absent, null and empty-string into null', () => {
    const parsed = productSchema.parse({ ...validProduct, brand: '', notes: null });

    expect(parsed.brand).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it('strips unknown properties so the server can add fields without breaking the app', () => {
    const parsed = productSchema.parse({ ...validProduct, someFutureField: 'x' });

    expect(parsed).not.toHaveProperty('someFutureField');
  });
});

describe('failure behaviour', () => {
  it('rejects a product missing a required field rather than rendering a guess', () => {
    const { name, ...withoutName } = validProduct;

    expect(productSchema.safeParse(withoutName).success).toBe(false);
  });

  it('rejects an unparseable timestamp, which freshness arithmetic depends on', () => {
    expect(
      productSchema.safeParse({ ...validProduct, updatedAt: 'not-a-date' }).success
    ).toBe(false);
  });

  it('falls back to "unknown" for a kashrut level the app does not recognise', () => {
    // Deliberately lenient: hiding a real product from a shopper is worse than
    // showing it with an unknown level. This is the opposite trade-off from the
    // required fields above, and it is intentional.
    expect(kashrutLevelSchema.parse('some_future_level')).toBe('unknown');
  });

  it('never silently upgrades an unknown level to a permissive one', () => {
    expect(kashrutLevelSchema.parse(null)).toBe('unknown');
    expect(kashrutLevelSchema.parse(123)).toBe('unknown');
  });
});

describe('resilientProductPage', () => {
  it('drops only the malformed rows and reports them', () => {
    const onInvalid = jest.fn();
    const parsed = resilientProductPage(onInvalid).parse({
      data: [validProduct, { id: 'not-a-number' }, { ...validProduct, id: 43 }],
      total: 3,
      page: 1,
      lastPage: 1,
    });

    // One bad row must not blank the catalog for someone standing in a shop.
    expect(parsed.data.map(p => p.id)).toEqual([42, 43]);
    expect(onInvalid).toHaveBeenCalledTimes(1);
  });

  it('does not report when every row is valid', () => {
    const onInvalid = jest.fn();
    resilientProductPage(onInvalid).parse({
      data: [validProduct],
      total: 1,
      page: 1,
      lastPage: 1,
    });

    expect(onInvalid).not.toHaveBeenCalled();
  });
});

describe('paginated envelopes', () => {
  it('parses the shared { data, total, page, lastPage } shape', () => {
    const parsed = paginatedAgenciesSchema.parse({
      data: [validAgency],
      total: 1,
      page: 1,
      lastPage: 1,
    });

    expect(parsed.data[0].name).toBe('Kosher Mexico');
    expect(parsed.lastPage).toBe(1);
  });

  it('rejects a bare array, which is the pre-pagination shape', () => {
    expect(paginatedAgenciesSchema.safeParse([validAgency]).success).toBe(false);
  });
});
