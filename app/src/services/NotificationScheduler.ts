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
import schedule from 'node-schedule';
import { supabase } from './supabase';
import { ExtendedNotificationInsert, Notification } from '../types/supabase';
import notificationService, { NotificationType, NotificationPriority } from './notificationService';

// Task names
const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';
const MAX_RETRY_COUNT = 3;

// Define recurrence pattern interface
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // e.g., every 2 weeks
  endDate?: string; // Changed from Date to string for JSON compatibility
  maxOccurrences?: number;
}

// Notification request interface
export interface NotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  scheduledFor: Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
  deepLinkUrl?: string;
  priority?: NotificationPriority;
  recurrence?: RecurrencePattern;
  metadata?: Record<string, any>;
}

// Notification status types
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

/**
 * NotificationScheduler class for managing and processing scheduled notifications
 */
export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private scheduleJobs: Record<string, schedule.Job> = {};
  private isInitialized = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of NotificationScheduler
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
      // For web, use node-schedule for server-side scheduling
      this.setupServerScheduler();
    }

    this.isInitialized = true;
  }

  /**
   * Start polling for scheduled notifications in the foreground
   * This is useful for when the app is open and we want more immediate notification delivery
   */
  private startForegroundPolling(): void {
    // Check every minute while the app is in the foreground
    setInterval(() => {
      this.processScheduledNotifications()
        .then(count => console.log(`Processed ${count} notifications in foreground poll`))
        .catch(error => console.error('Error in foreground polling:', error));
    }, 60000); // 1 minute
  }

  /**
   * Setup server-side scheduling using node-schedule
   * This is used when running on the web/server
   */
  private setupServerScheduler(): void {
    // Schedule job to run every minute to check for notifications
    schedule.scheduleJob('*/1 * * * *', async () => {
      try {
        const count = await this.processScheduledNotifications();
        console.log(`Processed ${count} notifications in server-side scheduler`);
      } catch (error) {
        console.error('Error in server-side scheduling:', error);
      }
    });
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
                endDate: request.recurrence.endDate?.toISOString(),
                maxOccurrences: request.recurrence.maxOccurrences,
              }
            : undefined, // Convert to JSON-compatible object
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
   * Schedule multiple notifications in batch
   *
   * @param requests Array of notification requests
   * @returns Promise resolving to created notifications
   */
  public async bulkScheduleNotifications(requests: NotificationRequest[]): Promise<Notification[]> {
    const notifications: Notification[] = [];

    // Process in batches of 10 to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const promises = batch.map(request => this.scheduleNotification(request));
      const batchResults = await Promise.all(promises);
      notifications.push(...batchResults);
    }

    return notifications;
  }

  /**
   * Cancel a scheduled notification
   *
   * @param notificationId ID of the notification to cancel
   * @returns Promise resolving to success status
   */
  public async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    try {
      // Get the notification to verify it exists and is pending
      const notification = await notificationService.getNotificationById(notificationId);

      if (!notification) {
        throw new Error(`Notification with ID ${notificationId} not found`);
      }

      // Check if notification has metadata with status
      const metadata = (notification.metadata as Record<string, any>) || {};
      if (metadata.status !== 'pending') {
        throw new Error(`Cannot cancel notification that is not pending`);
      }

      // Update notification status
      await supabase
        .from('notifications')
        .update({
          metadata: { ...metadata, status: 'cancelled' },
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      // Cancel any specific scheduled job if it exists
      if (this.scheduleJobs[notificationId]) {
        this.scheduleJobs[notificationId].cancel();
        delete this.scheduleJobs[notificationId];
      }

      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  }

  /**
   * Schedule a specific notification using node-schedule
   * This is used for short-term notifications that need to be delivered promptly
   *
   * @param notificationId ID of the notification to schedule
   * @param scheduledTime Time to deliver the notification
   */
  private scheduleSpecificNotification(notificationId: string, scheduledTime: Date): void {
    // Cancel any existing job for this notification
    if (this.scheduleJobs[notificationId]) {
      this.scheduleJobs[notificationId].cancel();
    }

    // Schedule a new job
    this.scheduleJobs[notificationId] = schedule.scheduleJob(scheduledTime, async () => {
      try {
        await this.processSpecificNotification(notificationId);
        // Remove the job from our tracking object after it's completed
        delete this.scheduleJobs[notificationId];
      } catch (error) {
        console.error(`Error processing notification ${notificationId}:`, error);
      }
    });
  }

  /**
   * Process a specific notification by ID
   *
   * @param notificationId ID of the notification to process
   * @returns Promise resolving to success status
   */
  private async processSpecificNotification(notificationId: string): Promise<boolean> {
    try {
      const notification = await notificationService.getNotificationById(notificationId);
      if (!notification) {
        throw new Error(`Notification with ID ${notificationId} not found`);
      }

      const metadata = (notification.metadata as Record<string, any>) || {};
      if (metadata.status !== 'pending') {
        // Already processed
        return false;
      }

      // In a real implementation, this would send push notifications,
      // emails, or use other delivery channels
      // For now, just mark as sent and handle any recurrence
      await this.markNotificationAsSent(notificationId);

      // Handle recurrence if specified
      if (metadata.recurrence) {
        await this.scheduleNextRecurrence(notification);
      }

      return true;
    } catch (error) {
      console.error(`Error processing notification ${notificationId}:`, error);
      await this.handleNotificationFailure(notificationId, String(error));
      return false;
    }
  }

  /**
   * Process all due scheduled notifications
   *
   * @returns Promise resolving to the number of notifications processed
   */
  public async processScheduledNotifications(): Promise<number> {
    try {
      const now = new Date().toISOString();

      // Fetch pending notifications that are due
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .lte('scheduled_for', now)
        .eq('status', 'pending')
        .limit(50); // Process in batches

      if (error) throw error;
      if (!data || data.length === 0) {
        return 0;
      }

      // Process each notification
      let processedCount = 0;
      for (const notification of data) {
        try {
          const processed = await this.processSpecificNotification(notification.id);
          if (processed) {
            processedCount++;
          }
        } catch (error) {
          console.error(`Error processing notification ${notification.id}:`, error);
          // Continue with other notifications even if one fails
        }
      }

      return processedCount;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      throw new Error(`Failed to process scheduled notifications: ${error}`);
    }
  }

  /**
   * Handle a notification delivery failure
   * Implements retry logic with exponential backoff
   *
   * @param notificationId ID of the failed notification
   * @param errorMessage Error message from the failure
   */
  private async handleNotificationFailure(
    notificationId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      const notification = await notificationService.getNotificationById(notificationId);
      if (!notification) {
        return;
      }

      const metadata = (notification.metadata as Record<string, any>) || {};
      const retryCount = (metadata.retry_count || 0) + 1;

      // If exceeded max retries, mark as failed
      if (retryCount > MAX_RETRY_COUNT) {
        await supabase
          .from('notifications')
          .update({
            metadata: {
              ...metadata,
              status: 'failed',
              retry_count: retryCount,
              last_error: errorMessage,
              failed_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', notificationId);
        return;
      }

      // Calculate exponential backoff time
      // 2^retry_count minutes (e.g., 2, 4, 8 minutes)
      const backoffMinutes = Math.pow(2, retryCount);
      const nextTry = new Date();
      nextTry.setMinutes(nextTry.getMinutes() + backoffMinutes);

      // Schedule the retry
      await supabase
        .from('notifications')
        .update({
          metadata: {
            ...metadata,
            retry_count: retryCount,
            last_error: errorMessage,
            last_retry_at: new Date().toISOString(),
          },
          scheduled_for: nextTry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      // Schedule a specific job for this retry
      this.scheduleSpecificNotification(notificationId, nextTry);
    } catch (error) {
      console.error(`Error handling notification failure for ${notificationId}:`, error);
    }
  }

  /**
   * Mark a notification as sent
   *
   * @param notificationId ID of the notification
   */
  private async markNotificationAsSent(notificationId: string): Promise<void> {
    const notification = await notificationService.getNotificationById(notificationId);
    if (!notification) {
      return;
    }

    const metadata = (notification.metadata as Record<string, any>) || {};

    await supabase
      .from('notifications')
      .update({
        metadata: {
          ...metadata,
          status: 'sent',
          sent_at: new Date().toISOString(),
        },
        is_read: false, // Ensure it's marked as unread for the user to see
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId);
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

      // Create the next recurrence
      await this.scheduleNotification({
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type as NotificationType,
        scheduledFor: nextDate,
        relatedEntityId: metadata.related_entity_id,
        relatedEntityType: metadata.related_entity_type,
        deepLinkUrl: metadata.deep_link_url,
        priority: notification.priority as NotificationPriority,
        recurrence,
        metadata: {
          ...metadata,
          occurrence: currentOccurrence + 1,
          previous_notification_id: notification.id,
        },
      });
    } catch (error) {
      console.error('Error scheduling recurrence:', error);
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

      // Cancel any existing specific job and schedule a new one if needed
      if (this.scheduleJobs[notificationId]) {
        this.scheduleJobs[notificationId].cancel();
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
   * Create a notification for payment reminders
   *
   * @param userId User ID to notify
   * @param subscriptionId Subscription ID
   * @param subscriptionName Subscription name
   * @param dueDate Payment due date
   * @param amount Payment amount
   * @param currency Currency code
   * @param daysBeforeDue Days before due date to send reminder
   * @returns Promise resolving to the created notification
   */
  public async schedulePaymentReminder(
    userId: string,
    subscriptionId: string,
    subscriptionName: string,
    dueDate: Date,
    amount: number,
    currency: string,
    daysBeforeDue: number = 3
  ): Promise<Notification> {
    // Calculate the reminder date
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - daysBeforeDue);

    // Format amount with currency
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    const formattedAmount = formatter.format(amount);

    return this.scheduleNotification({
      userId,
      title: `Payment Reminder: ${subscriptionName}`,
      message: `Your payment of ${formattedAmount} for ${subscriptionName} is due in ${daysBeforeDue} days.`,
      type: NotificationType.PAYMENT_REMINDER,
      scheduledFor: reminderDate,
      relatedEntityId: subscriptionId,
      relatedEntityType: 'subscription',
      deepLinkUrl: `/subscriptions/${subscriptionId}`,
      priority: NotificationPriority.HIGH,
      metadata: {
        amount,
        currency,
        dueDate: dueDate.toISOString(),
        daysBeforeDue,
      },
    });
  }

  /**
   * Schedule a cancellation deadline notification
   *
   * @param userId User ID to notify
   * @param subscriptionId Subscription ID
   * @param subscriptionName Subscription name
   * @param deadlineDate Cancellation deadline date
   * @param daysBeforeDeadline Days before deadline to notify
   * @returns Promise resolving to the created notification
   */
  public async scheduleCancellationDeadline(
    userId: string,
    subscriptionId: string,
    subscriptionName: string,
    deadlineDate: Date,
    daysBeforeDeadline: number = 5
  ): Promise<Notification> {
    // Calculate the notification date
    const notificationDate = new Date(deadlineDate);
    notificationDate.setDate(notificationDate.getDate() - daysBeforeDeadline);

    return this.scheduleNotification({
      userId,
      title: 'Cancellation Deadline Approaching',
      message: `You have ${daysBeforeDeadline} days left to cancel your ${subscriptionName} subscription before renewal.`,
      type: NotificationType.CANCELLATION_DEADLINE,
      scheduledFor: notificationDate,
      relatedEntityId: subscriptionId,
      relatedEntityType: 'subscription',
      deepLinkUrl: `/subscriptions/${subscriptionId}`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        deadlineDate: deadlineDate.toISOString(),
        daysBeforeDeadline,
      },
    });
  }

  /**
   * Schedule a price change notification
   *
   * @param userId User ID to notify
   * @param subscriptionId Subscription ID
   * @param subscriptionName Subscription name
   * @param oldPrice Old price
   * @param newPrice New price
   * @param currency Currency code
   * @param effectiveDate Date when price change takes effect
   * @param daysBeforeChange Days before change to notify
   * @returns Promise resolving to the created notification
   */
  public async schedulePriceChange(
    userId: string,
    subscriptionId: string,
    subscriptionName: string,
    oldPrice: number,
    newPrice: number,
    currency: string,
    effectiveDate: Date,
    daysBeforeChange: number = 7
  ): Promise<Notification> {
    // Calculate the notification date
    const notificationDate = new Date(effectiveDate);
    notificationDate.setDate(notificationDate.getDate() - daysBeforeChange);

    // Format prices with currency
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    const formattedOldPrice = formatter.format(oldPrice);
    const formattedNewPrice = formatter.format(newPrice);

    // Determine if it's a price increase or decrease
    const priceChange =
      newPrice > oldPrice
        ? `Price increase: ${formattedOldPrice} to ${formattedNewPrice}`
        : `Price decrease: ${formattedOldPrice} to ${formattedNewPrice}`;

    return this.scheduleNotification({
      userId,
      title: `Price Change: ${subscriptionName}`,
      message: `${priceChange}. Effective on ${effectiveDate.toLocaleDateString()}.`,
      type: NotificationType.PRICE_CHANGE,
      scheduledFor: notificationDate,
      relatedEntityId: subscriptionId,
      relatedEntityType: 'subscription',
      deepLinkUrl: `/subscriptions/${subscriptionId}`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        oldPrice,
        newPrice,
        currency,
        effectiveDate: effectiveDate.toISOString(),
        daysBeforeChange,
      },
    });
  }
}

// Export singleton instance
const notificationScheduler = NotificationScheduler.getInstance();
export default notificationScheduler;
