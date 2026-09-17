import { Redirect } from 'expo-router';

/**
 * The entry route for the bare `/` URL. The headless tab navigator registers
 * only the routes its `TabTrigger`s point at, and `/` is not one of them, so
 * without a route here a cold start (or a bare `kosherpass://` deep link)
 * lands on Expo Router's "Unmatched Route" screen. It hands off to the landing
 * tab; the initial screen itself is pinned by the anchor in `_layout.tsx`.
 */
export default function Index() {
  return <Redirect href="/products" />;
}
