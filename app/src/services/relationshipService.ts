/**
 * Relationship Service
 *
 * This service provides cross-model query functions that work with relationships
 * between different data models in the application.
 */

import { supabase } from './supabase';
import {
  Category,
  Subscription,
  Transaction,
  SubscriptionWithCategory,
  SubscriptionWithTransactions,
  SubscriptionWithCategoryAndTransactions,
  CategoryWithSubscriptions,
  UserWithSubscriptionsAndTransactions,
  SpendingAnalytics,
} from '../types/supabase';

/**
 * Get a subscription with its category and transactions
 *
 * @param subscriptionId The ID of the subscription
 * @returns Promise resolving to a subscription with its category and transactions
 */
export const getSubscriptionWithDetails = async (
  subscriptionId: string
): Promise<SubscriptionWithCategoryAndTransactions | null> => {
  try {
    // Get the subscription with its category
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        category:category_id (*)
      `
      )
      .eq('id', subscriptionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // "Not found" error code
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    // Get the transactions for this subscription
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('date', { ascending: false });

    if (transactionsError) {
      throw transactionsError;
    }

    // Combine the data
    return {
      ...data,
      transactions: transactions || [],
    } as SubscriptionWithCategoryAndTransactions;
  } catch (error: any) {
    console.error(`Error fetching subscription details for ${subscriptionId}:`, error.message);
    throw new Error(`Failed to fetch subscription details: ${error.message}`);
  }
};

/**
 * Get all subscriptions with their categories and transactions
 *
 * @returns Promise resolving to an array of subscriptions with categories and transactions
 */
export const getAllSubscriptionsWithDetails = async (): Promise<
  SubscriptionWithCategoryAndTransactions[]
> => {
  try {
    // Get subscriptions with their categories
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        category:category_id (*)
      `
      )
      .order('name');

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Get all transactions
    const { data: allTransactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .in(
        'subscription_id',
        data.map(s => s.id)
      )
      .order('date', { ascending: false });

    if (transactionsError) {
      throw transactionsError;
    }

    // Map transactions to their subscriptions
    return data.map(subscription => {
      const subscriptionTransactions =
        allTransactions?.filter(t => t.subscription_id === subscription.id) || [];

      return {
        ...subscription,
        transactions: subscriptionTransactions,
      } as SubscriptionWithCategoryAndTransactions;
    });
  } catch (error: any) {
    console.error('Error fetching all subscriptions with details:', error.message);
    throw new Error(`Failed to fetch subscriptions with details: ${error.message}`);
  }
};

/**
 * Get all categories with their subscriptions
 *
 * @returns Promise resolving to an array of categories with their subscriptions
 */
export const getCategoriesWithSubscriptions = async (): Promise<CategoryWithSubscriptions[]> => {
  try {
    // Get categories with their subscriptions
    const { data, error } = await supabase
      .from('categories')
      .select(
        `
        *,
        subscriptions:subscriptions (*)
      `
      )
      .order('name');

    if (error) throw error;

    return (data || []) as CategoryWithSubscriptions[];
  } catch (error: any) {
    console.error('Error fetching categories with subscriptions:', error.message);
    throw new Error(`Failed to fetch categories with subscriptions: ${error.message}`);
  }
};

/**
 * Get spending analytics by category for a specific time period
 *
 * @param startDate The start date (YYYY-MM-DD)
 * @param endDate The end date (YYYY-MM-DD)
 * @returns Promise resolving to spending analytics data
 */
