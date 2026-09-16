import { type Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import {
  cloneElement,
  isValidElement,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { StyleSheet } from 'react-native';
import type { GestureResponderEvent } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/**
 * The slice of `PressableStateCallbackType` a style callback actually reads.
 * Kept local because `@expo/ui` augments that type with `focused`/`hovered`,
 * which a touch-only call site has nothing to supply.
 */
type PressableStyleState = { pressed: boolean };

/** The `style` and press-callback shape a `Pressable` child can carry. */
type ChildProps = {
  style?: unknown;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
};

/**
 * Resolves the `style` on an `asChild` child into something the `Slot` can
 * forward, and keeps a function style's pressed state in sync.
 *
 * `Link asChild` renders through expo-router's `Slot`, which forwards props
 * through radix's `mergeProps`. That helper merges `style` with
 * `{ ...slotStyle, ...childStyle }`, so a **function** style:
 *
 * ```tsx
 * style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
 * ```
 *
 * is spread into an empty object and silently dropped - the card loses its
 * layout and collapses to a column. An array is dropped the same way, and
 * additionally throws in development (`Slot.js` checks for it).
 *
 * Both shapes are therefore resolved here, before the `Slot` sees them: an
 * array is flattened, and a function is evaluated against the pressed state
 * tracked by `ExternalLink`. The child's own press callbacks are chained so
 * that state follows the real interaction. Call sites need no special handling.
 */
export function resolveChildStyle(
  children: ReactNode,
  pressed: boolean,
  onPressStateChange: (pressed: boolean) => void,
): ReactNode {
  if (!isValidElement<ChildProps>(children)) return children;

  const { style, onPressIn, onPressOut } = children.props;

  if (typeof style === 'function') {
    const resolved = (style as (state: PressableStyleState) => unknown)({ pressed });
    return cloneElement(children, {
      style: StyleSheet.flatten(resolved),
      onPressIn: (event: GestureResponderEvent) => {
        onPressIn?.(event);
        onPressStateChange(true);
      },
      onPressOut: (event: GestureResponderEvent) => {
        onPressOut?.(event);
        onPressStateChange(false);
      },
    });
  }

  if (Array.isArray(style)) {
    return cloneElement(children, { style: StyleSheet.flatten(style) });
  }

  return children;
}

export function ExternalLink({ href, onPress, asChild, children, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <Link
      target="_blank"
      {...rest}
      asChild={asChild}
      href={href as Href}
      onPress={async (event) => {
        // The caller's handler runs first and is honoured here explicitly:
        // `Link` with `asChild` overwrites the child's own `onPress`, so a
        // handler placed on the child element would silently never fire.
        onPress?.(event);

        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}>
      {asChild ? resolveChildStyle(children, pressed, setPressed) : children}
    </Link>
  );
}
