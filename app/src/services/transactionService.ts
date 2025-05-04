/**
 * Transaction Service
 *
 * This service provides functions for managing transaction records in the application
 * including CRUD operations, validation, and relationship to subscriptions.
 */

import { supabase } from './supabase';
import { Transaction, TransactionInsert, TransactionUpdate, Subscription } from '../types/supabase';
import { getSubscriptionById } from './subscriptionService';
import { isValidDateFormat } from './subscriptionService';

/**
 * Interface extending Transaction with its related Subscription data
 */
export interface TransactionWithSubscription extends Transaction {
  subscription?: Subscription;
}

/**
 * Interface for transaction summary data, used for reports and analytics
 */
export interface TransactionSummary {
  period: string; // e.g., "2023-01", "2023"
  totalAmount: number;
  count: number;
  subscriptionBreakdown: {
    subscriptionId: string;
    subscriptionName: string;
    amount: number;
  }[];
}

/**
 * Validates that the amount is a positive number
 *
 * @param amount The amount to validate
 * @returns True if the amount is valid
 */
export const isValidAmount = (amount: number): boolean => {
  return typeof amount === 'number' && !isNaN(amount) && amount >= 0;
};

/**
 * Validates a transaction object
 *
 * @param transaction The transaction object to validate
 * @returns An object with isValid and error properties
 */
export const validateTransaction = async (
  transaction: Partial<TransactionInsert> | Partial<TransactionUpdate>
): Promise<{ isValid: boolean; error?: string }> => {
  // Validate required fields for new transactions
  if ('amount' in transaction && transaction.amount !== undefined) {
    if (!isValidAmount(transaction.amount)) {
      return { isValid: false, error: 'Amount must be a positive number' };
    }
  }

  if ('date' in transaction && transaction.date) {
    if (!isValidDateFormat(transaction.date)) {
      return { isValid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
    }
  }

  // Validate subscription relationship if provided
  if (transaction.subscription_id) {
    const subscription = await getSubscriptionById(transaction.subscription_id);
    if (!subscription) {
      return { isValid: false, error: 'Invalid subscription ID' };
    }
  }

  return { isValid: true };
};

/**
 * Get all transactions for the current user
 *
 * @returns Promise resolving to an array of Transaction objects
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error fetching transactions:', error.message);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }
};

/**
 * Get a single transaction by ID
 *
 * @param id The ID of the transaction to retrieve
 * @returns Promise resolving to a Transaction object or null if not found
 */
export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        // "Not found" error code
        return null;
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error(`Error fetching transaction with id ${id}:`, error.message);
    throw new Error(`Failed to fetch transaction: ${error.message}`);
  }
};

/**
 * Get transactions with their associated subscription data
 *
 * @returns Promise resolving to an array of TransactionWithSubscription objects
 */
export const getTransactionsWithSubscriptions = async (): Promise<
  TransactionWithSubscription[]
> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        subscription:subscription_id (
          id,
          name,
          amount,
          billing_cycle,
          category_id
        )
      `
      )
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []) as TransactionWithSubscription[];
  } catch (error: any) {
    console.error('Error fetching transactions with subscriptions:', error.message);
    throw new Error(`Failed to fetch transactions with subscriptions: ${error.message}`);
  }
};

/**
 * Get all transactions for a specific subscription
 *
 * @param subscriptionId The ID of the subscription
 * @returns Promise resolving to an array of Transaction objects
 */
export const getTransactionsBySubscription = async (
  subscriptionId: string
): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('date', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error(`Error fetching transactions for subscription ${subscriptionId}:`, error.message);
    throw new Error(`Failed to fetch transactions for subscription: ${error.message}`);
  }
};

/**
 * Get transactions within a date range
 *
 * @param startDate The start date in YYYY-MM-DD format
 * @param endDate The end date in YYYY-MM-DD format
 * @returns Promise resolving to an array of Transaction objects
 */
export const getTransactionsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Transaction[]> => {
  try {
    if (!isValidDateFormat(startDate) || !isValidDateFormat(endDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error(
      `Error fetching transactions between ${startDate} and ${endDate}:`,
      error.message
    );
    throw new Error(`Failed to fetch transactions by date range: ${error.message}`);
  }
};

/**
 * Create a new transaction
 *
 * @param transaction The transaction data to insert
 * @returns Promise resolving to the created Transaction
 */
export const createTransaction = async (transaction: TransactionInsert): Promise<Transaction> => {
  try {
    // Validate the transaction data
    const validation = await validateTransaction(transaction);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error('Failed to create transaction: No data returned');
    }

    return data;
  } catch (error: any) {
    console.error('Error creating transaction:', error.message);
    throw new Error(`Failed to create transaction: ${error.message}`);
  }
};

/**
 * Update an existing transaction
 *
 * @param id The ID of the transaction to update
 * @param updates The transaction data to update
 * @returns Promise resolving to the updated Transaction
 */
export const updateTransaction = async (
  id: string,
  updates: TransactionUpdate
): Promise<Transaction> => {
  try {
    // Check if the transaction exists
    const existingTransaction = await getTransactionById(id);
    if (!existingTransaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    // Validate the updates
    const validation = await validateTransaction(updates);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error('Failed to update transaction: No data returned');
    }

    return data;
  } catch (error: any) {
    console.error(`Error updating transaction ${id}:`, error.message);
    throw new Error(`Failed to update transaction: ${error.message}`);
  }
};

/**
 * Delete a transaction
 *
 * @param id The ID of the transaction to delete
 * @returns Promise resolving to boolean indicating success
 */
export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    // Check if the transaction exists
    const existingTransaction = await getTransactionById(id);
    if (!existingTransaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) throw error;

    return true;
  } catch (error: any) {
    console.error(`Error deleting transaction ${id}:`, error.message);
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }
};

/**
 * Generate a summary of transactions for a specific time period (month/year)
 *
 * @param period The period in format YYYY-MM for monthly or YYYY for yearly
 * @returns Promise resolving to a TransactionSummary object
 */
export const getTransactionSummaryByPeriod = async (
  period: string
): Promise<TransactionSummary> => {
  try {
    let startDate: string, endDate: string;

    // Handle monthly period (YYYY-MM)
    if (/^\d{4}-\d{2}$/.test(period)) {
      const [year, month] = period.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
      startDate = `${period}-01`;
      endDate = `${period}-${lastDay}`;
    }
    // Handle yearly period (YYYY)
    else if (/^\d{4}$/.test(period)) {
      startDate = `${period}-01-01`;
      endDate = `${period}-12-31`;
    } else {
      throw new Error(
        'Invalid period format. Use YYYY-MM for monthly or YYYY for yearly summaries'
      );
    }

    // Get transactions for the period
    const transactions = await getTransactionsByDateRange(startDate, endDate);

    // Calculate totals
    const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    // Group by subscription
    const subscriptionMap = new Map<string, { id: string; name: string; amount: number }>();

    // Fetch subscription details for each transaction
    for (const transaction of transactions) {
      if (transaction.subscription_id) {
        // If already in the map, just add the amount
        if (subscriptionMap.has(transaction.subscription_id)) {
          const existing = subscriptionMap.get(transaction.subscription_id)!;
          existing.amount += transaction.amount;
        }
        // Otherwise fetch the subscription and add it to the map
        else {
          const subscription = await getSubscriptionById(transaction.subscription_id);
          if (subscription) {
            subscriptionMap.set(transaction.subscription_id, {
              id: subscription.id,
              name: subscription.name,
              amount: transaction.amount,
            });
          }
        }
      }
    }

    // Convert map to array for the response
    const subscriptionBreakdown = Array.from(subscriptionMap.values()).map(sub => ({
      subscriptionId: sub.id,
      subscriptionName: sub.name,
      amount: sub.amount,
    }));

    return {
      period,
      totalAmount,
      count: transactions.length,
      subscriptionBreakdown,
    };
  } catch (error: any) {
    console.error(`Error generating transaction summary for period ${period}:`, error.message);
    throw new Error(`Failed to generate transaction summary: ${error.message}`);
  }
};

// Export as default object with named methods
export default {
  getTransactions,
  getTransactionById,
  getTransactionsWithSubscriptions,
  getTransactionsBySubscription,
  getTransactionsByDateRange,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummaryByPeriod,
  validateTransaction,
  isValidAmount,
};
