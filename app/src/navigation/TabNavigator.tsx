import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen, SettingsScreen, ChangePasswordScreen } from '../screens';
import { TabParamList } from './navigationTypes';
import { useTheme } from '../contexts/ThemeContext';
import { ProfileScreen } from '../screens/ProfileScreen';

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
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          // Return the Ionicons component
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.border.light,
        },
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
      <Tab.Screen name="Profile" component={ProfileScreen} />
      
      {/* Hidden screens - not shown in tab bar */}
      <Tab.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen} 
        options={{ 
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}; 