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
 * Sets up the application with necessary providers, navigation,
 * and initializes required services.
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
