/**
 * App Initialization
 *
 * This module handles initializing all services when the app starts.
 * It ensures everything is properly configured before the UI renders.
 */

import notificationScheduler from './NotificationScheduler';
import { supabase } from './supabase';
import DeepLinkService from './DeepLinkService';
import { PushNotificationService } from './PushNotificationService';

/**
 * Initialize all app services
 * Call this during app startup to ensure all services are available
 */
export const initializeApp = async (): Promise<void> => {
  try {
    console.log('Initializing app services...');

    // Initialize notification scheduler
    await notificationScheduler.initialize();
    console.log('Notification scheduler initialized');

    // Initialize push notification service
    await PushNotificationService.getInstance().initialize();
    console.log('Push notification service initialized');

    // Initialize deep linking
    DeepLinkService.initializeDeepLinks();
    console.log('Deep linking initialized');

    // Add additional service initializations here

    console.log('App services initialized successfully');
  } catch (error) {
    console.error('Error initializing app services:', error);
    throw error;
  }
};

/**
 * Create a subscription to listen for real-time notification changes
 * This allows the app to update UI when notifications are delivered
 */
export const setupNotificationSubscription = async (
  userId: string,
  onNotification: (notification: any) => void
): Promise<() => void> => {
  // Subscribe to the notification_update channel
  const subscription = supabase
    .channel('notification_updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      payload => {
        // Call the callback with the notification data
        onNotification(payload.new);
      }
    )
    .subscribe();

  // Return an unsubscribe function
  return () => {
    supabase.removeChannel(subscription);
  };
};

export default {
  initializeApp,
  setupNotificationSubscription,
};
