/**
 * NotificationScheduler
 *
 * A service for scheduling and processing notifications at specified times.
 * Supports various notification types, recurring schedules, and handles
 * delivery tracking and retries.
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { ExtendedNotificationInsert, Notification } from '../types/supabase';
import notificationService, { NotificationType, NotificationPriority } from './notificationService';

// Task names
const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';
const MAX_RETRY_COUNT = 3;
const NOTIFICATION_CHECK_INTERVAL = 60000; // 1 minute in milliseconds

// Define recurrence pattern interface
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // e.g., every 2 weeks
  endDate?: string | null; // JSON compatible string date
  maxOccurrences?: number;
}

// Notification request interface for scheduling
export interface NotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  scheduledFor: Date;
  deepLinkUrl?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  recurrence?: RecurrencePattern;
}

/**
 * NotificationScheduler class for managing and processing scheduled notifications
 */
export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private intervalIds: Record<string, NodeJS.Timeout> = {};
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  /**
   * Initialize the notification scheduler
   * Sets up background tasks and registers task handlers
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Register the background task
    if (!TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK)) {
      TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
        try {
          const notificationsProcessed = await this.processScheduledNotifications();
          console.log(`Processed ${notificationsProcessed} notifications`);
          return notificationsProcessed > 0
            ? BackgroundFetch.BackgroundFetchResult.NewData
            : BackgroundFetch.BackgroundFetchResult.NoData;
        } catch (error) {
          console.error('Error processing scheduled notifications:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    }

    // Register background fetch
    if (Platform.OS !== 'web') {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 15 * 60, // 15 minutes in seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });

      // Also register in the foreground for more immediate processing on app open
      this.startForegroundPolling();
    } else {
      // For web, use setInterval instead of node-schedule
      this.setupWebScheduler();
    }

    this.isInitialized = true;
  }

  /**
   * Start foreground polling for notifications
   * Used when the app is in the foreground to provide timely notifications
   */
  private startForegroundPolling(): void {
    // Clear any existing interval
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }

    // Set up new interval - check every minute
    this.pollingIntervalId = setInterval(async () => {
      try {
        await this.processScheduledNotifications();
      } catch (error) {
        console.error('Error in foreground notification polling:', error);
      }
    }, NOTIFICATION_CHECK_INTERVAL);
  }

  /**
   * Setup web-based scheduling using setInterval
   * This is used when running on the web
   */
  private setupWebScheduler(): void {
    // Check for notifications every minute
    setInterval(async () => {
      try {
        const count = await this.processScheduledNotifications();
        console.log(`Processed ${count} notifications in web scheduler`);
      } catch (error) {
        console.error('Error in web scheduling:', error);
      }
    }, NOTIFICATION_CHECK_INTERVAL);
  }

  /**
   * Schedule a notification for delivery at a specific time
   *
   * @param request The notification request details
   * @returns Promise resolving to the created notification
   */
  public async scheduleNotification(request: NotificationRequest): Promise<Notification> {
    try {
      // Validate scheduled time is in the future
      const scheduledTime = new Date(request.scheduledFor);
      if (scheduledTime <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      // Create notification in database
      const notification = await notificationService.scheduleNotification({
        user_id: request.userId,
        title: request.title,
        message: request.message,
        type: request.type,
        is_read: false,
        priority: request.priority || NotificationPriority.MEDIUM,
        metadata: {
          ...(request.metadata || {}),
          recurrence: request.recurrence
            ? {
                frequency: request.recurrence.frequency,
                interval: request.recurrence.interval,
                endDate: request.recurrence.endDate,
                maxOccurrences: request.recurrence.maxOccurrences,
              }
            : undefined,
          retry_count: 0, // Initialize retry count
        },
        scheduled_for: scheduledTime.toISOString(),
        related_entity_id: request.relatedEntityId,
        related_entity_type: request.relatedEntityType,
        deep_link_url: request.deepLinkUrl,
        status: 'pending',
      });

      // If it's a short-term notification (within the next hour),
      // schedule it specifically to ensure prompt delivery
      if (scheduledTime.getTime() - new Date().getTime() < 60 * 60 * 1000) {
        this.scheduleSpecificNotification(notification.id, scheduledTime);
      }

      return notification;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Process any notifications that are due to be sent
   * This is called by background tasks and polling
   *
   * @returns Number of notifications processed
   */
  public async processScheduledNotifications(): Promise<number> {
    try {
      // Get current time to find notifications that are due
      const now = new Date();

      // Query for notifications that are due to be sent
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .lt('scheduled_for', now.toISOString())
        .eq('is_read', false)
        .order('scheduled_for', { ascending: true })
        .limit(20); // Process in batches to avoid overloading

      if (error) {
        throw error;
      }

      if (!notifications || notifications.length === 0) {
        return 0;
      }

      // Process each notification
      let processedCount = 0;

      for (const notification of notifications) {
        const metadata = (notification.metadata as Record<string, any>) || {};
        const status = metadata.status || 'pending';

        // Only process pending notifications
        if (status === 'pending') {
          const success = await this.deliverNotification(notification);

          if (success) {
            processedCount++;

            // If this is a recurring notification, schedule the next occurrence
            if (metadata.recurrence) {
              await this.scheduleNextRecurrence(notification);
            }
          }
        }
      }

      return processedCount;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      return 0;
    }
  }

  /**
   * Schedule a specific notification using setTimeout
   * This is used for short-term notifications that need to be delivered promptly
   *
   * @param notificationId ID of the notification to schedule
   * @param scheduledTime Time to deliver the notification
   */
  private scheduleSpecificNotification(notificationId: string, scheduledTime: Date): void {
    // Cancel any existing timeout for this notification
    if (this.intervalIds[notificationId]) {
      clearTimeout(this.intervalIds[notificationId]);
    }

    // Calculate delay in milliseconds
    const delay = Math.max(0, scheduledTime.getTime() - new Date().getTime());

    // Schedule a new timeout
    this.intervalIds[notificationId] = setTimeout(async () => {
      try {
        await this.processSpecificNotification(notificationId);
        // Remove the timeout from our tracking object after it's completed
        delete this.intervalIds[notificationId];
      } catch (error) {
        console.error(`Error processing notification ${notificationId}:`, error);
      }
    }, delay);
  }

  /**
   * Process a specific notification by ID
   *
   * @param notificationId ID of the notification to process
   * @returns Whether the notification was successfully processed
   */
  private async processSpecificNotification(notificationId: string): Promise<boolean> {
    try {
      // Get the notification
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .limit(1);

      if (error || !notifications || notifications.length === 0) {
        throw error || new Error(`Notification with ID ${notificationId} not found`);
      }

      return await this.deliverNotification(notifications[0]);
    } catch (error) {
      console.error(`Error processing specific notification ${notificationId}:`, error);
      return false;
    }
  }

  /**
   * Deliver a notification to the user
   *
   * @param notification The notification to deliver
   * @returns Whether the delivery was successful
   */
  private async deliverNotification(notification: Notification): Promise<boolean> {
    try {
      const metadata = (notification.metadata as Record<string, any>) || {};
      const retryCount = metadata.retry_count || 0;

      // Update notification to mark as processing
      await supabase
        .from('notifications')
        .update({
          metadata: {
            ...metadata,
            status: 'processing',
            processing_start: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      // TODO: Implement actual notification delivery via push notification service
      // This would involve calling a push notification service or similar
      console.log(`Delivering notification: ${notification.id} - ${notification.title}`);

      // For now, we'll just mark it as sent successfully
      await supabase
        .from('notifications')
        .update({
          metadata: {
            ...metadata,
            status: 'sent',
            delivered_at: new Date().toISOString(),
            retry_count: retryCount,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      return true;
    } catch (error) {
      console.error(`Error delivering notification ${notification.id}:`, error);

      // Update retry count and status
      const metadata = (notification.metadata as Record<string, any>) || {};
      const retryCount = (metadata.retry_count || 0) + 1;
      const status = retryCount >= MAX_RETRY_COUNT ? 'failed' : 'pending';

      // Update notification with retry information
      await supabase
        .from('notifications')
        .update({
          metadata: {
            ...metadata,
            status,
            retry_count: retryCount,
            last_error: String(error),
            last_retry: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      return false;
    }
  }

  /**
   * Cancel a scheduled notification
   *
   * @param notificationId ID of the notification to cancel
   * @returns Whether the cancellation was successful
   */
  public async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      // Get the notification
      const notification = await notificationService.getNotificationById(notificationId);
      if (!notification) {
        throw new Error(`Notification with ID ${notificationId} not found`);
      }

      const metadata = (notification.metadata as Record<string, any>) || {};

      // Update notification to mark as cancelled
      await supabase
        .from('notifications')
        .update({
          metadata: {
            ...metadata,
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      // Cancel any specific timeout for this notification
      if (this.intervalIds[notificationId]) {
        clearTimeout(this.intervalIds[notificationId]);
        delete this.intervalIds[notificationId];
      }

      return true;
    } catch (error) {
      console.error(`Error cancelling notification ${notificationId}:`, error);
      return false;
    }
  }

  /**
   * Schedule the next occurrence of a recurring notification
   *
   * @param notification The current notification to base recurrence on
   */
  private async scheduleNextRecurrence(notification: Notification): Promise<void> {
    try {
      const metadata = (notification.metadata as Record<string, any>) || {};
      const recurrence = metadata.recurrence as RecurrencePattern;

      if (!recurrence) {
        return;
      }

      // Check if we've reached max occurrences
      const currentOccurrence = metadata.occurrence || 1;
      if (recurrence.maxOccurrences && currentOccurrence >= recurrence.maxOccurrences) {
        return;
      }

      // Check if we've reached end date
      if (recurrence.endDate) {
        const endDate = new Date(recurrence.endDate);
        if (new Date() >= endDate) {
          return;
        }
      }

      // Calculate next occurrence date
      const lastScheduledDate = new Date(metadata.scheduled_for || new Date());
      let nextDate = new Date(lastScheduledDate);

      switch (recurrence.frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + recurrence.interval);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7 * recurrence.interval);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
          break;
      }

      // Create the next occurrence
      await this.scheduleNotification({
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type as NotificationType,
        scheduledFor: nextDate,
        deepLinkUrl: metadata.deep_link_url,
        relatedEntityId: metadata.related_entity_id,
        relatedEntityType: metadata.related_entity_type,
        priority: notification.priority as NotificationPriority,
        metadata: {
          ...metadata,
          occurrence: currentOccurrence + 1,
          previous_occurrence_id: notification.id,
        },
        recurrence,
      });
    } catch (error) {
      console.error('Error scheduling next recurrence:', error);
    }
  }

  /**
   * Reschedule a notification for a new time
   *
   * @param notificationId ID of the notification to reschedule
   * @param newScheduledTime New time to deliver the notification
   */
  public async rescheduleNotification(
    notificationId: string,
    newScheduledTime: Date
  ): Promise<boolean> {
    try {
      // Validate the new time is in the future
      if (newScheduledTime <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      // Get the notification
      const notification = await notificationService.getNotificationById(notificationId);
      if (!notification) {
        throw new Error(`Notification with ID ${notificationId} not found`);
      }

      const metadata = (notification.metadata as Record<string, any>) || {};

      // Only pending notifications can be rescheduled
      if (metadata.status !== 'pending') {
        throw new Error('Only pending notifications can be rescheduled');
      }

      // Update the notification with the new scheduled time
      await supabase
        .from('notifications')
        .update({
          metadata: {
            ...metadata,
            rescheduled_at: new Date().toISOString(),
            previous_scheduled_for: metadata.scheduled_for,
          },
          scheduled_for: newScheduledTime.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      // Cancel any existing specific timeout and schedule a new one if needed
      if (this.intervalIds[notificationId]) {
        clearTimeout(this.intervalIds[notificationId]);
      }

      // If it's within the next hour, schedule a specific job
      if (newScheduledTime.getTime() - new Date().getTime() < 60 * 60 * 1000) {
        this.scheduleSpecificNotification(notificationId, newScheduledTime);
      }

      return true;
    } catch (error) {
      console.error('Error rescheduling notification:', error);
      return false;
    }
  }

  /**
   * Cleanup method to cancel all timers
   * Should be called when the app is shutting down
   */
  public cleanup(): void {
    // Clear all specific notification timeouts
    Object.values(this.intervalIds).forEach(clearTimeout);
    this.intervalIds = {};

    // Clear polling interval if it exists
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }
}

// Export singleton instance
export default NotificationScheduler.getInstance();
