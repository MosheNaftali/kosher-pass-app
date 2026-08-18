// Imported from the schema module rather than `@/services/products`, which
// itself depends on this facade - going through `schemas` keeps the dependency
// graph acyclic instead of relying on the type-only import being erased.
import type { KashrutLevel } from '@/services/schemas';
import type { FreshnessTier } from '@/utils/freshness';

/**
 * The analytics event catalog.
 *
 * Every event the app can emit is declared here as a member of one discriminated
 * union. Nothing calls `track('some_string', {...})` with an ad-hoc name - that
 * is what turns an analytics project into a graveyard of near-duplicate events
 * six months in ("product_view", "productViewed", "view_product"). Adding an
 * event means adding a variant here, and the compiler then enforces its payload
 * at every call site.
 *
 * Conventions:
 *   - `name` is snake_case, past tense, `object_verb`.
 *   - Properties are scalars. No PII, no free-text the user typed - search
 *     terms are recorded as lengths and result counts, never as content, so a
 *     name or address typed into a search box never leaves the device.
 *   - A property that is absent must be `undefined`, not an empty string, so
 *     PostHog does not create a bogus "" bucket in its breakdowns.
 */

/**
 * The only value types an event property may hold.
 *
 * Scalars only, by design: nested objects and arrays are what make an analytics
 * schema drift, and they are the easiest way to smuggle a payload of user data
 * into an event without noticing. Flatten instead - `countries_count: 3`, not
 * `countries: [...]`.
 */
export type TelemetryPropertyValue = string | number | boolean | null | undefined;

export type TelemetryProperties = Record<string, TelemetryPropertyValue>;

/** Where a search or a product view was initiated from. */
export type SearchSource = 'discover' | 'products' | 'scan';

export type AnalyticsEvent =
  // --- Barcode scanning -----------------------------------------------------
  /**
   * A scan (or manual code entry) resolved. `found: false` is the single most
   * valuable signal the app produces: it is a user standing in a shop holding a
   * product the catalog does not know, which is a prioritized list of what to
   * add next.
   */
  | {
      name: 'barcode_scanned';
      properties: {
        found: boolean;
        /** Digit count, used to infer the symbology (EAN-13, UPC-A, EAN-8). */
        barcode_length: number;
        /** Whether the code was typed by hand instead of scanned by the camera. */
        manual_entry: boolean;
      };
    }
  /**
   * Emitted alongside `barcode_scanned` when nothing matched. Carries the code
   * itself - a product barcode is a public identifier, not personal data - so
   * the misses can be exported straight into a catalog backlog.
   */
  | { name: 'barcode_not_found'; properties: { barcode: string; manual_entry: boolean } }
  | { name: 'scan_permission_result'; properties: { granted: boolean } }

  // --- Search & discovery ---------------------------------------------------
  | {
      name: 'search_performed';
      properties: {
        source: SearchSource;
        /** Length only - the term itself is never sent. */
        query_length: number;
        results_count: number;
      };
    }
  /** A search that returned nothing: the second-best catalog gap signal. */
  | { name: 'search_zero_results'; properties: { source: SearchSource; query_length: number } }
  | {
      name: 'filter_applied';
      properties: {
        countries_count: number;
        has_category: boolean;
      };
    }

  // --- Products -------------------------------------------------------------
  | {
      name: 'product_viewed';
      properties: {
        product_id: number;
        kashrut_level: KashrutLevel;
        is_mehadrin: boolean;
        agency_id: string | undefined;
        freshness_tier: FreshnessTier;
      };
    }
  | { name: 'product_added_to_list'; properties: { product_id: number; source: 'detail' } }
  | { name: 'product_removed_from_list'; properties: { product_id: number; source: 'detail' | 'list' } }
  | { name: 'certificate_scan_opened'; properties: { product_id: number } }
  /** A stale/outdated banner was shown - measures how much of the catalog rots. */
  | { name: 'freshness_alert_shown'; properties: { product_id: number; tier: FreshnessTier } }

  // --- Shopping list --------------------------------------------------------
  | { name: 'list_item_purchased'; properties: { product_id: number; purchased: boolean } }
  | { name: 'list_purchased_cleared'; properties: { items_count: number } }

  // --- Agencies -------------------------------------------------------------
  | { name: 'agency_favorited'; properties: { agency_id: string; favorited: boolean } }
  | { name: 'agency_viewed'; properties: { agency_id: string } }

  // --- App-level ------------------------------------------------------------
  | { name: 'locale_changed'; properties: { from: string; to: string } }
  | { name: 'tracking_consent_result'; properties: { granted: boolean } }
  /**
   * An API call failed. Complements Sentry: Sentry tells you a request threw,
   * this tells you how often and to which endpoint across the whole user base.
   */
  | {
      name: 'api_error';
      properties: {
        /** Route template, never the full URL - avoids ids exploding cardinality. */
        endpoint: string;
        status: number | undefined;
        timed_out: boolean;
      };
    };

/** Every event name in the catalog. */
export type AnalyticsEventName = AnalyticsEvent['name'];

/** The payload type for a specific event name. */
export type AnalyticsEventProperties<N extends AnalyticsEventName> = Extract<
  AnalyticsEvent,
  { name: N }
>['properties'];

/**
 * Collapses a request path into a low-cardinality route template.
 *
 * `/products/1423` becomes `/products/:id`. Without this every product id would
 * become its own series in the analytics and error dashboards, which makes both
 * unusable and is a slow way to leak browsing history into an event name.
 */
export function toRouteTemplate(path: string): string {
  const [pathname] = path.split('?');
  return pathname
    .split('/')
    .map(segment => (segment.length > 0 && /^\d+$/.test(segment) ? ':id' : segment))
    .join('/');
}
