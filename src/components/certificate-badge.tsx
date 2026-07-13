import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CertificateStatus } from '@/services/certificates';

interface CertificateBadgeProps {
  status: CertificateStatus;
}

const statusTranslationKeys: Record<CertificateStatus, string> = {
  valid: 'common.certificate.valid',
  expired: 'common.certificate.expired',
  revoked: 'common.certificate.revoked',
};

const statusColors: Record<CertificateStatus, ThemeColor> = {
  valid: 'success',
  expired: 'warning',
  revoked: 'error',
};

export function CertificateBadge({ status }: CertificateBadgeProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const color = statusColors[status];

  return (
    <ThemedView style={[styles.badge, { backgroundColor: `${theme[color]}15` }]}>
      <ThemedText type="smallBold" style={{ color: theme[color] }}>
        {t(statusTranslationKeys[status])}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.sm,
  },
});