export const getSpendingAnalyticsByCategory = async (
  startDate: string,
  endDate: string
): Promise<SpendingAnalytics> => {
  try {
    // Get categories with their subscriptions and transactions in the date range
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(
        `
        id,
        name,
        subscriptions:subscriptions (
          id,
          name,
          amount,
          transactions:transactions (
            id,
            amount,
            date
          )
        )
      `
      )
      .order('name');

    if (categoriesError) throw categoriesError;

    let totalAmount = 0;
    let transactionCount = 0;
    let subscriptionCount = 0;

    // Process the data
    const categoryBreakdown = (categories || []).map(category => {
      const subscriptions = category.subscriptions || [];
      let categoryAmount = 0;

      subscriptions.forEach((subscription: any) => {
        const transactions = (subscription.transactions || []).filter(
          (t: any) => t.date >= startDate && t.date <= endDate
        );

        transactions.forEach((transaction: any) => {
          categoryAmount += transaction.amount;
          totalAmount += transaction.amount;
          transactionCount++;
        });

        if (transactions.length > 0) {
          subscriptionCount++;
        }
      });

      return {
        categoryId: category.id,
        categoryName: category.name,
        amount: categoryAmount,
        percentage: 0, // Will calculate after total is known
      };
    });

    // Calculate percentages
    categoryBreakdown.forEach(category => {
      category.percentage = totalAmount > 0 ? Math.round((category.amount / totalAmount) * 100) : 0;
    });

    // Build return object
    return {
      totalAmount,
      averageAmount: transactionCount > 0 ? totalAmount / transactionCount : 0,
      subscriptionCount,
      transactionCount,
      categoryBreakdown: categoryBreakdown.sort((a, b) => b.amount - a.amount),
    };
  } catch (error: any) {
    console.error('Error generating spending analytics:', error.message);
    throw new Error(`Failed to generate spending analytics: ${error.message}`);
  }
};

/**
 * Get spending time series data by month
 *
 * @param months Number of months to include (defaults to 12)
 * @returns Promise resolving to time series data
 */
export const getSpendingTimeSeries = async (
  months: number = 12
): Promise<SpendingAnalytics['timeSeriesData']> => {
  try {
    // Calculate start date (X months ago)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1); // First day of the month
    const formattedStartDate = startDate.toISOString().split('T')[0];

    // Get all transactions within date range
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', formattedStartDate)
      .order('date');

    if (error) throw error;

    // Group transactions by month
    const monthlyData: Record<string, number> = {};

    // Initialize all months with zero
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }

    // Sum transactions by month
    (transactions || []).forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += transaction.amount;
      }
    });

    // Convert to array and sort chronologically
    return Object.entries(monthlyData)
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => a.period.localeCompare(b.period));
  } catch (error: any) {
    console.error('Error generating spending time series:', error.message);
    throw new Error(`Failed to generate spending time series: ${error.message}`);
  }
};

/**
 * Get a user's complete subscription profile
 *
 * @param userId The user ID to retrieve data for
 * @returns Promise resolving to user with related subscription data
 */
export const getUserSubscriptionProfile = async (
  userId: string
): Promise<UserWithSubscriptionsAndTransactions> => {
  try {
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    if (!userData) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    // Get subscriptions with categories
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        category:category_id (*)
      `
      )
      .eq('user_id', userId)
      .order('name');

    if (subscriptionsError) throw subscriptionsError;

    const subscriptionIds = (subscriptions || []).map(s => s.id);

    // Get transactions for these subscriptions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .in('subscription_id', subscriptionIds.length > 0 ? subscriptionIds : ['no-results'])
      .order('date', { ascending: false });

    if (transactionsError) throw transactionsError;

    // Combine the data
    const subscriptionsWithTransactions = subscriptions?.map(subscription => {
      const subscriptionTransactions =
        transactions?.filter(t => t.subscription_id === subscription.id) || [];

      return {
        ...subscription,
        transactions: subscriptionTransactions,
      };
    });

    return {
      user: userData,
      subscriptions: subscriptionsWithTransactions as SubscriptionWithCategoryAndTransactions[],
    };
  } catch (error: any) {
    console.error(`Error fetching user subscription profile for ${userId}:`, error.message);
    throw new Error(`Failed to fetch user subscription profile: ${error.message}`);
  }
};

// Default export for the service
export default {
  getSubscriptionWithDetails,
  getAllSubscriptionsWithDetails,
  getCategoriesWithSubscriptions,
  getSpendingAnalyticsByCategory,
  getSpendingTimeSeries,
  getUserSubscriptionProfile,
};
