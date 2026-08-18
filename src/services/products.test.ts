import { buildProductsQuery } from './products';

/**
 * `buildProductsQuery` is the contract with the API's `FindAllProductsDto`.
 * These assertions are what stop the barcode scanner regressing to the bug it
 * shipped with, where a scanned code was sent as `?name=` and matched against
 * the product name columns - which never contain it.
 */
describe('buildProductsQuery', () => {
  it('returns an empty string when there is nothing to filter', () => {
    expect(buildProductsQuery({})).toBe('');
  });

  it('omits page 1, which is the server default', () => {
    expect(buildProductsQuery({ page: 1 })).toBe('');
    expect(buildProductsQuery({ page: 2 })).toBe('?page=2');
  });

  it('sends a scanned code as `barcode`, never as `name`', () => {
    const query = buildProductsQuery({ barcode: '7501234567890' });

    expect(query).toContain('barcode=7501234567890');
    expect(query).not.toContain('name=');
  });

  it('repeats array parameters instead of joining them', () => {
    // The DTO uses `toArraySingle`, so each value must arrive as its own
    // occurrence - a comma-joined string would be parsed as one id.
    const query = buildProductsQuery({ countryId: [1, 2], agencyId: ['KMD', 'KP'] });

    expect(query).toContain('countryId=1');
    expect(query).toContain('countryId=2');
    expect(query).toContain('agencyId=KMD');
    expect(query).toContain('agencyId=KP');
  });

  it('serializes explicit ids for the shopping list lookup', () => {
    const query = buildProductsQuery({ ids: [10, 20, 30] });

    expect(query).toContain('ids=10');
    expect(query).toContain('ids=20');
    expect(query).toContain('ids=30');
  });

  it('trims and url-encodes a search term', () => {
    const query = buildProductsQuery({ name: '  café & co  ' });

    // `URLSearchParams` uses application/x-www-form-urlencoded, so a space is
    // `+` rather than `%20`. Both decode identically server-side; asserting the
    // decoded value keeps this test about the contract, not the encoding.
    const name = new URLSearchParams(query.slice(1)).get('name');
    expect(name).toBe('café & co');
  });

  it('drops a whitespace-only search term rather than filtering on it', () => {
    expect(buildProductsQuery({ name: '   ' })).toBe('');
    expect(buildProductsQuery({ barcode: '   ' })).toBe('');
  });

  it('omits empty arrays so they never degrade into an unfiltered listing', () => {
    expect(buildProductsQuery({ ids: [], countryId: [], agencyId: [] })).toBe('');
  });
});
