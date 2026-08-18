/**
 * Jest setup.
 *
 * Native modules are replaced with inert stubs so a unit test never depends on
 * a device, a network, or a telemetry account. Anything that would reach out of
 * the process is silenced here rather than in individual tests.
 */

// Telemetry must be a no-op in tests: a real `track` would try to initialize the
// PostHog client and queue events to disk.
jest.mock('@/services/telemetry', () => ({
  track: jest.fn(),
  trackScreen: jest.fn(),
  captureError: jest.fn(),
  flushTelemetry: jest.fn(),
  initTelemetry: jest.fn(async () => undefined),
  isTelemetryConfigured: () => false,
  isAnalyticsEnabled: () => false,
  isErrorReportingEnabled: () => false,
  toRouteTemplate: (path: string) => path,
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.0.0',
      extra: {
        apiUrl: 'http://test.local',
        environment: 'development',
      },
    },
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  },
}));
