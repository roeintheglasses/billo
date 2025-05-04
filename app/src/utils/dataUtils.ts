/**
 * Data Utilities
 *
 * This file contains utility functions for working with complex data structures,
 * particularly those returned by relationship queries.
 */

import {
  SubscriptionWithCategoryAndTransactions,
  CategoryWithSubscriptions,
  UserWithSubscriptionsAndTransactions,
  Transaction,
} from '../types/supabase';

/**
 * Calculate the total amount spent on a subscription within a date range
 *
 * @param subscription The subscription with transactions
 * @param startDate Optional start date (YYYY-MM-DD)
 * @param endDate Optional end date (YYYY-MM-DD)
 * @returns The total amount
 */
export const calculateSubscriptionTotal = (
  subscription: SubscriptionWithCategoryAndTransactions,
  startDate?: string,
  endDate?: string
): number => {
  if (!subscription.transactions || subscription.transactions.length === 0) {
    return 0;
  }

  return subscription.transactions
    .filter(transaction => {
      if (!startDate && !endDate) return true;

      const transactionDate = transaction.date;
      if (startDate && endDate) {
        return transactionDate >= startDate && transactionDate <= endDate;
      }
      if (startDate) {
        return transactionDate >= startDate;
      }
      if (endDate) {
        return transactionDate <= endDate;
      }
      return true;
    })
    .reduce((total, transaction) => total + transaction.amount, 0);
};

/**
 * Calculate the total spent across all categories and subscriptions
 *
 * @param categories Array of categories with nested subscriptions and transactions
 * @param startDate Optional start date (YYYY-MM-DD)
 * @param endDate Optional end date (YYYY-MM-DD)
 * @returns The total amount
 */
export const calculateCategoryTotal = (
  categories: CategoryWithSubscriptions[],
  startDate?: string,
  endDate?: string
): number => {
  return categories.reduce((categoryTotal, category) => {
    if (!category.subscriptions || category.subscriptions.length === 0) {
      return categoryTotal;
    }

    const subscriptionTotal = category.subscriptions.reduce((subTotal, subscription) => {
      return (
        subTotal +
        calculateSubscriptionTotal(
          subscription as SubscriptionWithCategoryAndTransactions,
          startDate,
          endDate
        )
      );
    }, 0);

    return categoryTotal + subscriptionTotal;
  }, 0);
};

/**
 * Get the latest transaction for each subscription
 *
 * @param subscriptions Array of subscriptions with transactions
 * @returns Map of subscription IDs to their latest transaction
 */
export const getLatestTransactions = (
  subscriptions: SubscriptionWithCategoryAndTransactions[]
): Map<string, Transaction> => {
  const latestTransactions = new Map<string, Transaction>();

  subscriptions.forEach(subscription => {
    if (!subscription.transactions || subscription.transactions.length === 0) {
      return;
    }

    // Sort by date descending and take the first one
    const sortedTransactions = [...subscription.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    latestTransactions.set(subscription.id, sortedTransactions[0]);
  });

  return latestTransactions;
};

/**
 * Group transactions by month
 *
 * @param transactions Array of transactions
 * @returns Map of month strings (YYYY-MM) to arrays of transactions
 */
export const groupTransactionsByMonth = (
  transactions: Transaction[]
): Map<string, Transaction[]> => {
  const groupedTransactions = new Map<string, Transaction[]>();

  transactions.forEach(transaction => {
    const monthKey = transaction.date.substring(0, 7); // YYYY-MM

    if (!groupedTransactions.has(monthKey)) {
      groupedTransactions.set(monthKey, []);
    }

    groupedTransactions.get(monthKey)?.push(transaction);
  });

  return groupedTransactions;
};

/**
 * Extract all transactions from a user profile
 *
 * @param userProfile User profile with nested subscriptions and transactions
 * @returns Array of all transactions
 */
export const extractAllTransactions = (
  userProfile: UserWithSubscriptionsAndTransactions
): Transaction[] => {
  if (!userProfile.subscriptions || userProfile.subscriptions.length === 0) {
    return [];
  }

  return userProfile.subscriptions.flatMap(subscription => subscription.transactions || []);
};

/**
 * Calculate average monthly spending
 *
 * @param transactions Array of transactions
 * @param monthsToConsider Number of months to consider (default: 3)
 * @returns Average monthly spending or 0 if no transactions
 */
export const calculateAverageMonthlySpending = (
  transactions: Transaction[],
  monthsToConsider: number = 3
): number => {
  if (transactions.length === 0) {
    return 0;
  }

  const grouped = groupTransactionsByMonth(transactions);
  const monthlySums = new Map<string, number>();

  // Calculate sum for each month
  grouped.forEach((monthTransactions, monthKey) => {
    const monthTotal = monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    monthlySums.set(monthKey, monthTotal);
  });

  // Sort months by date (descending) and take most recent N months
  const sortedMonths = Array.from(monthlySums.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, monthsToConsider);

  if (sortedMonths.length === 0) {
    return 0;
  }

  // Calculate average
  const totalSpending = sortedMonths.reduce((sum, [_, amount]) => sum + amount, 0);

  return totalSpending / sortedMonths.length;
};

/**
 * Organize subscriptions into monthly, quarterly, and yearly buckets
 *
 * @param subscriptions Array of subscriptions
 * @returns Object with categorized subscriptions
 */
export const categorizeSubscriptionsByFrequency = (
  subscriptions: SubscriptionWithCategoryAndTransactions[]
) => {
  return subscriptions.reduce(
    (result, subscription) => {
      const transactions = subscription.transactions || [];
      if (transactions.length === 0) {
        result.uncategorized.push(subscription);
        return result;
      }

      // Sort transactions by date (oldest first)
      const sortedTransactions = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Determine frequency by analyzing transaction dates
      if (transactions.length >= 2) {
        const firstDate = new Date(sortedTransactions[0].date);
        const secondDate = new Date(sortedTransactions[1].date);
        const daysBetween = Math.round(
          (secondDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysBetween <= 32) {
          result.monthly.push(subscription);
        } else if (daysBetween <= 95) {
          result.quarterly.push(subscription);
        } else if (daysBetween >= 340 && daysBetween <= 390) {
          result.yearly.push(subscription);
        } else {
          result.other.push(subscription);
        }
      } else {
        result.uncategorized.push(subscription);
      }

      return result;
    },
    {
      monthly: [] as SubscriptionWithCategoryAndTransactions[],
      quarterly: [] as SubscriptionWithCategoryAndTransactions[],
      yearly: [] as SubscriptionWithCategoryAndTransactions[],
      other: [] as SubscriptionWithCategoryAndTransactions[],
      uncategorized: [] as SubscriptionWithCategoryAndTransactions[],
    }
  );
};
