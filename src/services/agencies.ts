import { apiGet, type ApiRequestOptions } from './api';
import {
  agencySchema,
  paginatedAgenciesSchema,
  type Agency,
  type PaginatedAgencies,
} from './schemas';

export type { Agency, PaginatedAgencies };

export interface AgencyFilters {
  page?: number;
  name?: string;
  countryId?: number[];
  /** Explicit id resolution, bypassing pagination. See {@link getAgenciesByIds}. */
  ids?: string[];
}

export function buildAgenciesQuery(filters: AgencyFilters): string {
  const params = new URLSearchParams();

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }
  if (filters.name?.trim()) {
    params.set('name', filters.name.trim());
  }
  if (filters.countryId?.length) {
    for (const id of filters.countryId) {
      params.append('countryId', String(id));
    }
  }
  if (filters.ids?.length) {
    for (const id of filters.ids) {
      params.append('ids', id);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getAgencies(
  filters: AgencyFilters = {},
  options?: ApiRequestOptions
): Promise<PaginatedAgencies> {
  return apiGet('/agencies' + buildAgenciesQuery(filters), paginatedAgenciesSchema, options);
}

/**
 * Resolves saved favourite agencies by id, in one round trip.
 *
 * Favourites can point anywhere in the directory, so filtering the first page
 * client-side would silently hide any favourite outside it - the same bug the
 * shopping list had.
 */
export async function getAgenciesByIds(
  ids: string[],
  options?: ApiRequestOptions
): Promise<Agency[]> {
  if (ids.length === 0) return [];
  const response = await getAgencies({ ids }, options);
  return response.data;
}

export async function getAgencyById(
  id: string,
  options?: ApiRequestOptions
): Promise<Agency | null> {
  try {
    return await apiGet(`/agencies/${encodeURIComponent(id)}`, agencySchema, options);
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}
