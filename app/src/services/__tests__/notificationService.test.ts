/**
 * Notification Service Tests
 */

import { validateNotification, NotificationType, NotificationPriority } from '../notificationService';

// Mock the Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  }
}));

describe('Notification Service', () => {
  describe('validateNotification', () => {
    test('should validate a valid notification', () => {
      const notification = {
        user_id: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.SYSTEM
      };

      const result = validateNotification(notification);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should invalidate a notification without title', () => {
      const notification = {
        user_id: 'user-123',
        title: '',
        message: 'This is a test notification',
        type: NotificationType.SYSTEM
      };

      const result = validateNotification(notification);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('title');
    });

    test('should invalidate a notification without message', () => {
      const notification = {
        user_id: 'user-123',
        title: 'Test Notification',
        message: '',
        type: NotificationType.SYSTEM
      };

      const result = validateNotification(notification);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('message');
    });

    test('should invalidate a notification with invalid type', () => {
      const notification = {
        user_id: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'invalid-type'
      };

      const result = validateNotification(notification);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('type');
    });
  });

  // Additional tests would be implemented here for CRUD operations
  // using mocked Supabase responses.
}); 