import { toRouteTemplate } from './events';

/**
 * `toRouteTemplate` keeps ids out of analytics event names and Sentry
 * transaction names. Without it every product id becomes its own series, which
 * makes both dashboards unusable and turns an endpoint label into a record of
 * what the user browsed.
 */
describe('toRouteTemplate', () => {
  it('collapses a numeric path segment to :id', () => {
    expect(toRouteTemplate('/products/1423')).toBe('/products/:id');
  });

  it('collapses every numeric segment', () => {
    expect(toRouteTemplate('/a/1/b/2')).toBe('/a/:id/b/:id');
  });

  it('drops the query string, which can carry a barcode or a search term', () => {
    expect(toRouteTemplate('/products?barcode=7501234567890&name=cafe')).toBe('/products');
  });

  it('leaves non-numeric segments alone, including agency ids', () => {
    expect(toRouteTemplate('/agencies/KMD')).toBe('/agencies/KMD');
  });

  it('leaves a path with no ids unchanged', () => {
    expect(toRouteTemplate('/my-list')).toBe('/my-list');
    expect(toRouteTemplate('/')).toBe('/');
  });

  it('does not treat an alphanumeric segment as an id', () => {
    expect(toRouteTemplate('/products/12ab')).toBe('/products/12ab');
  });
});
