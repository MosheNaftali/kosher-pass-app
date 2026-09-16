import { isValidElement, type ReactElement } from 'react';
import { Pressable } from 'react-native';

import { resolveChildStyle } from './external-link';

// `expo-router` pulls in `standard-navigation`, which is not in the transform
// allow-list. The helper under test never touches the Link, so a stub is enough.
jest.mock('expo-router', () => ({ Link: () => null }));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: { AUTOMATIC: 'automatic' },
}));

/**
 * `Link asChild` forwards the child through radix's `mergeProps`, which merges
 * `style` with an object spread - a function or array style is silently lost,
 * and an array additionally throws in development. That is what made the About
 * screen's "Development Services" card collapse to a column, so the shapes are
 * resolved before the Slot ever sees them.
 */

type ResolvedProps = {
  style?: unknown;
  onPressIn?: (event: unknown) => void;
  onPressOut?: (event: unknown) => void;
};

function asElement(node: unknown): ReactElement<ResolvedProps> {
  if (!isValidElement<ResolvedProps>(node)) {
    throw new Error('expected an element');
  }
  return node;
}

describe('resolveChildStyle', () => {
  it('evaluates a function style into a plain object so the Slot cannot drop it', () => {
    const child = <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} />;

    const resolved = asElement(resolveChildStyle(child, true, () => {}));

    expect(typeof resolved.props.style).toBe('object');
    expect(resolved.props.style).toEqual({ opacity: 0.7 });
  });

  it('flattens an array style into a plain object', () => {
    const child = <Pressable style={[{ padding: 4 }, { opacity: 0.5 }]} />;

    const resolved = asElement(resolveChildStyle(child, false, () => {}));

    expect(resolved.props.style).toEqual({ padding: 4, opacity: 0.5 });
  });

  it('tracks the press state through the child own callbacks', () => {
    const childPressIn = jest.fn();
    const childPressOut = jest.fn();
    const onPressStateChange = jest.fn();

    const child = (
      <Pressable
        onPressIn={childPressIn}
        onPressOut={childPressOut}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      />
    );

    const resolved = asElement(resolveChildStyle(child, false, onPressStateChange));

    resolved.props.onPressIn?.({});
    expect(childPressIn).toHaveBeenCalledTimes(1);
    expect(onPressStateChange).toHaveBeenLastCalledWith(true);

    resolved.props.onPressOut?.({});
    expect(childPressOut).toHaveBeenCalledTimes(1);
    expect(onPressStateChange).toHaveBeenLastCalledWith(false);
  });

  it('returns non-element children untouched', () => {
    expect(resolveChildStyle('plain text', false, () => {})).toBe('plain text');
  });
});
