import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ThemedTextProps extends TextProps {
  type?:
    | 'default'
    | 'defaultMedium'
    | 'defaultBold'
    | 'hero'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'body'
    | 'bodyMedium'
    | 'bodyBold'
    | 'small'
    | 'smallMedium'
    | 'smallBold'
    | 'caption'
    | 'label'
    | 'link'
    | 'code';
  themeColor?: ThemeColor;
}

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'defaultMedium' && styles.defaultMedium,
        type === 'defaultBold' && styles.defaultBold,
        type === 'hero' && styles.hero,
        type === 'h1' && styles.h1,
        type === 'h2' && styles.h2,
        type === 'h3' && styles.h3,
        type === 'h4' && styles.h4,
        type === 'body' && styles.body,
        type === 'bodyMedium' && styles.bodyMedium,
        type === 'bodyBold' && styles.bodyBold,
        type === 'small' && styles.small,
        type === 'smallMedium' && styles.smallMedium,
        type === 'smallBold' && styles.smallBold,
        type === 'caption' && styles.caption,
        type === 'label' && styles.label,
        type === 'link' && styles.link,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: Typography.body,
  defaultMedium: Typography.bodyMedium,
  defaultBold: Typography.bodyBold,
  hero: Typography.hero,
  h1: Typography.h1,
  h2: Typography.h2,
  h3: Typography.h3,
  h4: Typography.h4,
  body: Typography.body,
  bodyMedium: Typography.bodyMedium,
  bodyBold: Typography.bodyBold,
  small: Typography.small,
  smallMedium: Typography.smallMedium,
  smallBold: Typography.smallBold,
  caption: Typography.caption,
  label: Typography.label,
  link: {
    ...Typography.smallMedium,
    textDecorationLine: 'underline',
  },
  code: {
    ...Typography.caption,
    fontFamily: Fonts.mono,
  },
});
