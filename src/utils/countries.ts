export type Continent =
  | 'North America'
  | 'South America'
  | 'Europe'
  | 'Asia'
  | 'Africa'
  | 'Oceania';

export const CONTINENT_ORDER: Continent[] = [
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Africa',
  'Oceania',
];

export const CONTINENT_TRANSLATION_KEYS: Record<Continent, string> = {
  'North America': 'common.continents.northAmerica',
  'South America': 'common.continents.southAmerica',
  Europe: 'common.continents.europe',
  Asia: 'common.continents.asia',
  Africa: 'common.continents.africa',
  Oceania: 'common.continents.oceania',
};

const COUNTRY_CONTINENT: Record<string, Continent> = {
  mexico: 'North America',
  panama: 'North America',
  'united states': 'North America',
  usa: 'North America',
  'united states of america': 'North America',
  canada: 'North America',
  guatemala: 'North America',
  'costa rica': 'North America',
  'el salvador': 'North America',
  honduras: 'North America',
  nicaragua: 'North America',
  'dominican republic': 'North America',
  cuba: 'North America',
  jamaica: 'North America',
  'puerto rico': 'North America',

  argentina: 'South America',
  brazil: 'South America',
  brasil: 'South America',
  chile: 'South America',
  colombia: 'South America',
  peru: 'South America',
  uruguay: 'South America',
  paraguay: 'South America',
  bolivia: 'South America',
  ecuador: 'South America',
  venezuela: 'South America',

  israel: 'Asia',
  'united kingdom': 'Europe',
  uk: 'Europe',
  france: 'Europe',
  germany: 'Europe',
  italy: 'Europe',
  spain: 'Europe',
  'españa': 'Europe',
  netherlands: 'Europe',
  holland: 'Europe',
  belgium: 'Europe',
  switzerland: 'Europe',
  austria: 'Europe',
  poland: 'Europe',
  russia: 'Europe',
  ukraine: 'Europe',
  turkey: 'Europe',
  portugal: 'Europe',
  greece: 'Europe',
  ireland: 'Europe',
  sweden: 'Europe',
  norway: 'Europe',
  finland: 'Europe',
  denmark: 'Europe',
  iceland: 'Europe',
  czechia: 'Europe',
  'czech republic': 'Europe',
  hungary: 'Europe',
  romania: 'Europe',
  bulgaria: 'Europe',
  serbia: 'Europe',
  croatia: 'Europe',
  slovakia: 'Europe',
  slovenia: 'Europe',
  lithuania: 'Europe',
  latvia: 'Europe',
  estonia: 'Europe',

  china: 'Asia',
  japan: 'Asia',
  'south korea': 'Asia',
  korea: 'Asia',
  'north korea': 'Asia',
  india: 'Asia',
  pakistan: 'Asia',
  bangladesh: 'Asia',
  thailand: 'Asia',
  vietnam: 'Asia',
  indonesia: 'Asia',
  malaysia: 'Asia',
  philippines: 'Asia',
  singapore: 'Asia',
  'hong kong': 'Asia',
  taiwan: 'Asia',
  mongolia: 'Asia',
  kazakhstan: 'Asia',
  uzbekistan: 'Asia',
  'saudi arabia': 'Asia',
  'united arab emirates': 'Asia',
  uae: 'Asia',
  iran: 'Asia',
  iraq: 'Asia',
  lebanon: 'Asia',
  syria: 'Asia',
  jordan: 'Asia',
  egypt: 'Asia',
  qatar: 'Asia',
  kuwait: 'Asia',
  oman: 'Asia',
  yemen: 'Asia',
  afghanistan: 'Asia',
  nepal: 'Asia',
  sri: 'Asia',
  'sri lanka': 'Asia',
  cambodia: 'Asia',
  laos: 'Asia',
  myanmar: 'Asia',

  'south africa': 'Africa',
  nigeria: 'Africa',
  kenya: 'Africa',
  ghana: 'Africa',
  ethiopia: 'Africa',
  morocco: 'Africa',
  algeria: 'Africa',
  tunisia: 'Africa',
  libya: 'Africa',
  tanzania: 'Africa',
  uganda: 'Africa',
  zimbabwe: 'Africa',
  zambia: 'Africa',
  senegal: 'Africa',
  cameroon: 'Africa',
  ivory: 'Africa',
  'ivory coast': 'Africa',
  angola: 'Africa',
  mozambique: 'Africa',
  madagascar: 'Africa',

  australia: 'Oceania',
  'new zealand': 'Oceania',
  fiji: 'Oceania',
  'papua new guinea': 'Oceania',
  samoa: 'Oceania',
  tonga: 'Oceania',
};

export function getContinent(label: string | null | undefined): Continent | null {
  if (!label) return null;
  const key = label.trim().toLowerCase();
  if (key in COUNTRY_CONTINENT) {
    return COUNTRY_CONTINENT[key];
  }
  for (const [name, continent] of Object.entries(COUNTRY_CONTINENT)) {
    if (key.includes(name) || name.includes(key)) {
      return continent;
    }
  }
  return null;
}

export interface CountryOption {
  id: number;
  label: string;
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
    const continent = getContinent(country.label);
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
