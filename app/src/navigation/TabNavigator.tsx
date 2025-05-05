import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  HomeScreen,
  SettingsScreen,
  ChangePasswordScreen,
  AddSubscriptionScreen,
  SubscriptionDetailScreen,
  EditSubscriptionScreen,
  CategoryManagementScreen,
} from '../screens';
import { TabParamList } from './navigationTypes';
import { useTheme } from '../contexts/ThemeContext';
import { ProfileScreen } from '../screens/ProfileScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import NotificationCenterScreen from '../screens/NotificationCenterScreen';
import SMSSubscriptionsScreen from '../screens/SMSSubscriptionsScreen';
import SMSScannerSettingsScreen from '../screens/SMSScannerSettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * TabNavigator Component
 *
 * Handles the main app navigation with bottom tabs for the primary sections.
 */
export const TabNavigator = () => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Common options for screens that shouldn't appear in the tab bar
  const hiddenTabScreenOptions = {
    tabBarButton: () => null,
    tabBarShowLabel: false,
    tabBarItemStyle: { display: 'none' as const },
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.border.light,
          elevation: 8,
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
      }}
    >
      {/* Main Tab Bar Screens */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddSubscriptionScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SMSSubscriptions"
        component={SMSSubscriptionsScreen}
        options={{
          title: 'SMS Subscriptions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Hidden Screens - Not shown in tab bar */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          ...hiddenTabScreenOptions,
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          ...hiddenTabScreenOptions,
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="SubscriptionDetail"
        component={SubscriptionDetailScreen}
        options={{
          ...hiddenTabScreenOptions,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="EditSubscription"
        component={EditSubscriptionScreen}
        options={{
          ...hiddenTabScreenOptions,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="CategoryManagement"
        component={CategoryManagementScreen}
        options={{
          ...hiddenTabScreenOptions,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{
          ...hiddenTabScreenOptions,
          headerShown: false,
          title: 'Notifications',
        }}
      />
      <Tab.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          ...hiddenTabScreenOptions,
          headerShown: false,
          title: 'Notification Settings',
        }}
      />
      <Tab.Screen
        name="SMSScannerSettings"
        component={SMSScannerSettingsScreen}
        options={{
          ...hiddenTabScreenOptions,
          headerShown: true,
          title: 'SMS Scanner Settings',
        }}
      />
    </Tab.Navigator>
  );
};
