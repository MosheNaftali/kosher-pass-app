import { type Href, useSegments } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AdBanner, isAdBannerAvailable } from './ad-banner';
import { OfflineBanner } from './offline-banner';
import { ThemedText } from './themed-text';

import { Layout, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TopInsetProvider } from '@/hooks/use-top-inset';

interface TabKey {
  name: string;
  href: Href;
  translationKey: string;
  icon: SFSymbol;
  isScan?: boolean;
}

// Discover is hidden for the time being - its search and featured products
// overlap with the Products catalogue. Flip this to `true` to restore the tab;
// the screen itself still lives at `src/app/discover.tsx`, and
// `src/app/index.tsx` redirects to the first tab while it is off.
//
// Note when restoring it: the elevated Scan button only sits in the middle of
// the bar when the same number of tabs flanks it. Bringing Discover back makes
// six entries and pushes it off centre again - drop another tab (or move one
// into a screen header) at the same time.
const DISCOVER_ENABLED = false;

function useTabConfig() {
  const { t } = useTranslation();

  const tabKeys: TabKey[] = [
    ...(DISCOVER_ENABLED
      ? [
        {
          name: 'discover',
          href: '/discover',
          translationKey: 'tabs.discover',
          icon: 'sparkles',
        } as TabKey,
      ]
      : []),
    { name: 'alerts', href: '/alerts', translationKey: 'tabs.alerts', icon: 'bell' },
    { name: 'products', href: '/products', translationKey: 'tabs.products', icon: 'cube.box' },
    { name: 'scan', href: '/scan', translationKey: 'tabs.scan', icon: 'barcode.viewfinder', isScan: true },
    { name: 'my-list', href: '/my-list', translationKey: 'tabs.myList', icon: 'cart' },
    { name: 'agencies', href: '/agencies', translationKey: 'tabs.agencies', icon: 'building.2' },
  ];

  return tabKeys.map(tab => ({ ...tab, label: t(tab.translationKey) }));
}

export default function AppTabs() {
  const tabs = useTabConfig();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  // The adaptive banner sizes itself to the device, so its height is measured
  // rather than assumed; until the first measurement lands, the reserved
  // minimum stands in.
  const [adHeight, setAdHeight] = useState(insets.top + Layout.adBannerHeight);
  // The camera UI on /scan owns the full screen - no ad banner there.
  // `isAdBannerAvailable` is resolved from build-time config, so a build with
  // AdMob unconfigured never reserves the slot at all (see .env.example).
  const showAdBanner = isAdBannerAvailable && segments[0] !== 'scan';

  // The banner sits above the screen instead of on top of it, so while it is up
  // it owns the safe area and screens must not pad for it a second time.
  const contentTopInset = showAdBanner ? 0 : insets.top;
  const contentTop = showAdBanner ? adHeight : insets.top;

  return (
    <TopInsetProvider contentTopInset={contentTopInset} contentTop={contentTop}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        {/* {showAdBanner ? <AdBanner onHeightChange={setAdHeight} /> : null} */}
        <View style={styles.body}>
          <Tabs>
            <TabSlot />
            <TabList
              style={[
                styles.tabList,
                { backgroundColor: theme.surface, borderTopColor: theme.borderSubtle },
              ]}>
              {tabs.map(tab =>
                tab.isScan ? (
                  <ScanTabTrigger key={tab.name} tab={tab} />
                ) : (
                  <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
                    <TabButton icon={tab.icon} label={tab.label} />
                  </TabTrigger>
                )
              )}
            </TabList>
          </Tabs>
        </View>
        {/*
          Lives here rather than in the root layout so it can float *below* the
          banner: an app-owned overlay covering an ad is an AdMob violation.
        */}
        <OfflineBanner />
      </View>
    </TopInsetProvider>
  );
}

function TabButton({
  isFocused,
  icon,
  label,
  ...props
}: TabTriggerSlotProps & { icon: SFSymbol; label: string }) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { stiffness: 400, damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 15 });
  };

  return (
    <Pressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: Boolean(isFocused) }}
      accessibilityLabel={label}
      style={styles.tabButton}>
      <Animated.View
        style={[
          styles.tabButtonInner,
          {
            transform: [{ scale }],
          },
        ]}>
        <SymbolView
          name={icon}
          tintColor={isFocused ? theme.accent : theme.textMuted}
          size={22}
          weight={isFocused ? 'semibold' : 'regular'}
        />
        <ThemedText
          type="caption"
          themeColor={isFocused ? 'accent' : 'textMuted'}
          style={styles.tabLabel}>
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

interface TabConfig {
  name: string;
  href: Href;
  label: string;
  icon: SFSymbol;
  isScan?: boolean;
}

function ScanTabTrigger({ tab }: { tab: TabConfig }) {
  const theme = useTheme();

  return (
    <TabTrigger name={tab.name} href={tab.href} asChild>
      <Pressable
        style={styles.scanButtonContainer}
        accessibilityRole="tab"
        accessibilityLabel={tab.label}>
        <View style={[styles.scanButton, { backgroundColor: theme.accent }, Shadows.md]}>
          <SymbolView
            name={tab.icon}
            tintColor={theme.primaryForeground}
            size={28}
            weight="semibold"
          />
        </View>
      </Pressable>
    </TabTrigger>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // Takes the space left over by the ad banner above it, so the tab bar it
  // anchors still sits at the bottom of the window.
  body: {
    flex: 1,
  },
  tabList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonInner: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  tabLabel: {
    fontSize: 10,
  },
  scanButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // marginTop: -28,
  },
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: Radius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
