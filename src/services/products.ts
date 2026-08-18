import { API_BASE_URL, apiGet, resolveMediaUrl, type ApiRequestOptions } from './api';
import { captureError } from '@/services/telemetry';

import {
  productSchema,
  resilientProductPage,
  type KashrutLevel,
  type PaginatedProducts,
  type Product,
} from './schemas';

export type { KashrutLevel, PaginatedProducts, Product };

export interface ProductFilters {
  page?: number;
  name?: string;
  /** Exact barcode lookup. The server matches every equivalent GTIN form. */
  barcode?: string;
  category?: string;
  subCategory?: string;
  countryId?: number[];
  agencyId?: string[];
  /** Explicit id resolution, bypassing pagination. See {@link getProductsByIds}. */
  ids?: number[];
}

export function buildProductsQuery(filters: ProductFilters): string {
  const params = new URLSearchParams();

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }
  if (filters.agencyId?.length) {
    for (const id of filters.agencyId) {
      params.append('agencyId', id);
    }
  }
  if (filters.name?.trim()) {
    params.set('name', filters.name.trim());
  }
  if (filters.barcode?.trim()) {
    params.set('barcode', filters.barcode.trim());
  }
  if (filters.category) {
    params.set('category', filters.category);
  }
  if (filters.subCategory) {
    params.set('subCategory', filters.subCategory);
  }
  if (filters.countryId?.length) {
    for (const id of filters.countryId) {
      params.append('countryId', String(id));
    }
  }
  if (filters.ids?.length) {
    for (const id of filters.ids) {
      params.append('ids', String(id));
    }
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Product listings drop individual malformed rows instead of failing the whole
 * page: one corrupt product must not blank the catalog for someone standing in
 * a shop. The drops are reported so a data-quality problem does not hide behind
 * a silently shorter list.
 */
function productPageSchema(endpoint: string) {
  return resilientProductPage(issues => {
    captureError(
      new Error(`Dropped ${issues.length} malformed product row(s) from ${endpoint}`),
      { endpoint, issues: issues.join('; ') }
    );
  });
}

export async function getProducts(
  filters: ProductFilters = {},
  options?: ApiRequestOptions
): Promise<PaginatedProducts> {
  const query = buildProductsQuery(filters);
  return apiGet('/products' + query, productPageSchema('/products'), options);
}

export async function getProductById(
  id: number,
  options?: ApiRequestOptions
): Promise<Product | null> {
  try {
    return await apiGet(`/products/${id}`, productSchema, options);
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Looks a scanned code up against the catalog.
 *
 * The lookup goes through the server's `barcode` filter, which matches every
 * equivalent GTIN form (a UPC-A scan and its EAN-13 row differ by a leading
 * zero). Any row the server returns is already an exact barcode match, so the
 * first one wins - the same physical product can legitimately appear more than
 * once when several agencies certify it.
 */
export async function searchProductByBarcode(
  barcode: string,
  options?: ApiRequestOptions
): Promise<Product | null> {
  const response = await getProducts({ barcode, page: 1 }, options);
  return response.data[0] ?? null;
}

/**
 * Fetches a specific set of products by id, in one round trip.
 *
 * Used by the shopping list, whose ids can point anywhere in the catalog.
 * Resolving them through the paginated listing would silently drop every item
 * outside the first page. Ids that no longer exist are simply absent from the
 * response.
 */
export async function getProductsByIds(
  ids: number[],
  options?: ApiRequestOptions
): Promise<Product[]> {
  if (ids.length === 0) return [];
  const response = await getProducts({ ids }, options);
  return response.data;
}

export { API_BASE_URL, resolveMediaUrl };
