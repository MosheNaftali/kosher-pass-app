import type { ZodType } from 'zod';

import { Config } from '@/constants/config';
import { captureError, toRouteTemplate, track } from '@/services/telemetry';

/** Requests are aborted after this long so a hung socket cannot pin a spinner forever. */
const DEFAULT_TIMEOUT_MS = 15_000;

export const API_BASE_URL: string = Config.apiUrl;

export interface ApiError extends Error {
  status: number;
  data: unknown;
}

export interface ApiRequestOptions {
  /** Caller-owned signal, used to cancel a request that is no longer needed. */
  signal?: AbortSignal;
  /** Overrides {@link DEFAULT_TIMEOUT_MS} for a single request. */
  timeoutMs?: number;
}

/**
 * Thrown when a request is aborted - either because it exceeded its timeout or
 * because the caller cancelled it (a newer search superseded it, the screen
 * unmounted). Callers should swallow these instead of surfacing an error state,
 * which is what {@link isAbortError} is for.
 */
export class ApiAbortError extends Error {
  readonly timedOut: boolean;

  constructor(timedOut: boolean) {
    super(timedOut ? 'API request timed out' : 'API request was cancelled');
    this.name = 'ApiAbortError';
    this.timedOut = timedOut;
  }
}

/**
 * Thrown when a response is well-formed JSON but does not match the schema the
 * app expects.
 *
 * This is a contract violation, not a network problem: the server changed, a
 * proxy rewrote the body, or the data is corrupt. It is reported to Sentry with
 * the failing field paths (never the values - those may contain catalog data),
 * because it means every user on this build is seeing the same breakage.
 */
export class ApiSchemaError extends Error {
  readonly endpoint: string;
  readonly issues: string[];

  constructor(endpoint: string, issues: string[]) {
    super(`API response did not match the expected shape for ${endpoint}`);
    this.name = 'ApiSchemaError';
    this.endpoint = endpoint;
    this.issues = issues;
  }
}

/**
 * Records a failed request as an analytics event.
 *
 * The path is collapsed to a route template and the query string dropped, so a
 * scanned barcode or a typed search term never reaches the analytics backend
 * and product ids do not explode the event's cardinality.
 */
function reportApiFailure(path: string, status: number | undefined, timedOut: boolean): void {
  track('api_error', {
    endpoint: toRouteTemplate(path),
    status,
    timed_out: timedOut,
  });
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof ApiAbortError ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

/**
 * Performs a GET and validates the response against `schema`.
 *
 * The schema is mandatory: it is what turns an untrusted payload into a typed
 * value, and it is the reason the app cannot render a kashrut verdict built on
 * a malformed response. The return type is inferred from the schema, so there
 * is no cast anywhere in the data path.
 */
export async function apiGet<T>(
  path: string,
  schema: ZodType<T>,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  // The caller's signal and the timeout both need to abort the same request.
  // `AbortSignal.any` is not available on every Hermes build, so the two are
  // funnelled into one controller by hand.
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', onExternalAbort);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(
        `API request failed: ${response.status} ${response.statusText}`
      ) as ApiError;
      error.status = response.status;
      try {
        error.data = await response.json();
      } catch {
        error.data = null;
      }
      throw error;
    }

    const payload: unknown = await response.json();
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      // Only the field paths are collected - never the values, which may carry
      // catalog data or a scanned code.
      const issues = parsed.error.issues.map(
        issue => `${issue.path.join('.') || '<root>'}: ${issue.code}`
      );
      const endpoint = toRouteTemplate(path);
      const schemaError = new ApiSchemaError(endpoint, issues);
      captureError(schemaError, { endpoint, issues: issues.join('; ') });
      throw schemaError;
    }

    return parsed.data;
  } catch (error) {
    if (controller.signal.aborted) {
      const abortError = new ApiAbortError(timedOut);
      // A user-cancelled request is normal control flow and not worth an event;
      // a timeout is a real symptom of a slow or unreachable API.
      if (timedOut) {
        reportApiFailure(path, undefined, true);
      }
      throw abortError;
    }
    // A schema failure was already reported to Sentry with its field paths;
    // re-emitting it as `api_error` (status undefined, no timeout) would be
    // indistinguishable from a network failure in the dashboard.
    if (!(error instanceof ApiSchemaError)) {
      reportApiFailure(path, (error as { status?: number }).status, false);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

/**
 * Turns a media path from the API into an absolute, renderable URL.
 *
 * The value is server-controlled but not trusted: only `http(s)` survives, so a
 * `javascript:` or custom-scheme value stored in the database cannot reach an
 * `<Image>` source or a browser. Relative paths are resolved against
 * {@link API_BASE_URL}. Returns `null` when there is nothing safe to render, so
 * callers fall through to their placeholder.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Relative path - always safe, it can only ever point at our own API.
  if (trimmed.startsWith('/')) {
    return `${API_BASE_URL}${trimmed}`;
  }

  return isSafeExternalUrl(trimmed) ? trimmed : null;
}

/**
 * Whether a server-supplied URL is safe to hand to the browser or an image
 * loader. Anything that is not `http:`/`https:` - `javascript:`, `data:`, a
 * custom app scheme - is rejected.
 */
export function isSafeExternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol } = new URL(url.trim());
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}
