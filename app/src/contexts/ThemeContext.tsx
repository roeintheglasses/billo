import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import { useReduceMotion } from '../utils/accessibilityUtils';
import { lightTheme, darkTheme, Theme, ThemeMode } from '../theme';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode | 'system') => void;
  toggleMode: () => void;
  systemTheme: ColorSchemeName;
  isHighContrastEnabled: boolean;
  toggleHighContrast: () => void;
  isReducedMotionEnabled: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  mode: 'light',
  setMode: () => {},
  toggleMode: () => {},
  systemTheme: Appearance.getColorScheme(),
  isHighContrastEnabled: false,
  toggleHighContrast: () => {},
  isReducedMotionEnabled: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get system theme
  const systemTheme = useColorScheme() as ThemeMode | null;
  const isReducedMotionEnabled = useReduceMotion();
  
  // Initial theme mode (default to light if system theme is null)
  const [mode, setModeState] = useState<ThemeMode>(systemTheme || 'light');
  const [isSystemTheme, setIsSystemTheme] = useState<boolean>(true);
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState<boolean>(false);

  // Update theme mode when system theme changes, if following system
  useEffect(() => {
    if (isSystemTheme && systemTheme) {
      setModeState(systemTheme);
    }
  }, [systemTheme, isSystemTheme]);

  // Set theme mode (or follow system)
  const setMode = (newMode: ThemeMode | 'system') => {
    if (newMode === 'system') {
      setIsSystemTheme(true);
      setModeState(systemTheme || 'light');
    } else {
      setIsSystemTheme(false);
      setModeState(newMode);
    }
  };

  // Toggle between light and dark modes (without affecting system setting)
  const toggleMode = () => {
    setIsSystemTheme(false);
    setModeState(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Toggle high contrast mode
  const toggleHighContrast = () => {
    setIsHighContrastEnabled(prev => !prev);
  };

  // Get the current theme object based on mode and high contrast setting
  const getThemeWithContrast = (): Theme => {
    const baseTheme = mode === 'light' ? { ...lightTheme } : { ...darkTheme };
    baseTheme.useHighContrast = isHighContrastEnabled;
    
    // If high contrast is enabled, modify the colors for better contrast
    if (isHighContrastEnabled) {
      if (mode === 'light') {
        // Increase contrast in light mode
        baseTheme.colors.text.primary = '#000000';
        baseTheme.colors.text.secondary = '#222222';
        baseTheme.colors.background.primary = '#FFFFFF';
      } else {
        // Increase contrast in dark mode
        baseTheme.colors.text.primary = '#FFFFFF';
        baseTheme.colors.text.secondary = '#F0F0F0';
        baseTheme.colors.background.primary = '#000000';
      }
    }
    
    return baseTheme;
  };

  const theme = getThemeWithContrast();

  const value = {
    theme,
    mode,
    setMode,
    toggleMode,
    systemTheme,
    isHighContrastEnabled,
    toggleHighContrast,
    isReducedMotionEnabled,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext; 