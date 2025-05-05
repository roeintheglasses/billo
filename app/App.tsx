import React, { useEffect } from 'react';
import { AppNavigator } from './src/navigation';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { StorageProvider } from './src/contexts/StorageContext';
import { PermissionsProvider } from './src/contexts/PermissionsContext';
import { SessionTimeoutDialog } from './src/components';
import { initializeApp } from './src/services/initializeApp';

/**
 * Main App component
 *
 * Wraps the application with necessary providers:
 * - ThemeProvider: For theming and dark/light mode support
 * - AuthProvider: For authentication state management
 * - StorageProvider: For subscription data storage management (local/remote)
 * - PermissionsProvider: For handling app permissions, including SMS access
 *
 * Also includes the SessionTimeoutDialog for handling expiring sessions.
 *
 * @returns {React.ReactElement} The root App component
 */
export default function App() {
  // Initialize app services
  useEffect(() => {
    // Initialize notification scheduler and other services
    initializeApp().catch(error => {
      console.error('Failed to initialize app:', error);
    });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <StorageProvider>
          <PermissionsProvider>
            <AppNavigator />
            <SessionTimeoutDialog />
          </PermissionsProvider>
        </StorageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
