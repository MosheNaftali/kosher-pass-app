import { apiGet, type ApiRequestOptions } from './api';
import { countryWithAgenciesListSchema, type CountryWithAgencies } from './schemas';

export type { CountryWithAgencies };

export async function getCountriesWithAgencies(
  options?: ApiRequestOptions
): Promise<CountryWithAgencies[]> {
  return apiGet('/countries', countryWithAgenciesListSchema, options);
}
