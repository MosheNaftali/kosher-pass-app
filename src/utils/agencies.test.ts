import { groupAgenciesByCountry } from './agencies';

import type { Agency } from '@/services/agencies';

const LABELS: Record<string, string> = {
  us: 'Estados Unidos',
  mx: 'México',
  pa: 'Panamá',
};

function label(code: string | null): string {
  if (!code) return 'Otros';
  return LABELS[code] ?? code.toUpperCase();
}

function agency(name: string, code: string | null, countryId = 1): Agency {
  return {
    id: `${name}-${code ?? 'none'}`,
    name,
    country: code === null ? null : { id: countryId, code },
    websiteUrl: null,
    logoUrl: null,
    contactInfo: null,
    active: true,
    metadata: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('groupAgenciesByCountry', () => {
  it('orders countries by their translated name, not by the ISO code', () => {
    const sections = groupAgenciesByCountry(
      [agency('A', 'pa'), agency('B', 'mx'), agency('C', 'us')],
      label
    );

    // By code the order would be mx, pa, us - in Spanish it must be E, M, P.
    expect(sections.map(section => section.title)).toEqual([
      'Estados Unidos',
      'México',
      'Panamá',
    ]);
  });

  it('orders agencies by name inside each country', () => {
    const sections = groupAgenciesByCountry(
      [agency('Zeta', 'mx'), agency('alpha', 'mx'), agency('Beta', 'mx')],
      label
    );

    expect(sections).toHaveLength(1);
    expect(sections[0].data.map(item => item.name)).toEqual(['alpha', 'Beta', 'Zeta']);
  });

  it('collapses agencies without a country into a single trailing bucket', () => {
    const sections = groupAgenciesByCountry(
      [
        agency('No country', null),
        agency('Null code', null),
        agency('Known', 'mx'),
      ],
      label
    );

    expect(sections.map(section => section.key)).toEqual(['mx', '']);
    expect(sections[1].data).toHaveLength(2);
    expect(sections[1].title).toBe('Otros');
  });

  it('treats codes as case-insensitive so one country is never split in two', () => {
    const sections = groupAgenciesByCountry([agency('A', 'MX'), agency('B', 'mx')], label);

    expect(sections).toHaveLength(1);
    expect(sections[0].key).toBe('mx');
  });

  it('returns an empty list for an empty input', () => {
    expect(groupAgenciesByCountry([], label)).toEqual([]);
  });
});
