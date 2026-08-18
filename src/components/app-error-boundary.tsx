import { SymbolView } from 'expo-symbols';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { captureError } from '@/services/telemetry';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/**
 * Root error boundary.
 *
 * Without one, a throw during render - a malformed API payload, a missing
 * provider, a bad route param - unmounts the whole tree and leaves a white
 * screen with no way out. This catches it, reports it to Sentry with the React
 * component stack attached, and offers a retry that remounts the subtree.
 *
 * It is a class component because React only exposes `componentDidCatch` and
 * `getDerivedStateFromError` to classes; there is no hook equivalent.
 *
 * The copy here is deliberately not translated: i18n itself lives inside the
 * tree this boundary protects, so a failure in i18n initialization would make a
 * translated fallback throw a second time. Same reason it uses the light
 * palette directly instead of `useTheme`.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureError(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'root',
    });
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <ThemedView style={styles.container}>
        <SymbolView
          name="exclamationmark.triangle"
          tintColor={Colors.light.textMuted}
          size={56}
          weight="light"
        />
        <ThemedText type="h3" style={styles.title}>
          Something went wrong
        </ThemedText>
        <ThemedText type="body" themeColor="textSecondary" style={styles.message}>
          The app hit an unexpected error. The problem has been reported.
        </ThemedText>

        {__DEV__ && (
          <View style={styles.devDetails}>
            <ThemedText type="caption" themeColor="error">
              {error.message}
            </ThemedText>
          </View>
        )}

        <Pressable
          onPress={this.handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={styles.button}>
          <ThemedText type="bodyMedium" themeColor="primaryForeground">
            Try again
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.seven,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  devDetails: {
    alignSelf: 'stretch',
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.borderSubtle,
  },
  button: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.three,
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.accent,
  },
});
