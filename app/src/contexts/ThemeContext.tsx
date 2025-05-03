import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeMode, Theme, getTheme, lightTheme, darkTheme } from '../theme';

// Theme storage key for persisting user preference
const THEME_STORAGE_KEY = 'billo_theme_mode';

// Define context value type
interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  themeMode: 'light',
  isDarkMode: false,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * 
 * Manages theme state and provides theme context to the app.
 * This includes automatic system theme detection, user preferences,
 * and theme toggling functionality.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get device color scheme
  const deviceTheme = useColorScheme();
  
  // Theme state
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);
  
  // Current theme based on mode
  const theme = getTheme(themeMode);
  const isDarkMode = themeMode === 'dark';
  
  // Load saved theme preference
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setThemeMode(savedTheme as ThemeMode);
        } else {
          // Use device theme as default if no saved preference
          setThemeMode(deviceTheme as ThemeMode || 'light');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedTheme();
  }, [deviceTheme]);
  
  // Save theme preference when it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode);
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };
    
    if (!isLoading) {
      saveThemePreference();
    }
  }, [themeMode, isLoading]);
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    setThemeMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  // Context value
  const contextValue: ThemeContextValue = {
    theme,
    themeMode,
    isDarkMode,
    toggleTheme,
    setThemeMode,
  };
  
  // Use styled-components ThemeProvider to provide theme to styled components
  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook for accessing theme context
 * 
 * @returns {ThemeContextValue} Theme context with current theme and related functions
 */
export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

export default ThemeContext; 