/**
 * Protected Route Component
 * 
 * This component redirects unauthenticated users to the login screen.
 * It's used to protect routes that require authentication.
 */

import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute Component
 * 
 * Wraps a component and ensures the user is authenticated
 * before rendering it. Redirects to login if not authenticated.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation<NavigationProp<any>>();
  
  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Use setTimeout to avoid navigation during render
    setTimeout(() => {
      navigation.navigate('Login');
    }, 0);
    
    return null;
  }
  
  // Render children if authenticated
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProtectedRoute; 