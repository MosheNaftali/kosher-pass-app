import type { Agency } from '@/services/agencies';

/**
 * A country bucket for the agencies directory.
 *
 * `key` is the lower-cased ISO 3166-1 alpha-2 code, or `''` for agencies whose
 * country is missing. `title` is already resolved to the active locale by the
 * caller - this module never touches i18n so it stays pure and testable.
 */
export interface AgencyCountrySection {
  key: string;
  title: string;
  data: Agency[];
}

/** Locale-aware, case- and accent-insensitive comparison. */
function compareLabels(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/**
 * Groups agencies by country for a `SectionList`.
 *
 * Countries are ordered by their *translated* name, not by their ISO code, so
 * the list reads alphabetically in whichever language the user is running -
 * "Estados Unidos" belongs under E in Spanish even though its code is `us`.
 * Agencies are ordered by name inside each country.
 *
 * Rows with no country are a data gap rather than a place, so they collapse
 * into a single trailing bucket instead of sorting under an empty title.
 */
export function groupAgenciesByCountry(
  agencies: Agency[],
  getCountryLabel: (code: string | null) => string
): AgencyCountrySection[] {
  const buckets = new Map<string, Agency[]>();

  for (const agency of agencies) {
    const key = agency.country?.code?.toLowerCase() ?? '';
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(agency);
    } else {
      buckets.set(key, [agency]);
    }
  }

  return Array.from(buckets, ([key, data]) => ({
    key,
    title: getCountryLabel(key === '' ? null : key),
    data: data.slice().sort((a, b) => compareLabels(a.name, b.name)),
  })).sort((a, b) => {
    if (a.key === b.key) return 0;
    if (a.key === '') return 1;
    if (b.key === '') return -1;
    return compareLabels(a.title, b.title);
  });
}
