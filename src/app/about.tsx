import { Icon, type IconName } from '@/components/ui/icon';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import LogoImage from '@/assets/images/logo.png';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_VERSION, Config } from '@/constants/config';
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

// Shared so the divider can line up with the row text.
const CONTACT_ICON_SIZE = 20;

export default function AboutScreen() {
  const theme = useTheme();
  const { contentTopInset } = useTopInset();
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  const hasContact = Boolean(DEVELOPER_EMAIL || DEVELOPER_WEBSITE);

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
        <ThemedText type="hero">{t('about.heroTitle')}</ThemedText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <ThemedView type="surfaceContrast" style={styles.hero}>
          <Image source={LogoImage} style={styles.heroLogo} contentFit="contain" />

          <View style={styles.heroText}>
            <ThemedText type="h2" themeColor="surfaceContrastForeground">
              {t('about.appName')}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="surfaceContrastForeground"
              style={styles.heroTagline}>
              {t('about.appTagline')}
            </ThemedText>
          </View>
        </ThemedView>

        <View style={styles.section}>
          <ThemedText type="h4">{t('about.dataTitle')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('about.dataBody')}
          </ThemedText>
        </View>

        <ThemedView
          style={[
            styles.disclaimer,
            { backgroundColor: `${theme.warning}14`, borderColor: `${theme.warning}55` },
          ]}>
          <Icon
            name="exclamationmark.triangle.fill"
            tintColor={theme.warning}
            size={18}
            weight="bold"
          />
          <View style={styles.disclaimerText}>
            <ThemedText type="smallBold" style={{ color: theme.warning }}>
              {t('about.disclaimerTitle')}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('about.disclaimerBody')}
            </ThemedText>
          </View>
        </ThemedView>

        {hasContact ? (
          <View style={styles.section}>
            <ThemedText type="h4">{t('about.contactSection')}</ThemedText>

            <ThemedView type="surface" style={styles.contactCard}>
              {DEVELOPER_EMAIL ? (
                <Pressable
                  onPress={() => handleEmailPress(t('about.feedbackButton'))}
                  accessibilityRole="button"
                  accessibilityLabel={t('about.feedbackButton')}
                  accessibilityHint={t('about.feedbackDescription')}
                  style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
                  <ContactRow
                    icon="envelope.fill"
                    trailingIcon="chevron.right"
                    title={t('about.feedbackButton')}
                    description={t('about.feedbackDescription')}
                  />
                </Pressable>
              ) : null}

              {DEVELOPER_EMAIL && DEVELOPER_WEBSITE ? (
                <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />
              ) : null}

              {DEVELOPER_WEBSITE ? (
                <ExternalLink href={DEVELOPER_WEBSITE} asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={t('about.servicesButton')}
                    accessibilityHint={t('about.servicesDescription')}
                    style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
                    <ContactRow
                      icon="hammer.fill"
                      trailingIcon="arrow.up.right"
                      title={t('about.servicesButton')}
                      description={t('about.servicesDescription')}
                    />
                  </Pressable>
                </ExternalLink>
              ) : null}
            </ThemedView>
          </View>
        ) : null}

        <View style={styles.footer}>
          <ThemedText type="caption" themeColor="textMuted">
            {t('about.version', { version: APP_VERSION })}
          </ThemedText>
          <ThemedText type="caption" themeColor="textMuted">
            {t('about.copyright', { year: currentYear })}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

interface ContactRowProps {
  icon: IconName;
  trailingIcon: IconName;
  title: string;
  description: string;
}

function ContactRow({ icon, trailingIcon, title, description }: ContactRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.contactRow}>
      <Icon name={icon} tintColor={theme.accent} size={CONTACT_ICON_SIZE} />

      <View style={styles.contactText}>
        <ThemedText type="bodyMedium">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {description}
        </ThemedText>
      </View>

      <Icon name={trailingIcon} tintColor={theme.textMuted} size={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Layout.tabBarHeight + Spacing.six,
    gap: Spacing.five,
  },
  // Same navy the splash screen uses, so the app opens and closes on the same
  // surface. It is the only place the brand colour appears as a background.
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.five,
    borderRadius: Radius.xl,
    gap: Spacing.four,
    ...Shadows.md,
  },
  heroLogo: {
    width: 64,
    height: 64,
  },
  heroText: {
    flex: 1,
    gap: Spacing.half,
  },
  heroTagline: {
    opacity: 0.8,
  },
  section: {
    gap: Spacing.three,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  disclaimerText: {
    flex: 1,
    gap: Spacing.one,
  },
  contactCard: {
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  contactText: {
    flex: 1,
    gap: Spacing.half,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.four + CONTACT_ICON_SIZE + Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
});
