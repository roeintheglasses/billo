/**
 * Notification Service
 * 
 * This service provides functions for managing notifications in the application
 * including CRUD operations, validation, and utility functions for common
 * notification types.
 */

import { supabase } from './supabase';
import { Notification, NotificationInsert, NotificationUpdate } from '../types/supabase';

/**
 * Enum for notification types
 */
export enum NotificationType {
  SUBSCRIPTION_DUE = 'subscription_due',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  PAYMENT_REMINDER = 'payment_reminder',
  PRICE_CHANGE = 'price_change',
  SYSTEM = 'system'
}

/**
 * Enum for notification priorities
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Extended notification interface with metadata
 */
export interface NotificationWithMeta extends Notification {
  relatedEntityData?: Record<string, any>;
  actionButtons?: Array<{label: string, action: string}>;
}

/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  errors?: Record<string, string>;
}

/**
 * Validates a notification object
 * 
 * @param notification The notification object to validate
 * @returns An object with isValid and error properties
 */
export const validateNotification = (
  notification: Partial<NotificationInsert> | Partial<NotificationUpdate>
): ValidationResult => {
  const errors: Record<string, string> = {};
  
  // Validate required fields for new notifications
  if ('title' in notification && (!notification.title || !notification.title.trim())) {
    errors.title = 'Notification title is required';
  }
  
  if ('message' in notification && (!notification.message || !notification.message.trim())) {
    errors.message = 'Notification message is required';
  }
  
  if ('type' in notification) {
    const validTypes = Object.values(NotificationType);
    if (notification.type && !validTypes.includes(notification.type as NotificationType)) {
      errors.type = `Invalid notification type. Valid types are: ${validTypes.join(', ')}`;
    }
  }
  
  return { 
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
};

/**
 * Get all notifications for a user
 * 
 * @param userId The user ID to get notifications for
 * @param limit Optional limit on the number of notifications to return
 * @param includeRead Whether to include read notifications
 * @returns Promise resolving to an array of Notification objects
 */
export const getNotifications = async (
  userId: string,
  limit?: number,
  includeRead = true
): Promise<Notification[]> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!includeRead) {
      query = query.eq('is_read', false);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error('Error fetching notifications:', error.message);
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
};

/**
 * Get notifications paginated
 * 
 * @param userId The user ID to get notifications for
 * @param page The page number (starting from 1)
 * @param pageSize Number of items per page
 * @param filters Optional filters for the notifications
 * @returns Promise resolving to an object with data and count properties
 */
export const getNotificationsPaginated = async (
  userId: string,
  page = 1,
  pageSize = 20,
  filters: { isRead?: boolean; type?: string; priority?: string } = {}
): Promise<{ data: Notification[]; count: number }> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await query.range(from, to);
    
    if (error) throw error;
    
    return { 
      data: data || [], 
      count: count || 0 
    };
  } catch (error: any) {
    console.error('Error fetching paginated notifications:', error.message);
    throw new Error(`Failed to fetch paginated notifications: ${error.message}`);
  }
};

/**
 * Get unread notification count for a user
 * 
 * @param userId The user ID to get count for
 * @returns Promise resolving to the count of unread notifications
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    
    return count || 0;
  } catch (error: any) {
    console.error('Error fetching unread notification count:', error.message);
    throw new Error(`Failed to fetch unread notification count: ${error.message}`);
  }
};

/**
 * Get a notification by ID
 * 
 * @param id The notification ID
 * @returns Promise resolving to a Notification or null if not found
 */
