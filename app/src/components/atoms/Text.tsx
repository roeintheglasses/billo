import React from 'react';
import {
  Text as RNText,
  StyleSheet,
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from 'react-native';

export interface TextProps extends RNTextProps {
  variant?: 'heading1' | 'heading2' | 'heading3' | 'body' | 'caption' | 'label';
  weight?: 'normal' | 'semibold' | 'bold';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  color?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Text component for displaying text with consistent styling
 *
 * @param {string} variant - Text style variant (heading1, heading2, heading3, body, caption, label)
 * @param {string} weight - Font weight (normal, semibold, bold)
 * @param {string} align - Text alignment
 * @param {string} color - Text color (overrides default color)
 * @param {object} style - Additional styles to apply
 * @returns {React.ReactElement} A styled text component
 *
 * @example
 * // Basic usage
 * <Text>Hello world</Text>
 *
 * // With variant and styling
 * <Text
 *   variant="heading1"
 *   weight="bold"
 *   align="center"
 *   color="#FF0000"
 * >
 *   Welcome to Billo
 * </Text>
 */
export const Text = ({
  variant = 'body',
  weight = 'normal',
  align = 'auto',
  color,
  style,
  children,
  ...rest
}: TextProps) => {
  return (
    <RNText
      style={[
        styles.base,
        styles[variant],
        styles[weight],
        align !== 'auto' && { textAlign: align },
        color && { color },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    color: '#333333',
    fontSize: 16,
  },
  heading1: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 12,
  },
  heading2: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 6,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
    color: '#666666',
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  normal: {
    fontWeight: 'normal',
  },
  semibold: {
    fontWeight: '500',
  },
  bold: {
    fontWeight: 'bold',
  },
});
