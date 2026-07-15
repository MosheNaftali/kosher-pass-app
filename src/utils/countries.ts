export type Continent =
  | 'north_america'
  | 'central_america'
  | 'south_america'
  | 'europe'
  | 'asia'
  | 'africa'
  | 'oceania';

export const CONTINENT_ORDER: Continent[] = [
  'north_america',
  'central_america',
  'south_america',
  'europe',
  'asia',
  'africa',
  'oceania',
];

export const CONTINENT_TRANSLATION_KEYS: Record<Continent, string> = {
  'north_america': 'common.continents.northAmerica',
  'central_america': 'common.continents.centralAmerica',
  'south_america': 'common.continents.southAmerica',
  'europe': 'common.continents.europe',
  'asia': 'common.continents.asia',
  'africa': 'common.continents.africa',
  'oceania': 'common.continents.oceania',
};

export interface CountryOption {
  id: number;
  label: string;
  continent: Continent;
}

export interface ContinentGroup {
  continent: Continent;
  countries: CountryOption[];
}

export function groupCountriesByContinent(
  countries: CountryOption[]
): ContinentGroup[] {
  const buckets = new Map<Continent, CountryOption[]>();
  for (const country of countries) {
    const continent = country.continent;
    if (!continent) continue;
    if (!buckets.has(continent)) buckets.set(continent, []);
    buckets.get(continent)!.push(country);
  }
  return CONTINENT_ORDER.filter((c) => buckets.has(c)).map((continent) => ({
    continent,
    countries: buckets
      .get(continent)!
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label)),
  }));
}
