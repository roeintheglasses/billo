/**
 * Global type definitions for components
 */

import { ReactNode } from 'react';

/**
 * Common props that can be applied to most components
 */
export interface BaseComponentProps {
  testID?: string;
  children?: ReactNode;
  style?: any;
  className?: string;
}

/**
 * Theme related types
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  disabled: string;
}

export interface ThemeFonts {
  regular: string;
  medium: string;
  bold: string;
}

export interface ThemeSizes {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
}

export interface AppTheme {
  dark: boolean;
  colors: ThemeColors;
  fonts: ThemeFonts;
  sizes: ThemeSizes;
}

/**
 * Screen related types
 */
export interface ScreenProps extends BaseComponentProps {
  header?: ReactNode;
  headerTitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  hideHeader?: boolean;
  scrollable?: boolean;
  safeArea?: boolean;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?(): void;
  backgroundColor?: string;
  padding?: number | string;
}
