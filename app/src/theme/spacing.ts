/**
 * Spacing values for consistent layout
 * 
 * This file defines the spacing scale used throughout the application
 * to ensure consistent spacing between elements.
 */

const spacing = {
  // Base spacing unit (4px)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  // Specific use cases
  container: 20,
  screenPadding: 16,
  cardPadding: 16,
  inputPadding: 12,
  buttonPadding: 12,
  
  // Helper function for calculating spacing
  get: (multiplier: number) => multiplier * 4,
};

export type SpacingTheme = typeof spacing;

export default spacing; 