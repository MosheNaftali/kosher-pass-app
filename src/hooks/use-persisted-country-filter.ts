import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

const COUNTRY_FILTER_KEY = '@kosher-pass:product_country_filter';

export interface PersistedCountryFilter {
  selectedCountryIds: Set<number>;
  setSelectedCountryIds: Dispatch<SetStateAction<Set<number>>>;
  isHydrated: boolean;
}

/**
 * Narrows a value parsed out of AsyncStorage into a list of country ids.
 *
 * The filter is read back from storage written by an older build, so a
 * hand-edited or partially written entry can carry anything. Casting it into a
 * `Set` would put non-numeric ids into the request's `countryId` params, so
 * anything that does not validate is dropped instead.
 */
function isCountryIdList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(id => typeof id === 'number' && Number.isInteger(id))
  );
}

/**
 * The product country filter, persisted to device storage.
 *
 * `isHydrated` stays `false` until the stored value has been read, so a caller
 * can hold back the filtered query instead of firing one with an empty filter
 * and then re-fetching once the stored selection lands.
 */
export function usePersistedCountryIds(): PersistedCountryFilter {
  const [selectedCountryIds, setSelectedCountryIds] = useState<Set<number>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const json = await AsyncStorage.getItem(COUNTRY_FILTER_KEY);
        if (json) {
          const parsed: unknown = JSON.parse(json);
          if (isCountryIdList(parsed)) {
            setSelectedCountryIds(new Set(parsed));
          }
        }
      } catch (error) {
        console.error('Failed to load the product country filter', error);
      } finally {
        setIsHydrated(true);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(COUNTRY_FILTER_KEY, JSON.stringify([...selectedCountryIds])).catch(
      error => {
        console.error('Failed to save the product country filter', error);
      }
    );
  }, [selectedCountryIds, isHydrated]);

  return { selectedCountryIds, setSelectedCountryIds, isHydrated };
}
