import { Image, type ImageLoadEventData } from 'expo-image';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadows, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { alertSourceLink, type AlertSeverity, type FeedAlert } from '@/utils/alerts';

const SEVERITY_COLOR: Record<AlertSeverity, ThemeColor> = {
  critical: 'error',
  warning: 'warning',
  info: 'accent',
};

const SEVERITY_ICON: Record<AlertSeverity, SFSymbol> = {
  critical: 'exclamationmark.octagon.fill',
  warning: 'exclamationmark.triangle.fill',
  info: 'sparkles',
};

export interface AlertDetailSheetProps {
  /** The alert on screen, or `null` while the sheet is closed. */
  alert: FeedAlert | null;
  /** The publishing agency's display name, when the app has it cached. */
  agencyName?: string;
  onClose: () => void;
  /** Navigates to the product or agency an alert points at, if any. */
  onFollowTarget: (alert: FeedAlert) => void;
  /** Opens the agency's own notice in the browser. */
  onOpenSource: (url: string) => void;
}

/**
 * The full text of one alert, as a bottom sheet.
 *
 * Tapping a row used to jump straight out to the agency's website, which meant
 * the reader left the app to find out what the notice even said - and on a row
 * with no link at all, the description stayed clipped to a single line with no
 * way to expand it. Everything the agency published lands here first: its
 * image, its headline, its full body, who published it and when. Leaving for
 * the origin is then a deliberate second tap.
 */
export function AlertDetailSheet({
  alert,
  agencyName,
  onClose,
  onFollowTarget,
  onOpenSource,
}: AlertDetailSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const colorKey = alert ? SEVERITY_COLOR[alert.severity] : 'accent';
  const sourceUrl = alert ? alertSourceLink(alert) : null;

  // A product/agency target is an in-app destination and outranks the external
  // link: staying inside the app is the better of the two answers to "and then
  // what?". Its button label names where it goes, so the reader knows which of
  // the two actions leaves the app.
  const targetType = alert?.target.type;
  const inAppLabel =
    targetType === 'product'
      ? t('alerts.viewProduct')
      : targetType === 'agency'
        ? t('alerts.viewAgency')
        : null;

  // The agency wrote every string below, so none of it goes through t() - see
  // the same note on the feed row.
  const publishedAt = alert?.publishedAt
    ? new Date(alert.publishedAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : null;

  return (
    <Modal
      visible={alert !== null}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('alerts.close')}
        />
        <Animated.View
          entering={SlideInDown.duration(280).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(220).easing(Easing.in(Easing.cubic))}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              paddingBottom: insets.bottom + Spacing.four,
            },
          ]}>
          <View style={styles.sheetHandle}>
            <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
          </View>

          {alert && (
            <>
              <ScrollView
                style={styles.sheetContent}
                contentContainerStyle={styles.sheetContentInner}
                showsVerticalScrollIndicator={false}>
                {alert.imageUrl && <AlertImage key={alert.imageUrl} uri={alert.imageUrl} />}

                <View style={styles.badgeRow}>
                  <View style={[styles.severityBadge, { backgroundColor: `${theme[colorKey]}1A` }]}>
                    <SymbolView
                      name={SEVERITY_ICON[alert.severity]}
                      tintColor={theme[colorKey]}
                      size={13}
                    />
                    <ThemedText type="label" themeColor={colorKey}>
                      {t(`alerts.severity.${alert.severity}`)}
                    </ThemedText>
                  </View>
                  {agencyName && (
                    <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                      {agencyName}
                    </ThemedText>
                  )}
                </View>

                <ThemedText type="h3">{alert.title}</ThemedText>

                {publishedAt && (
                  <ThemedText type="caption" themeColor="textMuted">
                    {t('alerts.publishedOn', { date: publishedAt })}
                  </ThemedText>
                )}

                {alert.description.length > 0 ? (
                  <ThemedText type="body" themeColor="textSecondary">
                    {alert.description}
                  </ThemedText>
                ) : (
                  <ThemedText type="small" themeColor="textMuted">
                    {t('alerts.noDetail')}
                  </ThemedText>
                )}

                {/*
                  Both actions are available on an alert that points at a
                  product *and* names an origin. Only one of them fits in the
                  footer next to Close, so the external one moves up here
                  rather than being dropped.
                */}
                {inAppLabel && sourceUrl && (
                  <Pressable
                    onPress={() => onOpenSource(sourceUrl)}
                    hitSlop={Spacing.two}
                    style={styles.sourceLink}
                    accessibilityRole="link"
                    accessibilityLabel={t('alerts.viewSource')}>
                    <ThemedText type="smallMedium" themeColor="accent">
                      {t('alerts.viewSource')}
                    </ThemedText>
                    <SymbolView name="arrow.up.right" tintColor={theme.accent} size={12} />
                  </Pressable>
                )}
              </ScrollView>

              <View style={[styles.sheetFooter, { borderTopColor: theme.borderSubtle }]}>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={t('alerts.close')}
                  style={[
                    styles.footerButton,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}>
                  <ThemedText type="bodyMedium" themeColor="text">
                    {t('alerts.close')}
                  </ThemedText>
                </Pressable>

                {inAppLabel ? (
                  <Pressable
                    onPress={() => onFollowTarget(alert)}
                    accessibilityRole="button"
                    accessibilityLabel={inAppLabel}
                    style={[styles.footerButton, { backgroundColor: theme.accent }]}>
                    <ThemedText type="bodyMedium" themeColor="accentForeground">
                      {inAppLabel}
                    </ThemedText>
                  </Pressable>
                ) : sourceUrl ? (
                  <Pressable
                    onPress={() => onOpenSource(sourceUrl)}
                    accessibilityRole="button"
                    accessibilityLabel={t('alerts.viewSource')}
                    style={[styles.footerButton, { backgroundColor: theme.accent }]}>
                    <ThemedText type="bodyMedium" themeColor="accentForeground">
                      {t('alerts.viewSource')}
                    </ThemedText>
                    <SymbolView name="arrow.up.right" tintColor={theme.accentForeground} size={13} />
                  </Pressable>
                ) : null}
              </View>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * The notice's image at its own proportions.
 *
 * These are flyers an agency drew up for print or for WhatsApp, not thumbnails
 * cut to our grid: a tall one cropped to a landscape box loses the half of the
 * page carrying the batch numbers. So the width is fixed to the sheet and the
 * height is whatever the image says it should be - measured on load, since
 * only the file knows. Until it reports back, a landscape box holds the space
 * so the sheet does not lurch when the real ratio lands.
 */
function AlertImage({ uri }: { uri: string }) {
  const theme = useTheme();
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  function handleLoad(event: ImageLoadEventData) {
    const { width, height } = event.source;
    if (width > 0 && height > 0) setAspectRatio(width / height);
  }

  return (
    <Image
      source={{ uri }}
      style={[
        styles.image,
        { backgroundColor: theme.borderSubtle, aspectRatio: aspectRatio ?? 16 / 9 },
      ]}
      contentFit="contain"
      transition={200}
      onLoad={handleLoad}
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    height: '70%',
    ...Shadows.lg,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetContent: {
    flex: 1,
  },
  sheetContentInner: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  image: {
    width: '100%',
    borderRadius: Radius.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.round,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    paddingTop: Spacing.one,
  },
  sheetFooter: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Platform.select({ ios: Spacing.three + 2, default: Spacing.three }),
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