export const getNotificationById = async (id: string): Promise<Notification | null> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // "Not found" error code
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error fetching notification with id ${id}:`, error.message);
    throw new Error(`Failed to fetch notification: ${error.message}`);
  }
};

/**
 * Create a new notification
 * 
 * @param notification The notification data to insert
 * @returns Promise resolving to the created Notification
 */
export const createNotification = async (notification: NotificationInsert): Promise<Notification> => {
  try {
    // Validate the notification data
    const validation = validateNotification(notification);
    if (!validation.isValid) {
      throw new Error(
        `Invalid notification data: ${
          JSON.stringify(validation.errors) || 'Unknown validation error'
        }`
      );
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      throw new Error('Failed to create notification: No data returned');
    }
    
    return data;
  } catch (error: any) {
    console.error('Error creating notification:', error.message);
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

/**
 * Update a notification
 * 
 * @param id The notification ID to update
 * @param updates The notification data to update
 * @returns Promise resolving to the updated Notification
 */
export const updateNotification = async (id: string, updates: NotificationUpdate): Promise<Notification> => {
  try {
    // Validate the updates
    const validation = validateNotification(updates);
    if (!validation.isValid) {
      throw new Error(
        `Invalid notification update data: ${
          JSON.stringify(validation.errors) || 'Unknown validation error'
        }`
      );
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error updating notification with id ${id}:`, error.message);
    throw new Error(`Failed to update notification: ${error.message}`);
  }
};

/**
 * Mark a notification as read
 * 
 * @param id The notification ID to mark as read
 * @returns Promise resolving to the updated Notification
 */
export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  return updateNotification(id, { 
    is_read: true,
    updated_at: new Date().toISOString()
  });
};

/**
 * Mark all notifications as read for a user
 * 
 * @param userId The user ID to mark all notifications as read for
 * @returns Promise resolving to void
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error.message);
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
};

/**
 * Delete a notification
 * 
 * @param id The notification ID to delete
 * @returns Promise resolving to true if successful
 */
export const deleteNotification = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error(`Error deleting notification with id ${id}:`, error.message);
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
};

/**
 * Delete all notifications for a user
 * 
 * @param userId The user ID to delete all notifications for
 * @returns Promise resolving to true if successful
 */
export const deleteAllNotifications = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error(`Error deleting all notifications for user ${userId}:`, error.message);
    throw new Error(`Failed to delete all notifications: ${error.message}`);
  }
};

/**
 * Group notifications by date
 * 
 * @param notifications Array of notifications to group
 * @returns Object with dates as keys and arrays of notifications as values
 */
export const groupNotificationsByDate = (
  notifications: Notification[]
): Record<string, Notification[]> => {
  return notifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);
};

/**
 * Create a subscription due notification
 * 
 * @param userId The user ID to create the notification for
 * @param subscriptionName The name of the subscription
 * @param dueDate The due date of the subscription
 * @param amount The amount due
 * @param priority The priority of the notification
 * @returns Promise resolving to the created Notification
 */
export const createSubscriptionDueNotification = async (
  userId: string,
  subscriptionName: string,
  dueDate: Date,
  amount: number,
  priority: NotificationPriority = NotificationPriority.MEDIUM
): Promise<Notification> => {
  const formattedDate = dueDate.toLocaleDateString();
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
  
  return createNotification({
    user_id: userId,
    title: `Payment Due: ${subscriptionName}`,
    message: `Your subscription to ${subscriptionName} is due on ${formattedDate} for ${formattedAmount}.`,
    type: NotificationType.SUBSCRIPTION_DUE,
    is_read: false,
    priority: priority,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
};

/**
 * Create a system notification
 * 
 * @param userId The user ID to create the notification for
 * @param title The notification title
 * @param message The notification message
 * @param priority The priority of the notification
 * @returns Promise resolving to the created Notification
 */
export const createSystemNotification = async (
  userId: string,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.MEDIUM
): Promise<Notification> => {
  return createNotification({
    user_id: userId,
    title,
    message,
    type: NotificationType.SYSTEM,
    is_read: false,
    priority: priority,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
};

export default {
  getNotifications,
  getNotificationsPaginated,
  getUnreadNotificationCount,
  getNotificationById,
  createNotification,
  updateNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  groupNotificationsByDate,
  createSubscriptionDueNotification,
  createSystemNotification
}; 