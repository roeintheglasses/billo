import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import * as Linking from 'expo-linking';

import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { RootStackParamList } from './navigationTypes';
import { NavigationService, navigationRef } from './navigationService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { StyleSheet } from 'react-native';
import DeepLinkService from '../services/DeepLinkService';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * AppNavigator Component
 *
 * The root navigation component that handles switching between
 * authentication flow and main app screens based on auth state.
 * Also configures deep linking for the application.
 */
export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  // Deep linking configuration
  const linking = {
    prefixes: ['billo://', 'https://billo.app'],
    config: {
      screens: {
        Auth: {
          screens: {
            Login: 'login',
            Register: 'register',
            ForgotPassword: 'forgot-password',
            ResetPassword: 'reset-password',
          },
        },
        Tabs: {
          screens: {
            Home: 'home',
            Subscriptions: 'subscriptions',
            Settings: 'settings',
            Profile: 'profile',
            NotificationCenter: 'notifications',
          },
        },
        SubscriptionDetail: 'subscription/:subscriptionId',
        AddSubscription: 'add-subscription',
        EditSubscription: 'edit-subscription/:subscriptionId',
        CategoryManagement: 'categories',
      },
    },
    // Handle custom deep link logic
    async getInitialURL() {
      // First check if app was opened from a deep link
      const url = await Linking.getInitialURL();

      if (url) {
        // Let our custom handler deal with it first
        const handled = DeepLinkService.handleDeepLink(url);
        // Only return the URL for React Navigation if our handler didn't handle it
        return handled ? null : url;
      }

      return null;
    },
    subscribe(listener) {
      // Listen to incoming links when app is already open
      const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
        // Try our custom handler first
        const handled = DeepLinkService.handleDeepLink(url);

        // Only call React Navigation's listener if our handler didn't handle it
        if (!handled && url) {
          listener(url);
        }
      });

      return () => {
        linkingSubscription.remove();
      };
    },
  };

  // Show loading screen while checking authentication state
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background.primary,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={() => {
          NavigationService.isReady = true;
        }}
        fallback={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        }
      >
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="Tabs" component={TabNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
