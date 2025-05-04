import * as subscriptionService from '../subscriptionService';
import { supabase } from '../supabase';

// Mock supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Subscription Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeAmountToMonthly', () => {
    it('should return the same amount for monthly billing cycle', () => {
      const result = subscriptionService.normalizeAmountToMonthly(10, 'monthly');
      expect(result).toBe(10);
    });

    it('should convert weekly billing cycle to monthly equivalent', () => {
      const result = subscriptionService.normalizeAmountToMonthly(10, 'weekly');
      expect(result).toBe(10 * 4.33); // 4.33 weeks in a month on average
    });

    it('should convert yearly billing cycle to monthly equivalent', () => {
      const result = subscriptionService.normalizeAmountToMonthly(120, 'yearly');
      expect(result).toBe(120 / 12); // 10 per month
    });

    it('should convert quarterly billing cycle to monthly equivalent', () => {
      const result = subscriptionService.normalizeAmountToMonthly(30, 'quarterly');
      expect(result).toBe(30 / 3); // 10 per month
    });

    it('should convert biannually billing cycle to monthly equivalent', () => {
      const result = subscriptionService.normalizeAmountToMonthly(60, 'biannually');
      expect(result).toBe(60 / 6); // 10 per month
    });

    it('should handle unknown billing cycles by using the monthly amount and logging a warning', () => {
      const result = subscriptionService.normalizeAmountToMonthly(10, 'unknown');
      expect(result).toBe(10);
    });
  });

  describe('calculateSpendForPeriod', () => {
    const mockSubscriptions = [
      {
        id: '1',
        name: 'Netflix',
        amount: 9.99,
        billing_cycle: 'monthly',
        start_date: '2023-01-01',
        user_id: 'user1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        next_billing_date: '2023-02-01',
        category_id: 'cat1',
        notes: null
      },
      {
        id: '2',
        name: 'Spotify',
        amount: 4.99,
        billing_cycle: 'monthly',
        start_date: '2023-01-15',
        user_id: 'user1',
        created_at: '2023-01-15',
        updated_at: '2023-01-15',
        next_billing_date: '2023-02-15',
        category_id: 'cat2',
        notes: null
      },
      {
        id: '3',
        name: 'Yearly Subscription',
        amount: 120,
        billing_cycle: 'yearly',
        start_date: '2023-01-01',
        user_id: 'user1',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        next_billing_date: '2024-01-01',
        category_id: 'cat1',
        notes: null
      }
    ];

    beforeEach(() => {
      // Mock subscription data
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockSubscriptions,
          error: null
        })
      });
    });

    it('should calculate spending for a one-month period', async () => {
      const result = await subscriptionService.calculateSpendForPeriod('2023-01-01', '2023-01-31');
      
      // Expected: Netflix (9.99) + Spotify (4.99) + Yearly (120) = 134.98
      expect(result).toBeCloseTo(134.98);
    });

    it('should calculate spending for a two-month period', async () => {
      const result = await subscriptionService.calculateSpendForPeriod('2023-01-01', '2023-02-28');
      
      // Expected: Netflix (9.99×2) + Spotify (4.99×2) + Yearly (120) = 149.96
      expect(result).toBeCloseTo(149.96);
    });

    it('should handle subscriptions that start in the middle of the period', async () => {
      // Mock a subscription that starts in the middle of our test period
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            {
              id: '4',
              name: 'Mid-period sub',
              amount: 10,
              billing_cycle: 'monthly',
              start_date: '2023-02-15', // Starts in the middle of our period
              user_id: 'user1',
              created_at: '2023-02-15',
              updated_at: '2023-02-15',
              next_billing_date: '2023-03-15',
              category_id: 'cat3',
              notes: null
            }
          ],
          error: null
        })
      });

      const result = await subscriptionService.calculateSpendForPeriod('2023-01-01', '2023-03-31');
      
      // Only counted once in the 3-month period (starts Feb 15)
      expect(result).toBeCloseTo(10);
    });

    it('should throw an error for invalid date formats', async () => {
      await expect(subscriptionService.calculateSpendForPeriod('invalid-date', '2023-01-31'))
        .rejects.toThrow('Invalid date format');
    });

    it('should throw an error if start date is after end date', async () => {
      await expect(subscriptionService.calculateSpendForPeriod('2023-02-01', '2023-01-01'))
        .rejects.toThrow('Start date must be before end date');
    });

    it('should throw an error if dates are missing', async () => {
      await expect(subscriptionService.calculateSpendForPeriod('', '2023-01-31'))
        .rejects.toThrow('Start date and end date are required');
    });

    it('should handle database errors', async () => {
      // Mock error response
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      });

      await expect(subscriptionService.calculateSpendForPeriod('2023-01-01', '2023-01-31'))
        .rejects.toThrow();
    });
  });

  describe('calculateTotalMonthlySpend', () => {
    it('should calculate total monthly spend correctly', async () => {
      // Mock subscription data
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              name: 'Netflix',
              amount: 9.99,
              billing_cycle: 'monthly',
              start_date: '2023-01-01'
            },
            {
              id: '2',
              name: 'Spotify',
              amount: 4.99,
              billing_cycle: 'monthly',
              start_date: '2023-01-15'
            },
            {
              id: '3',
              name: 'Yearly Subscription',
              amount: 120,
              billing_cycle: 'yearly',
              start_date: '2023-01-01'
            }
          ],
          error: null
        })
      });

      const result = await subscriptionService.calculateTotalMonthlySpend();
      
      // Expected: 9.99 + 4.99 + (120/12) = 24.98
      expect(result).toBeCloseTo(24.98);
    });
  });
}); 