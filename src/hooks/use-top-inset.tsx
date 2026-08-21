import { createContext, useContext, type ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Where the top of a screen actually starts.
 *
 * The AdMob banner is anchored above every screen and is laid out *in flow*, so
 * while it is on it already covers the status bar area and pushes the screen
 * down. A screen that also applied `insets.top` would be padded twice, and one
 * that applied nothing would slide under the notch whenever the banner is off.
 *
 * `AppTabs` publishes the resolved numbers here so screens stay agnostic about
 * whether ads are on, off, or hidden for the current route.
 */
export interface TopInset {
  /**
   * Padding a screen must apply itself. `0` while the banner is mounted - the
   * banner has already consumed the safe area above the screen.
   */
  contentTopInset: number;
  /**
   * Distance from the top of the window to the first pixel of screen content.
   * For chrome that floats *over* a screen (the offline banner) instead of
   * being laid out inside it.
   */
  contentTop: number;
}

const TopInsetContext = createContext<TopInset | null>(null);

export interface TopInsetProviderProps extends TopInset {
  children: ReactNode;
}

export function TopInsetProvider({ contentTopInset, contentTop, children }: TopInsetProviderProps) {
  return (
    <TopInsetContext.Provider value={{ contentTopInset, contentTop }}>
      {children}
    </TopInsetContext.Provider>
  );
}

export function useTopInset(): TopInset {
  const insets = useSafeAreaInsets();
  const value = useContext(TopInsetContext);

  // No provider means nothing is stacked above us (a test, or a screen rendered
  // outside the tab shell), so the plain safe-area inset is the right answer.
  return value ?? { contentTopInset: insets.top, contentTop: insets.top };
}
