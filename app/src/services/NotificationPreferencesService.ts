/**
 * NotificationPreferencesService
 *
 * Manages user notification preferences for different notification types,
 * timing preferences, and delivery methods.
 */

import { supabase } from './supabase';
import { NotificationType } from './notificationService';

/**
 * Notification preferences by type
 */
export interface NotificationTypePreferences {
  enabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  advanceNoticeDays?: number; // For notifications that need advance notice (e.g., payment reminders)
}

/**
 * General notification settings
 */
export interface NotificationGeneralSettings {
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // Format: "HH:MM" in 24-hour
  quietHoursEnd?: string; // Format: "HH:MM" in 24-hour
  dailyDigestEnabled: boolean;
  digestTime?: string; // Format: "HH:MM" in 24-hour
}

/**
 * Complete notification preferences structure
 */
export interface NotificationPreferences {
  general: NotificationGeneralSettings;
  byType: Record<NotificationType, NotificationTypePreferences>;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  general: {
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    dailyDigestEnabled: false,
    digestTime: '09:00',
  },
  byType: {
    [NotificationType.PAYMENT_REMINDER]: {
      enabled: true,
      pushEnabled: true,
      emailEnabled: false,
      inAppEnabled: true,
      advanceNoticeDays: 3,
    },
    [NotificationType.CANCELLATION_DEADLINE]: {
      enabled: true,
      pushEnabled: true,
      emailEnabled: false,
      inAppEnabled: true,
      advanceNoticeDays: 7,
    },
    [NotificationType.PRICE_CHANGE]: {
      enabled: true,
      pushEnabled: true,
      emailEnabled: false,
      inAppEnabled: true,
    },
    [NotificationType.SUBSCRIPTION_DUE]: {
      enabled: true,
      pushEnabled: true,
      emailEnabled: false,
      inAppEnabled: true,
      advanceNoticeDays: 1,
    },
    [NotificationType.SUBSCRIPTION_CREATED]: {
      enabled: true,
      pushEnabled: true,
      emailEnabled: false,
      inAppEnabled: true,
    },
    [NotificationType.SUBSCRIPTION_UPDATED]: {
      enabled: true,
      pushEnabled: true,
      emailEnabled: false,
      inAppEnabled: true,
    },
    [NotificationType.SYSTEM]: {
      enabled: true,
      pushEnabled: true,
      emailEnabled: false,
      inAppEnabled: true,
    },
  },
};

/**
 * Service for managing notification preferences
 */
class NotificationPreferencesService {
  /**
   * Get notification preferences for a user
   * @param userId User ID
   * @returns Notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Get user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('notification_settings')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching notification preferences:', error);
        throw error;
      }

      // If no preferences exist, return defaults
      if (!profile || !profile.notification_settings) {
        return DEFAULT_NOTIFICATION_PREFERENCES;
      }

      // Return with defaults for any missing properties
      return {
        general: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.general,
          ...(profile.notification_settings.general || {}),
        },
        byType: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.byType,
          ...(profile.notification_settings.byType || {}),
        },
      };
    } catch (error) {
      console.error('Error in getPreferences:', error);
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  }

  /**
   * Update notification preferences for a user
   * @param userId User ID
   * @param preferences New notification preferences
   * @returns Success status
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      // First get existing preferences
      const existingPrefs = await this.getPreferences(userId);

      // Merge new preferences with existing ones
      const mergedPreferences = {
        general: {
          ...existingPrefs.general,
          ...(preferences.general || {}),
        },
        byType: {
          ...existingPrefs.byType,
          ...(preferences.byType || {}),
        },
      };

      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_settings: mergedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating notification preferences:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return false;
    }
  }

  /**
   * Update preferences for a specific notification type
   * @param userId User ID
   * @param type Notification type
   * @param preferences Preferences for this notification type
   * @returns Success status
   */
  async updateTypePreferences(
    userId: string,
    type: NotificationType,
    preferences: Partial<NotificationTypePreferences>
  ): Promise<boolean> {
    try {
      const existingPrefs = await this.getPreferences(userId);

      // Merge new type preferences with existing ones
      const updatedTypePrefs = {
        ...existingPrefs.byType,
        [type]: {
          ...existingPrefs.byType[type],
          ...preferences,
        },
      };

      // Update preferences with the new type settings
      return await this.updatePreferences(userId, {
        byType: updatedTypePrefs,
      });
    } catch (error) {
      console.error(`Error updating preferences for type ${type}:`, error);
      return false;
    }
  }

  /**
   * Check if notification delivery is allowed at the current time
   * @param userId User ID
   * @param type Notification type
   * @returns Whether notification delivery is allowed
   */
  async isDeliveryAllowed(userId: string, type: NotificationType): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId);

      // Check if notifications are enabled for this type
      const typePrefs = preferences.byType[type];
      if (!typePrefs || !typePrefs.enabled) {
        return false;
      }

      // Check quiet hours
      if (preferences.general.quietHoursEnabled) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        const start = preferences.general.quietHoursStart || '22:00';
        const end = preferences.general.quietHoursEnd || '08:00';

        // Check if current time is within quiet hours
        // Need to handle the case where quiet hours span across midnight
        if (start > end) {
          // Quiet hours span across midnight (e.g., 22:00 - 08:00)
          if (currentTime >= start || currentTime < end) {
            return false;
          }
        } else {
          // Quiet hours within the same day (e.g., 13:00 - 14:00)
          if (currentTime >= start && currentTime < end) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking delivery allowance:', error);
      // Default to allowing delivery if there's an error
      return true;
    }
  }
}

// Export singleton instance
const notificationPreferencesService = new NotificationPreferencesService();
export default notificationPreferencesService;
