/**
 * NotificationCenterScreen
 *
 * Screen component for displaying the notification center, which shows all user notifications.
 */
import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import NotificationCenter from '../components/organisms/NotificationCenter';
import { useTheme } from '../contexts/ThemeContext';
import { Notification } from '../types/supabase';
import { TabParamList } from '../navigation/navigationTypes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the navigation prop type
type NotificationCenterNavigationProp = NativeStackNavigationProp<TabParamList>;

/**
 * NotificationCenterScreen component
 */
const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation<NotificationCenterNavigationProp>();
  const { theme } = useTheme();
  const { colors } = theme;

  /**
   * Handle notification press to navigate to the relevant screen
   */
  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Handle navigation based on notification type and deep link
      if (notification.link_url) {
        // Example: Parse deep link URL and navigate accordingly
        // This would be expanded in a real implementation to handle various deep link formats

        // Example: link_url format: "/subscriptions/{id}"
        if (notification.link_url.startsWith('/subscriptions/')) {
          const subscriptionId = notification.link_url.split('/subscriptions/')[1];
          if (subscriptionId) {
            navigation.navigate('SubscriptionDetail', { subscriptionId });
            return;
          }
        }

        // Add more deep link handling as needed
        console.log(`Deep link not handled: ${notification.link_url}`);
      }
    },
    [navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <NotificationCenter onNotificationPress={handleNotificationPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default NotificationCenterScreen;
