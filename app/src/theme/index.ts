/**
 * Theme configuration index
 * 
 * This file exports the entire theme configuration and provides
 * a convenience method to get the correct theme based on the mode.
 */

import colors, { lightColors, darkColors, ColorTheme } from './colors';
import spacing, { SpacingTheme } from './spacing';
import typography, { TypographyTheme } from './typography';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  colors: ColorTheme;
  spacing: SpacingTheme;
  typography: TypographyTheme;
}

export const getTheme = (mode: ThemeMode): Theme => ({
  colors: mode === 'light' ? lightColors : darkColors,
  spacing,
  typography,
});

export const lightTheme = getTheme('light');
export const darkTheme = getTheme('dark');

export { lightColors, darkColors, colors, spacing, typography }; 