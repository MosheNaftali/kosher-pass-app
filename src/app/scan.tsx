import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import { ScanOverlay } from '@/components/scan-overlay';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchProductByBarcode } from '@/services/products';

export default function ScanScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const [torch, setTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (permission?.granted === false && permission.canAskAgain === false) {
      Alert.alert(
        t('scan.cameraPermissionTitle'),
        t('scan.cameraPermissionBody'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('scan.openSettings'), onPress: () => Linking.openSettings() },
        ]
      );
    }
  }, [permission, t]);

  async function handleBarcodeScanned(data: { data: string }) {
    if (scanned || searching) return;

    setScanned(true);
    setSearching(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const product = await searchProductByBarcode(data.data);
      setSearching(false);

      if (product) {
        router.push(`/products/${product.id}`);
      } else {
        Alert.alert(
          t('scan.productNotFoundTitle'),
          t('scan.productNotFoundBody', { code: data.data }),
          [
            { text: t('common.ok'), onPress: () => setScanned(false) },
            {
              text: t('scan.searchByName'),
              onPress: () => {
                setScanned(false);
                router.push({ pathname: '/products', params: { name: data.data } });
              },
            },
          ]
        );
      }
    } catch {
      setSearching(false);
      setScanned(false);
      Alert.alert(t('scan.errorTitle'), t('scan.searchFailed'));
    }
  }

  async function handleManualSearch() {
    if (!manualCode.trim()) return;

    setSearching(true);
    try {
      const product = await searchProductByBarcode(manualCode.trim());
      if (product) {
        router.push(`/products/${product.id}`);
      } else {
        Alert.alert(
          t('scan.productNotFoundTitle'),
          t('scan.productNotFoundManualBody', { code: manualCode })
        );
      }
    } catch {
      Alert.alert(t('scan.errorTitle'), t('scan.searchFailed'));
    } finally {
      setSearching(false);
    }
  }

  if (!permission) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="camera.fill"
          title={t('scan.cameraAccessNeededTitle')}
          message={t('scan.cameraAccessNeededBody')}
        />
        <Pressable onPress={requestPermission} style={[styles.button, { backgroundColor: theme.accent }]}>
          <ThemedText type="bodyMedium" themeColor="primaryForeground">
            {t('scan.grantPermission')}
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}>
        <ScanOverlay scanning={!scanned && !searching} />
      </CameraView>

      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + Spacing.four }]}>
        <View style={styles.controls}>
          <Pressable
            onPress={() => setTorch(prev => !prev)}
            style={[styles.iconButton, { backgroundColor: theme.surfaceElevated }]}>
            <SymbolView
              name={torch ? 'flashlight.on.fill' : 'flashlight.off.fill'}
              tintColor={theme.text}
              size={22}
            />
          </Pressable>

          <Pressable
            onPress={() => { setScanned(false); setShowManual(prev => !prev); }}
            style={[styles.iconButton, { backgroundColor: theme.surfaceElevated }]}>
            <SymbolView name="keyboard" tintColor={theme.text} size={22} />
          </Pressable>
        </View>

        {showManual && (
          <View style={styles.manualInput}>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated }]}
              placeholder={t('scan.typeBarcode')}
              placeholderTextColor={theme.textMuted}
              value={manualCode}
              onChangeText={setManualCode}
              keyboardType="number-pad"
            />
            <Pressable
              onPress={handleManualSearch}
              disabled={searching}
              style={[styles.button, { backgroundColor: theme.accent }]}>
              {searching ? (
                <ActivityIndicator color={theme.primaryForeground} />
              ) : (
                <ThemedText type="bodyMedium" themeColor="primaryForeground">
                  {t('scan.searchButton')}
                </ThemedText>
              )}
            </Pressable>
          </View>
        )}

        {scanned && (
          <Pressable
            onPress={() => setScanned(false)}
            style={[styles.scanAgainButton, { backgroundColor: theme.surfaceElevated }]}>
            <ThemedText type="bodyMedium">{t('scan.tapToScanAgain')}</ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualInput: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    fontSize: 16,
  },
  button: {
    height: 48,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAgainButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
});
