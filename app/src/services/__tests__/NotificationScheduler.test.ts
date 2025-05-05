import { supabase } from '../supabase';
import notificationService from '../notificationService';
import notificationScheduler, {
  NotificationScheduler,
  NotificationRequest,
  RecurrencePattern,
} from '../NotificationScheduler';
import { NotificationType, NotificationPriority } from '../notificationService';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Mock dependencies
jest.mock('../supabase', () => {
  // Define the type for mockChain to avoid implicit any
  type MockChain = {
    [key: string]: jest.Mock<MockChain>;
  };

  // Create mockChain with explicit type
  const mockChain: Partial<MockChain> = {};

  // Define each function that returns the chain
  const functions = [
    'from',
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'is',
    'lte',
    'range',
    'limit',
    'single',
    'order',
  ];

  functions.forEach(fn => {
    mockChain[fn] = jest.fn().mockReturnValue(mockChain);
  });

  return {
    supabase: mockChain as MockChain,
  };
});

jest.mock('../notificationService', () => ({
  getNotificationById: jest.fn(),
  scheduleNotification: jest.fn(),
  NotificationType: {
    SUBSCRIPTION_DUE: 'subscription_due',
    PAYMENT_REMINDER: 'payment_reminder',
    PRICE_CHANGE: 'price_change',
    CANCELLATION_DEADLINE: 'cancellation_deadline',
    SYSTEM: 'system',
  },
  NotificationPriority: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  },
  default: {
    getNotificationById: jest.fn(),
    scheduleNotification: jest.fn(),
  },
}));

jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(),
  BackgroundFetchResult: {
    NewData: 'newData',
    NoData: 'noData',
    Failed: 'failed',
  },
}));

jest.mock('expo-task-manager', () => ({
  isTaskDefined: jest.fn(),
  defineTask: jest.fn(),
}));

jest.mock('node-schedule', () => ({
  scheduleJob: jest.fn().mockReturnValue({
    cancel: jest.fn(),
  }),
  Job: jest.requireActual('node-schedule').Job,
}));

// Create a mock for Date
const realDate = global.Date;
class MockDate extends Date {
  constructor(date?: string | number | Date) {
    super(date || '2025-01-01T00:00:00.000Z');
  }
}

