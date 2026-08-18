import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { captureError } from '@/services/telemetry';

import { AppErrorBoundary } from './app-error-boundary';

/**
 * The boundary is the difference between a white screen and a recoverable one.
 * Before it existed, a throw during render - a malformed payload, a hook used
 * outside its provider - unmounted the whole tree with no way back.
 */

function Boom(): never {
  throw new Error('render exploded');
}

// A render throw is expected in these tests; React logs it regardless.
let consoleError: jest.SpyInstance;

beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.clearAllMocks();
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('AppErrorBoundary', () => {
  it('renders its children when nothing throws', async () => {
    await render(
      <AppErrorBoundary>
        <Text>All good</Text>
      </AppErrorBoundary>
    );

    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('catches a render throw and shows a recovery screen instead of unmounting', async () => {
    await render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('reports the error to Sentry with the React component stack', async () => {
    await render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>
    );

    expect(captureError).toHaveBeenCalledTimes(1);
    const [error, context] = (captureError as jest.Mock).mock.calls[0];
    expect((error as Error).message).toBe('render exploded');
    expect(context).toMatchObject({ boundary: 'root' });
    expect(context.componentStack).toBeTruthy();
  });

  it('remounts the subtree when the user retries', async () => {
    // Proves the retry actually clears the caught error rather than just
    // re-rendering the fallback: the child throws once, then succeeds.
    let shouldThrow = true;

    function FlakyChild() {
      const [, force] = useState(0);
      if (shouldThrow) {
        throw new Error('first render only');
      }
      return (
        <Pressable onPress={() => force(n => n + 1)}>
          <Text>Recovered</Text>
        </Pressable>
      );
    }

    await render(
      <AppErrorBoundary>
        <FlakyChild />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    shouldThrow = false;
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Recovered')).toBeTruthy();
  });
});
