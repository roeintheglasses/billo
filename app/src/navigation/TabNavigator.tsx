import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen, SettingsScreen } from '../screens';
import { TabParamList } from './navigationTypes';

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * TabNavigator Component
 * 
 * Handles the main app navigation with bottom tabs for the primary sections.
 */
export const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          // Set the icon based on the route name
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Subscriptions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Add') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          // Return the Ionicons component
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Subscriptions" 
        component={HomeScreen} // Temporary, will be replaced with SubscriptionsScreen
        options={{
          title: 'My Subscriptions'
        }}
      />
      <Tab.Screen name="Add" 
        component={HomeScreen} // Temporary, will be replaced with AddSubscriptionScreen
        options={{
          tabBarLabel: 'Add New',
        }}
      />
      <Tab.Screen name="Calendar" 
        component={HomeScreen} // Temporary, will be replaced with CalendarScreen 
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}; 