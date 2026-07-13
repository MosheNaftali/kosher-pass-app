import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { I18nextProvider } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { SavedItemsProvider } from '@/hooks/use-saved-items';
import i18n from '@/i18n';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SavedItemsProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <AppTabs />
          </SafeAreaView>
        </SavedItemsProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
