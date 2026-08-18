import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

import { APP_VERSION } from '@/constants/config';
import { ApiAbortError, ApiSchemaError } from '@/services/api';

/**
 * Server-state cache.
 *
 * This app is used inside a supermarket - the place where connectivity is
 * worst. A cache that survives a cold start is not an optimization here, it is
 * the difference between a usable app and an empty one, so the cache is
 * persisted to AsyncStorage and rehydrated on launch.
 *
 * It also removes the duplicated loading/error/refreshing state machine that
 * every screen was hand-rolling, and deduplicates concurrent requests for the
 * same key across unrelated components.
 */

/** How long a cached response is served without a background refetch. */
const STALE_TIME_MS = 5 * 60 * 1000; // 5 min

/** How long an unused entry stays in the cache before eviction. */
const GC_TIME_MS = 24 * 60 * 60 * 1000; // 24 h

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      // Cached data is shown immediately while a refetch runs, so returning to
      // a screen never shows a spinner over content that is already known.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // A cancelled request and a contract violation are both permanent -
        // retrying a schema mismatch just multiplies the Sentry noise.
        if (error instanceof ApiAbortError || error instanceof ApiSchemaError) {
          return false;
        }
        // 4xx means the request itself is wrong; only server and network
        // failures are worth another attempt.
        const status = (error as { status?: number }).status;
        if (typeof status === 'number' && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < MAX_RETRIES;
      },
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'kosher-pass:query-cache',
  // Writing the whole cache on every mutation would thrash AsyncStorage on a
  // list screen; batching absorbs the bursts.
  throttleTime: 2000,
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: GC_TIME_MS,
  // Bumping the app version invalidates the persisted cache. Without this, a
  // build that changed a response shape would rehydrate data the new schemas
  // reject, and every screen would open on an error until the cache expired.
  buster: APP_VERSION,
  dehydrateOptions: {
    // Only successful results are worth persisting; a failed query should be
    // retried on next launch, not restored as a cached error.
    shouldDehydrateQuery: query => query.state.status === 'success',
  },
};

/**
 * Query keys.
 *
 * Centralised so invalidation cannot drift from the keys actually in use - a
 * typo'd inline key is a cache entry nothing can ever invalidate.
 */
export const queryKeys = {
  products: (filters: Record<string, unknown>) => ['products', filters] as const,
  product: (id: number) => ['product', id] as const,
  productsByIds: (ids: number[]) => ['products-by-ids', [...ids].sort((a, b) => a - b)] as const,
  agencies: (filters: Record<string, unknown>) => ['agencies', filters] as const,
  agenciesByIds: (ids: string[]) => ['agencies-by-ids', [...ids].sort()] as const,
  agency: (id: string) => ['agency', id] as const,
  countries: () => ['countries'] as const,
  certificates: (agencyId: string) => ['certificates', agencyId] as const,
  certificatesByFilters: (filters: Record<string, unknown>) =>
    ['certificates-filtered', filters] as const,
} as const;
