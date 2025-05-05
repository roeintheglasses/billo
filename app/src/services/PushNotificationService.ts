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

// Define a notification channel for Android
const DEFAULT_CHANNEL_ID = 'default';
// The channel for high priority notifications
const HIGH_PRIORITY_CHANNEL_ID = 'high-priority';
// Project ID from app.json
const PROJECT_ID = Constants?.expoConfig?.extra?.eas?.projectId || 'billo-app';

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

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: boolean | string;
  channelId?: string;
  categoryId?: string;
}

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
   * Get the singleton instance of PushNotificationService
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
        const { notification } = response;
        const data = notification.request.content.data as Record<string, any>;

        // Handle the notification tap based on deepLink or type
        if (data?.deepLink) {
          // Navigation would be handled here
          console.log(`Should navigate to: ${data.deepLink}`);
        } else if (data?.type) {
          this.handleNotificationByType(data.type as NotificationType, data);
        }
      }
    );
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

      // Get the Expo push token
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
      // Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log('No authenticated user to save push token for');
        return;
      }

      // Check if token already exists
      const { data, error } = await supabase
        .from('user_push_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('token', token);

      if (error) {
        throw error;
      }

      // If token doesn't exist, save it
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase.from('user_push_tokens').insert({
          user_id: user.id,
          token,
          device_type: Platform.OS,
          is_active: true,
        });

        if (insertError) {
          throw insertError;
        }

        console.log('Push token saved to database');
      } else {
        console.log('Push token already exists in database');
      }
    } catch (error) {
      console.error('Failed to save push token:', error);
      throw error;
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
   * Handle notification based on notification type
   */
  private handleNotificationByType(type: NotificationType, data: Record<string, any>): void {
    switch (type) {
      case NotificationType.SUBSCRIPTION_DUE:
        console.log('Handling subscription due notification');
        // Additional handling for subscription due
        break;
      case NotificationType.PAYMENT_REMINDER:
        console.log('Handling payment reminder notification');
        // Additional handling for payment reminder
        break;
      case NotificationType.PRICE_CHANGE:
        console.log('Handling price change notification');
        // Additional handling for price change
        break;
      case NotificationType.CANCELLATION_DEADLINE:
        console.log('Handling cancellation deadline notification');
        // Additional handling for cancellation deadline
        break;
      case NotificationType.SYSTEM:
        console.log('Handling system notification');
        // Additional handling for system notifications
        break;
      default:
        console.log(`Handling notification of type: ${type}`);
        break;
    }
  }

  /**
   * Send push notification to a user
   */
  public async sendPushNotification(
    userId: string,
    notification: PushNotificationPayload
  ): Promise<boolean> {
    try {
      // Get user's push tokens
      const { data: tokens, error } = await supabase
        .from('user_push_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      if (!tokens || tokens.length === 0) {
        console.log('No active push tokens found for user:', userId);
        return false;
      }

      // This would typically be replaced with a call to your push notification service/backend
      console.log(`Would send push notification to tokens: ${tokens.map(t => t.token).join(', ')}`);
      console.log('Notification payload:', notification);

      // For local testing, we'll send a local notification
      await this.scheduleLocalNotification(notification);

      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }

  /**
   * Check push notification permissions
   */
  public async checkPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
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
   * Clean up listeners when service is destroyed
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
