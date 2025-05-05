/**
 * PushNotificationService
 *
 * Handles push notification functionality for the application using expo-notifications.
 * Responsible for:
 * - Requesting permission for push notifications
 * - Registering device for push notifications
 * - Managing notification tokens
 * - Handling incoming notifications
 * - Setting up notification handlers and channels
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { NotificationType, NotificationPriority } from './notificationService';
import DeepLinkService from './DeepLinkService';

// Define a notification channel for Android
const DEFAULT_CHANNEL_ID = 'default';
// The channel for high priority notifications
const HIGH_PRIORITY_CHANNEL_ID = 'high-priority';
// Project ID from app.json
const PROJECT_ID =
  Constants?.expoConfig?.extra?.eas?.projectId || 'bab82c4e-3feb-4765-8a70-dc2bc99c6b11';

// Notification category identifiers
export enum NotificationCategory {
  PAYMENT_REMINDER = 'payment_reminder',
  SUBSCRIPTION_RENEWAL = 'subscription_renewal',
  PRICE_CHANGE = 'price_change',
  GENERAL = 'general',
}

// Notification action identifiers
export enum NotificationAction {
  MARK_PAID = 'mark_paid',
  SNOOZE = 'snooze',
  VIEW = 'view',
  DISMISS = 'dismiss',
}

// Payload structure for push notification
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: boolean;
  channelId?: string;
  categoryId?: string;
}

/**
 * Default notification behavior handler
 * This determines how notifications are displayed when the app is in the foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Class to handle all push notification functionality
 */
