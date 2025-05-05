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
import { NotificationCenterNavigationProp } from '../navigation/navigationTypes';
import { ExtendedNotification } from '../types/supabase';
import { DeepLinkService } from '../services/DeepLinkService';

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
    (notification: ExtendedNotification) => {
      // If the notification has a link URL, use DeepLinkService to handle it
      if (notification.link_url) {
        DeepLinkService.handleDeepLink(notification.link_url);
        return;
      }

      // For backward compatibility, if no link_url but we have entity references
      if (notification.related_entity_type && notification.related_entity_id) {
        switch (notification.related_entity_type) {
          case 'subscription':
            navigation.navigate('SubscriptionDetail', {
              subscriptionId: notification.related_entity_id,
            });
            return;
          case 'payment':
            // Navigate to payment detail when implemented
            console.log(
              `Should navigate to payment detail for ID: ${notification.related_entity_id}`
            );
            return;
          default:
            console.log(`Unknown entity type: ${notification.related_entity_type}`);
            return;
        }
      }

      // If no navigation info, just stay on current screen
      console.log('No navigation info in notification:', notification);
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
