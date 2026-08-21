import { SymbolView } from 'expo-symbols';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Config } from '@/constants/config';
import { Layout, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTopInset } from '@/hooks/use-top-inset';
import { isSafeExternalUrl } from '@/services/api';

// Contact details come from the environment (see .env.example). When a value is
// not configured its row is hidden entirely - shipping a placeholder address
// that silently swallows user feedback is worse than showing nothing.
const DEVELOPER_EMAIL = Config.supportEmail;
const DEVELOPER_WEBSITE = isSafeExternalUrl(Config.developerWebsite)
  ? Config.developerWebsite
  : '';

export default function AboutScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { contentTopInset } = useTopInset();
  const { t } = useTranslation();

  const appVersion =
    Constants.expoConfig?.version ?? '1.0.0';
  const currentYear = new Date().getFullYear();

  function handleEmailPress(subject: string) {
    if (!DEVELOPER_EMAIL) return;
    const url = `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url).catch(() => {
      // Mail client unavailable - silently no-op on web
    });
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: contentTopInset }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={Spacing.three}
          accessibilityRole="button"
          accessibilityLabel={t('common.a11y.goBack')}
          style={styles.backButton}>
          <SymbolView
            name="chevron.left"
            tintColor={theme.text}
            size={28}
            weight="semibold"
          />
        </Pressable>
        <ThemedText type="hero">{t('about.heroTitle')}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <ThemedView type="surface" style={styles.appCard}>
          <ThemedView
            type="surfaceElevated"
            style={styles.appIcon}>
            <SymbolView
              name="checkmark.seal.fill"
              tintColor={theme.accent}
              size={36}
            />
          </ThemedView>

          <View style={styles.appInfo}>
            <ThemedText type="h2">{t('about.appName')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('about.appTagline')}
            </ThemedText>
            <ThemedText type="caption" themeColor="textMuted" style={styles.version}>
              {t('about.version', { version: appVersion })}
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView type="surface" style={styles.developerCard}>
          <ThemedView
            type="surfaceElevated"
            style={styles.avatar}>
            <SymbolView
              name="person.fill"
              tintColor={theme.accent}
              size={28}
            />
          </ThemedView>

          <View style={styles.developerInfo}>
            <ThemedText type="label" themeColor="textMuted">
              {t('about.developer').toUpperCase()}
            </ThemedText>
            <ThemedText type="h4">{t('about.developerName')}</ThemedText>
            <ThemedText type="smallMedium" themeColor="accent">
              {t('about.developerRole')}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.developerBio}>
              {t('about.developerBio')}
            </ThemedText>
          </View>
        </ThemedView>

        <View style={styles.contactSection}>
          <ThemedText type="h4">{t('about.contactSection')}</ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.contactSubtitle}>
            {t('about.contactSubtitle')}
          </ThemedText>

          {DEVELOPER_EMAIL ? (
          <Pressable
            onPress={() => handleEmailPress(t('about.feedbackButton'))}
            accessibilityRole="button"
            accessibilityLabel={t('about.feedbackButton')}
            accessibilityHint={t('about.feedbackDescription')}
            style={({ pressed }) => [
              styles.contactCard,
              { borderColor: theme.borderSubtle, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ThemedView
              type="surfaceElevated"
              style={styles.contactIcon}>
              <SymbolView
                name="envelope.fill"
                tintColor={theme.accent}
                size={22}
              />
            </ThemedView>

            <View style={styles.contactText}>
              <ThemedText type="bodyBold">
                {t('about.feedbackButton')}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                numberOfLines={2}>
                {t('about.feedbackDescription')}
              </ThemedText>
            </View>

            <SymbolView
              name="chevron.right"
              tintColor={theme.textMuted}
              size={16}
            />
          </Pressable>
          ) : null}

          {DEVELOPER_WEBSITE ? (
          <ExternalLink
            href={DEVELOPER_WEBSITE}
            asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={t('about.servicesButton')}
              accessibilityHint={t('about.servicesDescription')}
              style={({ pressed }) => [
                styles.contactCard,
                { borderColor: theme.borderSubtle, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedView
                type="surfaceElevated"
                style={styles.contactIcon}>
                <SymbolView
                  name="hammer.fill"
                  tintColor={theme.accent}
                  size={22}
                />
              </ThemedView>

              <View style={styles.contactText}>
                <ThemedText type="bodyBold">
                  {t('about.servicesButton')}
                </ThemedText>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  numberOfLines={2}>
                  {t('about.servicesDescription')}
                </ThemedText>
              </View>

              <SymbolView
                name="arrow.up.right"
                tintColor={theme.textMuted}
                size={16}
              />
            </Pressable>
          </ExternalLink>
          ) : null}
        </View>

        <ThemedText
          type="caption"
          themeColor="textMuted"
          style={styles.copyright}>
          {t('about.copyright', { year: currentYear })}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  backButton: {
    padding: Spacing.one,
    marginLeft: -Spacing.one,
  },
  headerSpacer: {
    width: 28,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Layout.tabBarHeight + Spacing.six,
    gap: Spacing.four,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.five,
    borderRadius: Radius.xl,
    gap: Spacing.four,
    ...Shadows.md,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  version: {
    marginTop: Spacing.one,
  },
  developerCard: {
    flexDirection: 'row',
    padding: Spacing.five,
    borderRadius: Radius.xl,
    gap: Spacing.four,
    ...Shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  developerInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  developerBio: {
    marginTop: Spacing.two,
    lineHeight: 20,
  },
  contactSection: {
    marginTop: Spacing.two,
    gap: Spacing.three,
  },
  contactSubtitle: {
    marginBottom: Spacing.two,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
    backgroundColor: 'transparent',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    flex: 1,
    gap: Spacing.half,
  },
  copyright: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