export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoPushToken?: Notifications.ExpoPushToken;
  private notificationListener?: Notifications.Subscription;
  private responseListener?: Notifications.Subscription;
  private initialized = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get or create the singleton instance
   */
  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notification service
   * - Creates notification channels
   * - Sets up notification listeners
   * - Registers for push notifications
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Set up notification categories for actions
      await this.createNotificationCategories();

      // Set up notification listeners
      this.setupNotificationListeners();

      // Register for push notifications if on a physical device
      if (Device.isDevice) {
        await this.registerForPushNotifications();
      } else {
        console.log('Push notifications require a physical device');
      }

      this.initialized = true;
      console.log('Push notification service initialized');
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      throw error;
    }
  }

  /**
   * Create notification channels for Android
   */
  private async createNotificationChannels(): Promise<void> {
    try {
      // Default channel
      await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2196F3',
        sound: 'default',
      });

      // High priority channel
      await Notifications.setNotificationChannelAsync(HIGH_PRIORITY_CHANNEL_ID, {
        name: 'High Priority',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250, 250, 250],
        lightColor: '#FF5252',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      console.log('Notification channels created');
    } catch (error) {
      console.error('Failed to create notification channels:', error);
      throw error;
    }
  }

  /**
   * Set up notification categories with action buttons
   */
  private async createNotificationCategories(): Promise<void> {
    try {
      // Payment reminder category with actions
      await this.createNotificationCategory(NotificationCategory.PAYMENT_REMINDER, [
        {
          identifier: NotificationAction.MARK_PAID,
          buttonTitle: 'Mark Paid',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: NotificationAction.SNOOZE,
          buttonTitle: 'Snooze',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);

      // Subscription renewal category with actions
      await this.createNotificationCategory(NotificationCategory.SUBSCRIPTION_RENEWAL, [
        {
          identifier: NotificationAction.VIEW,
          buttonTitle: 'View',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: NotificationAction.SNOOZE,
          buttonTitle: 'Snooze',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);

      // Price change category with actions
      await this.createNotificationCategory(NotificationCategory.PRICE_CHANGE, [
        {
          identifier: NotificationAction.VIEW,
          buttonTitle: 'View Details',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: NotificationAction.DISMISS,
          buttonTitle: 'Dismiss',
          options: {
            isDestructive: true,
            isAuthenticationRequired: false,
          },
        },
      ]);

      // General category with basic actions
      await this.createNotificationCategory(NotificationCategory.GENERAL, [
        {
          identifier: NotificationAction.VIEW,
          buttonTitle: 'View',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);

      console.log('Notification categories created');
    } catch (error) {
      console.error('Failed to create notification categories:', error);
      throw error;
    }
  }

  /**
   * Set up notification listeners for receiving and responding to notifications
   */
  private setupNotificationListeners(): void {
    // Listener for when a notification is received while the app is in the foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        console.log('Notification received in foreground:', notification);
        // Extract notification data
        const { title, body, data } = notification.request.content;

        // Handle notification based on type
        if (data?.type) {
          this.handleNotificationByType(data.type as NotificationType, data);
        }
      }
    );

    // Listener for when a user taps on or interacts with a notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        console.log('Notification response received:', response);

        // Check if this is an action button press or a regular tap
        if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
          // Handle action button press
          this.handleNotificationAction(response);
        } else {
          // Handle regular notification tap (deep link)
          DeepLinkService.handleNotificationResponse(response);
        }
      }
    );
  }

  /**
   * Handle notification action button press
   */
  private async handleNotificationAction(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const { notification } = response;
    const { data } = notification.request.content;
    const actionId = response.actionIdentifier;

    console.log(`Handling notification action: ${actionId}`, data);

    switch (actionId) {
      case NotificationAction.MARK_PAID:
        await this.handleMarkAsPaidAction(data);
        break;
      case NotificationAction.SNOOZE:
        await this.handleSnoozeAction(data);
        break;
      case NotificationAction.VIEW:
        // Use the deep link handler to navigate
        DeepLinkService.handleNotificationResponse(response);
        break;
      case NotificationAction.DISMISS:
        // Just dismiss the notification - no additional action needed
        break;
      default:
        console.log(`Unknown action identifier: ${actionId}`);
    }
  }

  /**
   * Handle the "Mark as Paid" action
   */
  private async handleMarkAsPaidAction(data: Record<string, any>): Promise<void> {
    try {
      // Get necessary identifiers from notification data
      const { subscriptionId, paymentId } = data;

      // Implement the mark as paid logic
      if (paymentId) {
        console.log(`Marking payment ${paymentId} as paid`);
        // Call the payment service to mark as paid
        // This would be implemented when the payment system is built
      } else if (subscriptionId) {
        console.log(`Marking latest payment for subscription ${subscriptionId} as paid`);
        // Find the latest payment for this subscription and mark it as paid
        // This would be implemented when the payment system is built
      }

      // Show a success notification
      await this.scheduleLocalNotification({
        title: 'Payment Recorded',
        body: 'Your payment has been marked as paid.',
        categoryId: NotificationCategory.GENERAL,
      });
    } catch (error) {
      console.error('Failed to mark payment as paid:', error);

      // Show an error notification
      await this.scheduleLocalNotification({
        title: 'Action Failed',
        body: 'Failed to mark payment as paid. Please try again.',
        categoryId: NotificationCategory.GENERAL,
      });
    }
  }

  /**
   * Handle the "Snooze" action
   */
  private async handleSnoozeAction(data: Record<string, any>): Promise<void> {
    try {
      // Get necessary identifiers from notification data
      const { notificationId, type, relatedEntityId, title, body } = data;

      console.log(`Snoozing notification: ${notificationId} for ${type}`);

      // Default snooze time: 1 day (in milliseconds)
      const snoozeTime = 24 * 60 * 60 * 1000;
      const snoozeUntil = new Date(Date.now() + snoozeTime);

      // Reschedule the notification for later
      await this.scheduleLocalNotification({
        title: title || 'Reminder',
        body: body || `You have a snoozed ${type} reminder`,
        data: {
          ...data,
          snoozeCount: (data.snoozeCount || 0) + 1,
        },
        categoryId: data.categoryId || NotificationCategory.GENERAL,
      });

      // Show a confirmation
      await this.scheduleLocalNotification({
        title: 'Reminder Snoozed',
        body: "We'll remind you again tomorrow.",
        categoryId: NotificationCategory.GENERAL,
      });
    } catch (error) {
      console.error('Failed to snooze notification:', error);

      // Show an error notification
      await this.scheduleLocalNotification({
        title: 'Action Failed',
        body: 'Failed to snooze reminder. Please try again.',
        categoryId: NotificationCategory.GENERAL,
      });
    }
  }

  /**
   * Handle notification by type
   */
  private handleNotificationByType(type: NotificationType, data: Record<string, any>): void {
    console.log(`Handling notification of type: ${type}`, data);
    // Add type-specific handling if needed
  }

  /**
   * Register for push notifications
   * Requests permission and gets the Expo push token
   */
  public async registerForPushNotifications(): Promise<Notifications.ExpoPushToken | undefined> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If not granted, request permission
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: false,
          },
        });
        finalStatus = status;
      }

      // If permission not granted, return undefined
      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return undefined;
      }

      // Get the Expo push token - using only projectId, not experienceId
      this.expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: PROJECT_ID,
      });

      console.log('Push registration successful, token:', this.expoPushToken.data);

      // Store the token to database
      await this.savePushToken(this.expoPushToken.data);

      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      throw error;
    }
  }

  /**
   * Save push token to the database for the current user
   */
  private async savePushToken(token: string): Promise<void> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.log('No authenticated user to save push token for');
        return;
      }

      const userId = userData.user.id;

      // Check if token already exists
      const { data: existingToken, error: queryError } = await supabase
        .from('user_push_tokens')
        .select('*')
        .eq('token', token)
        .eq('user_id', userId)
        .maybeSingle();

      if (queryError) {
        // Table might not exist, log the error but don't fail
        console.log('Error querying user_push_tokens table:', queryError.message);
        return;
      }

      if (!existingToken) {
        // Insert new token
        const { error: insertError } = await supabase.from('user_push_tokens').insert({
          user_id: userId,
          token: token,
          device_type: Platform.OS,
          device_id: Device.deviceName || 'unknown',
          device_name: Device.modelName || 'unknown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          // Table might not exist, log the error but don't fail
          console.log('Error inserting device token:', insertError.message);
          return;
        }

        console.log('Push token saved to database');
      } else {
        // Update last_used_at timestamp
        const { error: updateError } = await supabase
          .from('user_push_tokens')
          .update({
            updated_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id);

        if (updateError) {
          console.log('Error updating token last used time:', updateError.message);
        } else {
          console.log('Push token last used time updated');
        }
      }
    } catch (error) {
      // Log the error but don't rethrow, to prevent app crashes
      console.error('Failed to save push token:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  public async scheduleLocalNotification(notification: PushNotificationPayload): Promise<string> {
    try {
      const channelId =
        notification.channelId ||
        (notification.data?.priority === NotificationPriority.HIGH
          ? HIGH_PRIORITY_CHANNEL_ID
          : DEFAULT_CHANNEL_ID);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          badge: notification.badge,
          sound: notification.sound !== undefined ? notification.sound : true,
          categoryIdentifier: notification.categoryId,
        },
        trigger: {
          channelId,
          seconds: 1, // Almost immediate delivery
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a notification with deep link and quick actions
   */
  public async scheduleNotificationWithActions(
    notification: PushNotificationPayload,
    categoryId: NotificationCategory,
    deepLink?: string
  ): Promise<string> {
    try {
      // Add deep link and category to the notification data
      const enhancedData = {
        ...(notification.data || {}),
        deepLink,
      };

      return await this.scheduleLocalNotification({
        ...notification,
        data: enhancedData,
        categoryId,
      });
    } catch (error) {
      console.error('Failed to schedule notification with actions:', error);
      throw error;
    }
  }

  /**
   * Create a notification category with action buttons
   */
  public async createNotificationCategory(
    identifier: string,
    actions: Notifications.NotificationAction[],
    options?: Notifications.NotificationCategoryOptions
  ): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(identifier, actions, options);
    } catch (error) {
      console.error('Failed to create notification category:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  public async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel scheduled notification:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications
   */
  public async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * Dismiss all notifications
   */
  public async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
      throw error;
    }
  }

  /**
   * Get the last notification response (for handling app opens from notifications)
   */
  public async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      console.error('Failed to get last notification response:', error);
      throw error;
    }
  }

  /**
   * Cleanup function to remove listeners
   */
  public cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default PushNotificationService.getInstance();
