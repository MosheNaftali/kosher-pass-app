import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { usePersistedCountryIds } from './use-persisted-country-filter';

/**
 * The country filter is read back from storage written by an older build, so
 * these tests cover the validation boundary: a malformed payload must be
 * dropped, never cast into the request's `countryId` params.
 */

const COUNTRY_FILTER_KEY = '@kosher-pass:product_country_filter';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('persisted product country filter', () => {
  it('restores a stored selection once hydrated', async () => {
    await AsyncStorage.setItem(COUNTRY_FILTER_KEY, JSON.stringify([3, 7]));

    const { result } = await renderHook(() => usePersistedCountryIds());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect([...result.current.selectedCountryIds].sort((a, b) => a - b)).toEqual([3, 7]);
  });

  it('drops a payload that is not a list of integers', async () => {
    await AsyncStorage.setItem(COUNTRY_FILTER_KEY, JSON.stringify([1, 'two', null]));

    const { result } = await renderHook(() => usePersistedCountryIds());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.selectedCountryIds.size).toBe(0);
  });

  it('survives corrupt JSON without throwing', async () => {
    await AsyncStorage.setItem(COUNTRY_FILTER_KEY, '{not json');

    const { result } = await renderHook(() => usePersistedCountryIds());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    expect(result.current.selectedCountryIds.size).toBe(0);
  });

  it('writes the selection back after hydration', async () => {
    const { result } = await renderHook(() => usePersistedCountryIds());
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    await act(async () => {
      result.current.setSelectedCountryIds(new Set([5]));
    });

    await waitFor(async () => {
      expect(await AsyncStorage.getItem(COUNTRY_FILTER_KEY)).toBe(JSON.stringify([5]));
    });
  });
});
