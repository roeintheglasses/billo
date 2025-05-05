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

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * TabNavigator Component
 *
 * Handles the main app navigation with bottom tabs for the primary sections.
 */
export const TabNavigator = () => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.border.light,
        },
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
      }}
    >
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
        name="AddSubscription"
        component={AddSubscriptionScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
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
      <Tab.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          tabBarButton: () => null,
          headerShown: true,
        }}
      />
      <Tab.Screen
        name="SubscriptionDetail"
        component={SubscriptionDetailScreen}
        options={{
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="EditSubscription"
        component={EditSubscriptionScreen}
        options={{
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="CategoryManagement"
        component={CategoryManagementScreen}
        options={{
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          title: 'Notifications',
        }}
      />
      <Tab.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          title: 'Notification Settings',
        }}
      />
    </Tab.Navigator>
  );
};
