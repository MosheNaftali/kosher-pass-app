import { Stack } from 'expo-router';

/**
 * About lives inside the Alerts tab rather than at the root because the root
 * layout is a headless `Tabs` navigator: it only renders routes declared by a
 * `TabTrigger`, and a tab is not a stack, so a screen pushed there has no
 * `GO_BACK` to pop. Nesting it here is the same pattern `products/[id]` and
 * `agencies/[id]` use, and gives About a real push/back with the tab bar and
 * the ad banner still in place - which is what its layout already assumes.
 */
export default function AlertsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="about"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
