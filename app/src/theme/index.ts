/**
 * Theme configuration index
 *
 * This file exports the entire theme configuration and provides
 * a convenience method to get the correct theme based on the mode.
 */

import colors, { lightColors, darkColors, ColorTheme } from './colors';
import spacing, { SpacingTheme } from './spacing';
import typography, { TypographyTheme } from './typography';
import animations from './animations';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: typeof lightColors | typeof darkColors;
  spacing: SpacingTheme;
  typography: TypographyTheme;
  animations: typeof animations;
  useHighContrast: boolean;
}

const getTheme = (mode: ThemeMode): Theme => ({
  mode,
  colors: mode === 'light' ? lightColors : darkColors,
  spacing,
  typography,
  animations,
  useHighContrast: false,
});

export const lightTheme = getTheme('light');
export const darkTheme = getTheme('dark');

export { lightColors, darkColors, colors, spacing, typography, animations };
