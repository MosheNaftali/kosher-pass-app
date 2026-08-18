import { type Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { cloneElement, isValidElement, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/** The `style` shape a `Pressable`/`View` child can carry. */
type ChildStyleProps = { style?: unknown };

/**
 * Flattens an array `style` on an `asChild` child.
 *
 * `Link asChild` renders through expo-router's `Slot`, which **throws** in
 * development when the cloned child's `style` is an array
 * (`node_modules/expo-router/build/ui/Slot.js`). Composing a static
 * `StyleSheet` entry with a theme colour - `[styles.button, { backgroundColor }]`
 * - is the house pattern everywhere else in the app, so the flattening happens
 * here once instead of at every call site. A function style (Pressable's
 * `({ pressed }) => ...`) is not an array and passes through untouched.
 */
function flattenChildStyle(children: ReactNode): ReactNode {
  if (!isValidElement<ChildStyleProps>(children)) return children;

  const { style } = children.props;
  if (!Array.isArray(style)) return children;

  return cloneElement(children, { style: StyleSheet.flatten(style) });
}

export function ExternalLink({ href, onPress, asChild, children, ...rest }: Props) {
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
      {asChild ? flattenChildStyle(children) : children}
    </Link>
  );
}
