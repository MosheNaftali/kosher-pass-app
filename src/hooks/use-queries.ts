import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  getAgencies,
  getAgenciesByIds,
  getAgencyById,
  type Agency,
  type AgencyFilters,
  type PaginatedAgencies,
} from '@/services/agencies';
import {
  getCertificates,
  type Certificate,
  type CertificateFilters,
} from '@/services/certificates';
import { getCountriesWithAgencies, type CountryWithAgencies } from '@/services/countries';
import {
  getProductById,
  getProducts,
  getProductsByIds,
  type PaginatedProducts,
  type Product,
  type ProductFilters,
} from '@/services/products';
import { queryKeys } from '@/services/query-client';

/**
 * Data hooks.
 *
 * Screens use these instead of `useState` + `useEffect` + a hand-rolled
 * loading/error/refreshing triple. React Query owns cancellation (it passes an
 * `AbortSignal` into every query function), deduplication, retry, background
 * refetch and the persisted offline cache.
 *
 * Every query function forwards React Query's `signal` to the service layer, so
 * a superseded search or an unmounted screen still aborts its request.
 */

/** Shared page-param logic for the `{ data, total, page, lastPage }` envelope. */
function nextPageParam(lastPage: { page: number; lastPage: number }): number | undefined {
  return lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined;
}

export function useProductsQuery(filters: ProductFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.products(filters as Record<string, unknown>),
    queryFn: ({ pageParam, signal }) =>
      getProducts({ ...filters, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedProducts) => nextPageParam(lastPage),
  });
}

/** Flattens a paginated result into the single list a FlatList wants. */
export function flattenProductPages(pages: PaginatedProducts[] | undefined): Product[] {
  return pages?.flatMap(page => page.data) ?? [];
}

export function flattenAgencyPages(pages: PaginatedAgencies[] | undefined): Agency[] {
  return pages?.flatMap(page => page.data) ?? [];
}

export function useProductQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: ({ signal }) => getProductById(id, { signal }),
    enabled: Number.isInteger(id),
  });
}

export function useProductsByIdsQuery(ids: number[]) {
  return useQuery({
    queryKey: queryKeys.productsByIds(ids),
    queryFn: ({ signal }) => getProductsByIds(ids, { signal }),
    initialData: ids.length === 0 ? ([] as Product[]) : undefined,
  });
}

export function useAgenciesQuery(filters: AgencyFilters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.agencies(filters as Record<string, unknown>),
    queryFn: ({ pageParam, signal }) =>
      getAgencies({ ...filters, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedAgencies) => nextPageParam(lastPage),
  });
}

/**
 * Resolves saved favourites by id.
 *
 * Kept separate from {@link useAgenciesQuery}: favourites can point anywhere in
 * the directory, so filtering a page of the listing would hide any favourite
 * outside it.
 */
export function useFavoriteAgenciesQuery(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.agenciesByIds(ids),
    queryFn: ({ signal }) => getAgenciesByIds(ids, { signal }),
    initialData: ids.length === 0 ? ([] as Agency[]) : undefined,
  });
}

export function useAgencyQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.agency(id),
    queryFn: ({ signal }) => getAgencyById(id, { signal }),
    enabled: id.length > 0,
  });
}

/**
 * Certificates matching a filter, flattened out of the paginated envelope.
 *
 * Used by the alerts feed with `status: 'revoked'` / `'expired'`, so the
 * server does the filtering instead of the app downloading every certificate
 * in the system to search it client-side.
 */
export function useCertificatesQuery(filters: CertificateFilters = {}) {
  return useQuery({
    queryKey: queryKeys.certificatesByFilters(filters as Record<string, unknown>),
    queryFn: ({ signal }) => getCertificates(filters, { signal }),
    select: response => response.data,
  });
}

export function useAgencyCertificatesQuery(agencyId: string) {
  return useQuery({
    queryKey: queryKeys.certificates(agencyId),
    queryFn: ({ signal }) => getCertificates({ agencyId: [agencyId] }, { signal }),
    enabled: agencyId.length > 0,
    select: response => response.data,
  });
}

export function useCountriesQuery() {
  return useQuery({
    queryKey: queryKeys.countries(),
    queryFn: ({ signal }) => getCountriesWithAgencies({ signal }),
    // Countries and their agencies change on the order of weeks, not minutes.
    staleTime: 60 * 60 * 1000,
  });
}

export type { Agency, Certificate, CountryWithAgencies, Product };
