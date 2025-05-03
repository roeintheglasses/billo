import React from 'react';
import { AppNavigator } from './src/navigation';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';

/**
 * Main App component
 * 
 * Wraps the application with necessary providers:
 * - ThemeProvider: For theming and dark/light mode support
 * - AuthProvider: For authentication state management
 * 
 * @returns {React.ReactElement} The root App component
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
