/**
 * useNotifications Hook
 * 
 * A custom React hook for fetching and managing user notifications.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Notification } from '../types/supabase';
import notificationService from '../services/notificationService';

interface UseNotificationsOptions {
  limit?: number;
  includeRead?: boolean;
  autoRefresh?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

/**
 * Hook for fetching and managing user notifications
 * 
 * @param userId The user ID to fetch notifications for
 * @param options Configuration options
 * @returns Notification data and functions for managing notifications
 */
export const useNotifications = (
  userId: string,
  options: UseNotificationsOptions = {}
): UseNotificationsReturn => {
  const { limit, includeRead = true, autoRefresh = true } = options;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await notificationService.getNotifications(userId, limit, includeRead);
      setNotifications(data);
      
      const count = await notificationService.getUnreadNotificationCount(userId);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err.message || 'Failed to fetch notifications'));
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, limit, includeRead]);
  
  const markAsRead = async (id: string) => {
    try {
      await notificationService.markNotificationAsRead(id);
      
      // Optimistically update the UI
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      // Refresh notifications to get the correct state
      fetchNotifications();
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead(userId);
      
      // Optimistically update the UI
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, is_read: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      // Refresh notifications to get the correct state
      fetchNotifications();
    }
  };
  
  const deleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      
      // Optimistically update the UI
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== id)
      );
      
      // Update unread count if needed
      const deletedNotification = notifications.find(n => n.id === id);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      // Refresh notifications to get the correct state
      fetchNotifications();
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  // Set up real-time subscription
  useEffect(() => {
    if (!userId || !autoRefresh) return;
    
    const channel = supabase
      .channel('notification-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, autoRefresh, fetchNotifications]);
  
  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications
  };
};

export default useNotifications; 