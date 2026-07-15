import { apiGet } from './api';
import type { Agency } from './agencies';

export interface CountryWithAgencies {
  id: number;
  label: string;
  continent: string;
  agencies: Pick<Agency, 'id' | 'name'>[];
}

export async function getCountriesWithAgencies(): Promise<CountryWithAgencies[]> {
  return apiGet<CountryWithAgencies[]>('/countries');
}
