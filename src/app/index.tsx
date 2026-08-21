import { Redirect } from 'expo-router';

/**
 * The Discover tab is hidden for now (see `DISCOVER_ENABLED` in
 * `src/components/app-tabs.tsx`), so the app's entry route hands off to Alerts -
 * the first tab - instead of rendering a screen with no tab behind it.
 *
 * To bring Discover back: flip `DISCOVER_ENABLED` to `true` and delete this
 * file, renaming `src/app/discover.tsx` back to `src/app/index.tsx`.
 */
export default function Index() {
  return <Redirect href="/alerts" />;
}
