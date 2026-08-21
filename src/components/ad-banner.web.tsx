/**
 * Web stub for the top ad banner.
 *
 * `react-native-google-mobile-ads` is a native-only module - importing it into
 * the web bundle breaks the build. `Layout.adBannerHeight` is 0 on web, so the
 * slot is never reserved there and screens keep their own safe-area padding.
 */
export const isAdBannerAvailable = false;

export function AdBanner() {
  return null;
}
