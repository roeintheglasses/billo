/**
 * Color palette for the application
 * 
 * This file defines colors for both light and dark themes.
 */

// Base colors
const palette = {
  // Primary colors
  primary: {
    light: '#007AFF', // iOS blue
    dark: '#0A84FF',
  },
  // Secondary colors
  secondary: {
    light: '#5856D6', // iOS purple
    dark: '#5E5CE6',
  },
  // Success colors
  success: {
    light: '#34C759', // iOS green
    dark: '#30D158',
  },
  // Error colors
  error: {
    light: '#FF3B30', // iOS red
    dark: '#FF453A',
  },
  // Warning colors
  warning: {
    light: '#FF9500', // iOS orange
    dark: '#FF9F0A',
  },
  // Grey scale
  grey: {
    50: '#F9F9F9', 
    100: '#F2F2F7',
    200: '#E5E5EA',
    300: '#D1D1D6',
    400: '#C7C7CC',
    500: '#AEAEB2',
    600: '#8E8E93',
    700: '#636366',
    800: '#48484A',
    900: '#3A3A3C',
  },
  // Pure colors
  pure: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
};

// Theme-specific colors
export const lightColors = {
  // Background colors
  background: {
    primary: palette.pure.white,
    secondary: palette.grey[100],
    tertiary: palette.grey[200],
  },
  // Text colors
  text: {
    primary: palette.grey[900],
    secondary: palette.grey[700],
    tertiary: palette.grey[500],
    inverted: palette.pure.white,
  },
  // Border colors
  border: {
    light: palette.grey[200],
    medium: palette.grey[300],
    dark: palette.grey[400],
  },
  // Semantic colors
  primary: palette.primary.light,
  secondary: palette.secondary.light,
  success: palette.success.light,
  error: palette.error.light,
  warning: palette.warning.light,
  // Other
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const darkColors = {
  // Background colors
  background: {
    primary: '#000000',
    secondary: '#1C1C1E',
    tertiary: '#2C2C2E',
  },
  // Text colors
  text: {
    primary: palette.pure.white,
    secondary: palette.grey[300],
    tertiary: palette.grey[500],
    inverted: palette.grey[900],
  },
  // Border colors
  border: {
    light: palette.grey[800],
    medium: palette.grey[700],
    dark: palette.grey[600],
  },
  // Semantic colors
  primary: palette.primary.dark,
  secondary: palette.secondary.dark,
  success: palette.success.dark,
  error: palette.error.dark,
  warning: palette.warning.dark,
  // Other
  shadow: 'rgba(0, 0, 0, 0.3)',
};

export type ColorTheme = typeof lightColors;

export default { lightColors, darkColors, palette }; 