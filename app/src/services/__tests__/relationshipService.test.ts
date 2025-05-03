/**
 * Tests for the Relationship Service
 */

import { supabase } from '../supabase';
import * as relationshipService from '../relationshipService';
import { Database } from '../../types/supabase';

// Mock the Supabase client
jest.mock('../supabase', () => {
  const mockFrom = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockOrder = jest.fn().mockReturnThis();
  const mockIn = jest.fn().mockReturnThis();
  const mockGte = jest.fn().mockReturnThis();
  const mockLte = jest.fn().mockReturnThis();
  const mockSingle = jest.fn();
  
  return {
    supabase: {
      from: mockFrom,
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      in: mockIn,
      gte: mockGte,
      lte: mockLte,
      single: mockSingle,
    }
  };
});

describe('Relationship Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptionWithDetails', () => {
    it('should fetch a subscription with its category and transactions', async () => {
      // Mock subscription data
      const mockSubscription = {
        id: '123',
        name: 'Netflix',
        category: {
          id: '456',
          name: 'Entertainment',
        },
      };
      
      // Mock transactions data
      const mockTransactions = [
        { id: '789', amount: 9.99, date: '2023-01-01' },
        { id: '790', amount: 9.99, date: '2023-02-01' },
      ];
      
      // Set up mock responses
      // First query for subscription
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: mockSubscription,
          error: null,
        }),
      });
      
      // Second query for transactions
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: mockTransactions,
          error: null,
        }),
      });
      
      // Call the service function
      const result = await relationshipService.getSubscriptionWithDetails('123');
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(result).toEqual({
        ...mockSubscription,
        transactions: mockTransactions,
      });
    });
    
    it('should return null when subscription not found', async () => {
      // Set up mock response for not found
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      });
      
      // Call the service function
      const result = await relationshipService.getSubscriptionWithDetails('not-found');
      
      // Assertions
      expect(result).toBeNull();
    });
    
    it('should throw an error when Supabase returns an error', async () => {
      // Set up mock response with error
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { code: 'other-error', message: 'Database error' },
        }),
      });
      
      // Call the service function and expect it to throw
      await expect(relationshipService.getSubscriptionWithDetails('123')).rejects.toThrow();
    });
  });

  describe('getSpendingAnalyticsByCategory', () => {
    it('should calculate spending analytics grouped by category', async () => {
      // Mock categories data with nested subscriptions and transactions
      const mockCategoriesData = [
        {
          id: '1',
          name: 'Entertainment',
          subscriptions: [
            {
              id: 's1',
              name: 'Netflix',
              amount: 9.99,
              transactions: [
                { id: 't1', amount: 9.99, date: '2023-01-15' },
                { id: 't2', amount: 9.99, date: '2023-02-15' },
              ],
            },
          ],
        },
        {
          id: '2',
          name: 'Utilities',
          subscriptions: [
            {
              id: 's2',
              name: 'Electric',
              amount: 50,
              transactions: [
                { id: 't3', amount: 50, date: '2023-01-20' },
              ],
            },
          ],
        },
      ];
      
      // Set up mock response
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: mockCategoriesData,
          error: null,
        }),
      });
      
      // Call the service function
      const result = await relationshipService.getSpendingAnalyticsByCategory('2023-01-01', '2023-02-28');
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(result.totalAmount).toBe(69.98); // Sum of all transaction amounts
      expect(result.transactionCount).toBe(3); // Total number of transactions
      expect(result.subscriptionCount).toBe(2); // Number of subscriptions with transactions
      
      // Check category breakdown
      expect(result.categoryBreakdown).toHaveLength(2);
      expect(result.categoryBreakdown[0].categoryName).toBeDefined();
      expect(result.categoryBreakdown[0].amount).toBeDefined();
      expect(result.categoryBreakdown[0].percentage).toBeDefined();
      
      // Verify sorting (highest amount first)
      expect(result.categoryBreakdown[0].amount).toBeGreaterThanOrEqual(result.categoryBreakdown[1].amount);
    });
  });

  describe('getUserSubscriptionProfile', () => {
    it('should fetch a complete user profile with subscriptions and transactions', async () => {
      // Mock user data
      const mockUser = { id: 'user1', email: 'user@example.com' };
      
      // Mock subscriptions with categories
      const mockSubscriptions = [
        { 
          id: 's1', 
          name: 'Netflix', 
          category: { id: 'c1', name: 'Entertainment' }
        },
      ];
      
      // Mock transactions
      const mockTransactions = [
        { id: 't1', subscription_id: 's1', amount: 9.99, date: '2023-01-15' },
      ];
      
      // Set up mock responses
      // First query for user
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: mockUser,
          error: null,
        }),
      });
      
      // Second query for subscriptions
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: mockSubscriptions,
          error: null,
        }),
      });
      
      // Third query for transactions
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: mockTransactions,
          error: null,
        }),
      });
      
      // Call the service function
      const result = await relationshipService.getUserSubscriptionProfile('user1');
      
      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.from).toHaveBeenCalledWith('subscriptions');
      expect(supabase.from).toHaveBeenCalledWith('transactions');
      
      expect(result.user).toEqual(mockUser);
      expect(result.subscriptions).toHaveLength(1);
      expect(result.subscriptions?.[0].transactions).toHaveLength(1);
    });
  });
}); 