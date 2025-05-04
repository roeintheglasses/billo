import React from 'react';
import { AppNavigator } from './src/navigation';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { StorageProvider } from './src/contexts/StorageContext';
import { SessionTimeoutDialog } from './src/components';

/**
 * Main App component
 * 
 * Wraps the application with necessary providers:
 * - ThemeProvider: For theming and dark/light mode support
 * - AuthProvider: For authentication state management
 * - StorageProvider: For subscription data storage management (local/remote)
 * 
 * Also includes the SessionTimeoutDialog for handling expiring sessions.
 * 
 * @returns {React.ReactElement} The root App component
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StorageProvider>
          <AppNavigator />
          <SessionTimeoutDialog />
        </StorageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
