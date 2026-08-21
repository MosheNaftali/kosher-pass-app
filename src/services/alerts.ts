import { z } from 'zod';

import { apiGet, type ApiRequestOptions } from './api';
import { alertSchema, type AgencyAlert } from './schemas';

export type { AgencyAlert };

/**
 * Builds the `?agencyId=…&agencyId=…` filter, repeating the param per agency
 * the way `buildCertificatesQuery` does.
 *
 * An empty list produces no filter at all, which the api reads as "every
 * agency". That is never what the Alerts tab wants, so `useAlertsQuery` does
 * not run the query for a user who follows nobody - see the note there.
 */
export function buildAlertsQuery(agencyIds: string[]): string {
  const params = new URLSearchParams();
  for (const id of agencyIds) {
    params.append('agencyId', id);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * The alerts published by the given agencies, plus any service-wide
 * announcement that belongs to no agency.
 *
 * These are scraped by the backend from each agency's own notices channel, not
 * inferred from the catalog: an alert exists because a supervisor published
 * it.
 */
export async function getAlerts(
  agencyIds: string[],
  options?: ApiRequestOptions
): Promise<AgencyAlert[]> {
  return apiGet('/alerts' + buildAlertsQuery(agencyIds), z.array(alertSchema), options);
}
