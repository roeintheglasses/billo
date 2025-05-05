/**
 * Notification Service Tests
 */

import {
  validateNotification,
  NotificationType,
  NotificationPriority,
} from '../notificationService';
import { supabase } from '../supabase';
import notificationService from '../notificationService';

// Mock the supabase client
jest.mock('../supabase', () => {
  const mockChain = {
    from: jest.fn(() => mockChain),
    select: jest.fn(() => mockChain),
    insert: jest.fn(() => mockChain),
    update: jest.fn(() => mockChain),
    delete: jest.fn(() => mockChain),
    eq: jest.fn(() => mockChain),
    in: jest.fn(() => mockChain),
    is: jest.fn(() => mockChain),
    lte: jest.fn(() => mockChain),
    range: jest.fn(() => mockChain),
    limit: jest.fn(() => mockChain),
    single: jest.fn(() => mockChain),
    order: jest.fn(() => mockChain),
  };

  return {
    supabase: mockChain,
  };
});

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateNotification', () => {
    test('should validate a valid notification', () => {
      const notification = {
        user_id: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.SYSTEM,
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
        type: NotificationType.SYSTEM,
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
        type: NotificationType.SYSTEM,
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
        type: 'invalid-type',
      };

      const result = validateNotification(notification);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('type');
    });
  });

  describe('createSystemNotification', () => {
    it('should create a system notification', async () => {
      const mockNotification = {
        id: '123',
        user_id: 'user123',
        title: 'Test Notification',
        message: 'This is a test',
        type: NotificationType.SYSTEM,
        is_read: false,
        priority: 'medium',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      // Mock response
      supabase.single.mockResolvedValue({
        data: mockNotification,
        error: null,
      });

      const result = await notificationService.createSystemNotification(
        'user123',
        'Test Notification',
        'This is a test'
      );

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });
  });

  describe('createCancellationDeadlineNotification', () => {
    it('should create a cancellation deadline notification', async () => {
      const mockNotification = {
        id: '123',
        user_id: 'user123',
        title: 'Cancellation Deadline Approaching',
        message: 'You have 7 days left to cancel your Netflix subscription before renewal.',
        type: NotificationType.CANCELLATION_DEADLINE,
        is_read: false,
        priority: 'medium',
        metadata: {
          related_entity_id: 'sub123',
          related_entity_type: 'subscription',
          deep_link_url: '/subscriptions/sub123',
        },
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      // Mock response
      supabase.single.mockResolvedValue({
        data: mockNotification,
        error: null,
      });

      // Set a fixed deadline date 7 days in the future
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 7);

      const result = await notificationService.createCancellationDeadlineNotification(
        'user123',
        'sub123',
        'Netflix',
        deadlineDate
      );

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });
  });

  describe('createPaymentReminderNotification', () => {
    it('should create a payment reminder notification', async () => {
      const mockNotification = {
        id: '123',
        user_id: 'user123',
        title: 'Payment Reminder',
        message: 'Your payment of $12.99 for Spotify is due in 3 days.',
        type: NotificationType.PAYMENT_REMINDER,
        is_read: false,
        priority: 'medium',
        metadata: {
          related_entity_id: 'payment123',
          related_entity_type: 'payment',
          deep_link_url: '/payments/payment123',
        },
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      // Mock response
      supabase.single.mockResolvedValue({
        data: mockNotification,
        error: null,
      });

      // Set a fixed due date 3 days in the future
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      const result = await notificationService.createPaymentReminderNotification(
        'user123',
        'payment123',
        'Spotify',
        dueDate,
        12.99
      );

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });
  });

  describe('createPriceChangeNotification', () => {
    it('should create a price change notification', async () => {
      const mockNotification = {
        id: '123',
        user_id: 'user123',
        title: 'Price Change for Disney+',
        message: expect.stringContaining('Your subscription price will increase'),
        type: NotificationType.PRICE_CHANGE,
        is_read: false,
        priority: 'high',
        metadata: expect.objectContaining({
          related_entity_id: 'sub123',
          related_entity_type: 'subscription',
          deep_link_url: '/subscriptions/sub123',
          old_price: 7.99,
          new_price: 9.99,
        }),
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      // Mock response
      supabase.single.mockResolvedValue({
        data: mockNotification,
        error: null,
      });

      // Set a fixed effective date 30 days in the future
      const effectiveDate = new Date();
      effectiveDate.setDate(effectiveDate.getDate() + 30);

      const result = await notificationService.createPriceChangeNotification(
        'user123',
        'sub123',
        'Disney+',
        7.99,
        9.99,
        effectiveDate
      );

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });
  });

  describe('scheduleNotification', () => {
    it('should schedule a notification for future delivery', async () => {
      const mockNotification = {
        id: '123',
        user_id: 'user123',
        title: 'Future Notification',
        message: 'This notification was scheduled',
        type: NotificationType.SYSTEM,
        is_read: false,
        priority: 'medium',
        metadata: expect.objectContaining({
          status: 'pending',
          scheduled_for: expect.any(String),
        }),
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      // Mock response
      supabase.single.mockResolvedValue({
        data: mockNotification,
        error: null,
      });

      // Schedule a notification for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await notificationService.scheduleNotification({
        user_id: 'user123',
        title: 'Future Notification',
        message: 'This notification was scheduled',
        type: NotificationType.SYSTEM,
        scheduled_for: tomorrow.toISOString(),
      });

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it('should reject scheduling in the past', async () => {
      // Schedule a notification for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await expect(
        notificationService.scheduleNotification({
          user_id: 'user123',
          title: 'Past Notification',
          message: 'This notification is in the past',
          type: NotificationType.SYSTEM,
          scheduled_for: yesterday.toISOString(),
        })
      ).rejects.toThrow('Scheduled time must be in the future');

      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('processScheduledNotifications', () => {
    it('should process due notifications', async () => {
      const mockNotifications = [
        { id: '1', title: 'Notification 1' },
        { id: '2', title: 'Notification 2' },
      ];

      // Mock response for select query
      supabase.limit.mockResolvedValue({
        data: mockNotifications,
        error: null,
      });

      // Mock response for update query
      supabase.in.mockResolvedValue({
        error: null,
      });

      const result = await notificationService.processScheduledNotifications();

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.lte).toHaveBeenCalledWith('scheduled_for', expect.any(String));
      expect(supabase.eq).toHaveBeenCalledWith('status', 'pending');
      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'sent',
          updated_at: expect.any(String),
        })
      );
      expect(supabase.in).toHaveBeenCalledWith('id', ['1', '2']);
      expect(result).toBe(2);
    });

    it('should return 0 when no notifications are due', async () => {
      // Mock empty response
      supabase.limit.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await notificationService.processScheduledNotifications();

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(result).toBe(0);
    });
  });

  describe('getNotificationsByRelatedEntity', () => {
    it('should get notifications for a related entity', async () => {
      const mockNotifications = [
        { id: '1', title: 'Notification 1' },
        { id: '2', title: 'Notification 2' },
      ];

      // Mock response
      supabase.order.mockResolvedValue({
        data: mockNotifications,
        error: null,
      });

      const result = await notificationService.getNotificationsByRelatedEntity(
        'sub123',
        'subscription',
        'user123'
      );

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user123');
      expect(supabase.eq).toHaveBeenCalledWith('related_entity_id', 'sub123');
      expect(supabase.eq).toHaveBeenCalledWith('related_entity_type', 'subscription');
      expect(result).toEqual(mockNotifications);
    });
  });
});