describe('NotificationScheduler', () => {
  let mockDate = new Date('2025-01-01T00:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the Date object for consistent testing
    global.Date = MockDate as DateConstructor;
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

    // Reset the isInitialized flag to test initialize
    Object.defineProperty(notificationScheduler, 'isInitialized', {
      value: false,
      writable: true,
    });
  });

  afterEach(() => {
    global.Date = realDate;
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should set up background tasks and polling', async () => {
      // Mock the platform
      jest.mock('react-native', () => ({
        Platform: {
          OS: 'ios',
        },
      }));

      // Set up mocks
      (TaskManager.isTaskDefined as jest.Mock).mockReturnValue(false);
      (BackgroundFetch.registerTaskAsync as jest.Mock).mockResolvedValue(undefined);

      // Call initialize
      await notificationScheduler.initialize();

      // Verify task was registered
      expect(TaskManager.defineTask).toHaveBeenCalled();
      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalled();
    });
  });

  describe('scheduleNotification', () => {
    it('should schedule a notification successfully', async () => {
      // Set up mock data
      const mockNotification = {
        id: '123',
        user_id: 'user123',
        title: 'Test Notification',
        message: 'This is a test',
        type: NotificationType.SYSTEM,
        is_read: false,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          status: 'pending',
          test: 'value',
        },
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      // Set up the future date
      const tomorrow = new Date('2025-01-02T00:00:00.000Z');

      // Set up mocks
      (notificationService.scheduleNotification as jest.Mock).mockResolvedValue(mockNotification);

      // Create notification request
      const request: NotificationRequest = {
        userId: 'user123',
        title: 'Test Notification',
        message: 'This is a test',
        type: NotificationType.SYSTEM,
        scheduledFor: tomorrow,
        priority: NotificationPriority.MEDIUM,
        metadata: { test: 'value' },
      };

      // Schedule the notification
      const result = await notificationScheduler.scheduleNotification(request);

      // Verify the result
      expect(result).toEqual(mockNotification);
      expect(notificationService.scheduleNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user123',
          title: 'Test Notification',
          message: 'This is a test',
          type: NotificationType.SYSTEM,
          metadata: expect.objectContaining({
            test: 'value',
            retry_count: 0,
          }),
        })
      );
    });

    it('should reject if scheduled time is in the past', async () => {
      // Set the "current" date
      mockDate = new Date('2025-01-01T00:00:00.000Z');

      // Create a date in the past
      const yesterday = new Date('2024-12-31T00:00:00.000Z');

      // Create notification request with past date
      const request: NotificationRequest = {
        userId: 'user123',
        title: 'Test Notification',
        message: 'This is a test',
        type: NotificationType.SYSTEM,
        scheduledFor: yesterday,
      };

      // Attempt to schedule and expect it to fail
      await expect(notificationScheduler.scheduleNotification(request)).rejects.toThrow(
        'Scheduled time must be in the future'
      );

      // Verify that scheduleNotification was not called
      expect(notificationService.scheduleNotification).not.toHaveBeenCalled();
    });
  });

  describe('cancelScheduledNotification', () => {
    it('should cancel a pending notification', async () => {
      // Mock the notification
      const mockNotification = {
        id: '123',
        user_id: 'user123',
        title: 'Test Notification',
        message: 'This is a test',
        type: NotificationType.SYSTEM,
        is_read: false,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          status: 'pending',
        },
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      // Set up mocks
      (notificationService.getNotificationById as jest.Mock).mockResolvedValue(mockNotification);

      // Set up successful supabase update using mocked chain
      const mockUpdateChain = {
        eq: jest.fn().mockResolvedValue({ error: null, data: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue(mockUpdateChain),
      });

      // Call the method
      const result = await notificationScheduler.cancelScheduledNotification('123');

      // Verify the result
      expect(result).toBe(true);
      expect(notificationService.getNotificationById).toHaveBeenCalledWith('123');
      expect(supabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should reject if the notification is not pending', async () => {
      // Mock a sent notification
      const mockNotification = {
        id: '123',
        user_id: 'user123',
        title: 'Test Notification',
        message: 'This is a test',
        type: NotificationType.SYSTEM,
        is_read: false,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          status: 'sent',
        },
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      // Set up mocks
      (notificationService.getNotificationById as jest.Mock).mockResolvedValue(mockNotification);

      // Call the method and expect failure
      const result = await notificationScheduler.cancelScheduledNotification('123');

      // Should return false when notification can't be cancelled
      expect(result).toBe(false);
      expect(notificationService.getNotificationById).toHaveBeenCalledWith('123');
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('schedulePaymentReminder', () => {
    it('should schedule a payment reminder before the due date', async () => {
      // Set up mock data
      const mockNotification = {
        id: '123',
        user_id: 'user123',
        title: 'Payment Reminder: Netflix',
        message: expect.stringContaining('due in 3 days'),
        type: NotificationType.PAYMENT_REMINDER,
        is_read: false,
        priority: NotificationPriority.HIGH,
        metadata: expect.any(Object),
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      // Mock the scheduleNotification method
      jest.spyOn(notificationScheduler, 'scheduleNotification').mockResolvedValue(mockNotification);

      // Set the due date
      const dueDate = new Date('2025-01-15T00:00:00.000Z');

      // Schedule the payment reminder
      const result = await notificationScheduler.schedulePaymentReminder(
        'user123',
        'sub123',
        'Netflix',
        dueDate,
        9.99,
        'USD',
        3
      );

      // Verify the result
      expect(result).toEqual(mockNotification);
      expect(notificationScheduler.scheduleNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          title: 'Payment Reminder: Netflix',
          type: NotificationType.PAYMENT_REMINDER,
          relatedEntityId: 'sub123',
          relatedEntityType: 'subscription',
          priority: NotificationPriority.HIGH,
        })
      );

      // Verify that scheduled date is 3 days before due date
      const scheduledForArg = (notificationScheduler.scheduleNotification as jest.Mock).mock
        .calls[0][0].scheduledFor;
      expect(scheduledForArg.getTime()).toBe(new Date('2025-01-12T00:00:00.000Z').getTime());
    });
  });

  describe('scheduleCancellationDeadline', () => {
    it('should schedule a cancellation deadline notification', async () => {
      // Set up mock data
      const mockNotification = {
        id: '123',
        user_id: 'user123',
        title: 'Cancellation Deadline Approaching',
        message: expect.stringContaining('5 days left'),
        type: NotificationType.CANCELLATION_DEADLINE,
        is_read: false,
        priority: NotificationPriority.MEDIUM,
        metadata: expect.any(Object),
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      };

      // Mock the scheduleNotification method
      jest.spyOn(notificationScheduler, 'scheduleNotification').mockResolvedValue(mockNotification);

      // Set the deadline date
      const deadlineDate = new Date('2025-01-20T00:00:00.000Z');

      // Schedule the cancellation deadline notification
      const result = await notificationScheduler.scheduleCancellationDeadline(
        'user123',
        'sub123',
        'HBO Max',
        deadlineDate,
        5
      );

      // Verify the result
      expect(result).toEqual(mockNotification);
      expect(notificationScheduler.scheduleNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          title: 'Cancellation Deadline Approaching',
          type: NotificationType.CANCELLATION_DEADLINE,
          relatedEntityId: 'sub123',
          relatedEntityType: 'subscription',
        })
      );

      // Verify that scheduled date is 5 days before deadline
      const scheduledForArg = (notificationScheduler.scheduleNotification as jest.Mock).mock
        .calls[0][0].scheduledFor;
      expect(scheduledForArg.getTime()).toBe(new Date('2025-01-15T00:00:00.000Z').getTime());
    });
  });

  // Additional tests could be added for:
  // - schedulePriceChange
  // - bulkScheduleNotifications
  // - rescheduleNotification
  // - processScheduledNotifications
  // - scheduleNextRecurrence for recurring notifications
});
