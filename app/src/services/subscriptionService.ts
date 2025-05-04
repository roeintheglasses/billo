/**
 * Subscription Service
 *
 * This service provides functions for managing subscriptions in the application
 * including CRUD operations, validation, and relationship to categories.
 */

import { supabase } from './supabase';
import {
  Subscription,
  SubscriptionInsert,
  SubscriptionUpdate,
  SubscriptionWithCategory,
  Category,
} from '../types/supabase';
import { getCategoryById } from './categoryService';
import { validateSubscription } from '../utils/validationUtils';
import errorHandler from '../utils/errorHandler';
import logger from '../utils/logger';
import { NotFoundError, DatabaseError } from '../utils/errors';
import {
  detectDuplicateSubscription,
  determinePreferredSubscription,
  DEFAULT_DUPLICATE_DETECTION_CONFIG,
  DuplicateDetectionConfig,
  DuplicateDetectionResult,
} from '../utils/duplicateDetectionUtils';

/**
 * Supported billing cycle values
 */
export const BILLING_CYCLES = ['monthly', 'yearly', 'weekly', 'quarterly', 'biannually'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

/**
 * Normalize subscription amount to a monthly value
 *
 * @param amount The subscription amount
 * @param billingCycle The billing cycle
 * @returns The equivalent monthly amount
 */
export const normalizeAmountToMonthly = (amount: number, billingCycle: string): number => {
  switch (billingCycle) {
    case 'weekly':
      return amount * 4.33; // Average weeks in a month
    case 'yearly':
      return amount / 12;
    case 'quarterly':
      return amount / 3;
    case 'biannually':
      return amount / 6;
    case 'monthly':
      return amount;
    default:
      logger.warn(`Unknown billing cycle: ${billingCycle}, treating as monthly`);
      return amount;
  }
};

/**
 * Calculates the next billing date based on the start date and billing cycle
 *
 * @param startDate The start date of the subscription
 * @param billingCycle The billing cycle frequency
 * @param referenceDate The reference date to calculate from (defaults to current date)
 * @returns The next billing date
 */
export const calculateNextBillingDate = (
  startDate: string | Date,
  billingCycle: string,
  referenceDate: Date = new Date()
): Date => {
  const start = new Date(startDate);
  const reference = new Date(referenceDate);

  // Ensure dates are valid
  if (isNaN(start.getTime()) || isNaN(reference.getTime())) {
    throw new Error('Invalid date provided');
  }

  // If the start date is in the future, it's the next billing date
  if (start > reference) {
    return start;
  }

  // Clone the start date
  const nextDate = new Date(start);

  // Calculate the cycle length and next date
  switch (billingCycle) {
    case 'weekly':
      // Calculate time elapsed since start
      const elapsedMs = reference.getTime() - start.getTime();
      const cycleLengthMs = 7 * 24 * 60 * 60 * 1000;
      // Calculate how many cycles have passed
      const cyclesPassed = Math.ceil(elapsedMs / cycleLengthMs);
      // Add that many cycles to the start date
      nextDate.setTime(start.getTime() + cyclesPassed * cycleLengthMs);
      return nextDate;

    case 'monthly':
      // Move forward month by month to handle variable month lengths
      while (nextDate < reference) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      return nextDate;

    case 'quarterly':
      // Move forward 3 months at a time
      while (nextDate < reference) {
        nextDate.setMonth(nextDate.getMonth() + 3);
      }
      return nextDate;

    case 'biannually':
      // Move forward 6 months at a time
      while (nextDate < reference) {
        nextDate.setMonth(nextDate.getMonth() + 6);
      }
      return nextDate;

    case 'yearly':
      // Move forward year by year
      while (nextDate < reference) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      return nextDate;

    default:
      throw new Error(`Unhandled billing cycle: ${billingCycle}`);
  }
};

/**
 * Get all subscriptions for the current user
 *
 * @returns Promise resolving to an array of Subscription objects
 */
export const getSubscriptions = errorHandler.withErrorHandling(
  async (): Promise<Subscription[]> => {
    const { data, error } = await supabase.from('subscriptions').select('*').order('name');

    if (error) throw error;

    return data || [];
  },
  'Subscription'
);

/**
 * Get all subscriptions with their associated categories
 *
 * @returns Promise resolving to an array of SubscriptionWithCategory objects
 */
export const getSubscriptionsWithCategories = errorHandler.withErrorHandling(
  async (): Promise<SubscriptionWithCategory[]> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .order('name');

    if (error) throw error;

    return data || [];
  },
  'Subscription'
);

/**
 * Get a single subscription by ID
 *
 * @param id The ID of the subscription to retrieve
 * @returns Promise resolving to a Subscription object or null if not found
 * @throws NotFoundError if the subscription doesn't exist
 */
export const getSubscriptionById = errorHandler.withErrorHandling(
  async (id: string): Promise<Subscription> => {
    const { data, error } = await supabase.from('subscriptions').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        // "Not found" error code
        throw new NotFoundError('Subscription', id);
      }
      throw error;
    }

    return errorHandler.checkRecordFound(data, 'Subscription', id);
  },
  'Subscription'
);

/**
 * Get a single subscription with its category by ID
 *
 * @param id The ID of the subscription to retrieve
 * @returns Promise resolving to a SubscriptionWithCategory object
 * @throws NotFoundError if the subscription doesn't exist
 */
export const getSubscriptionWithCategoryById = errorHandler.withErrorHandling(
  async (id: string): Promise<SubscriptionWithCategory> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // "Not found" error code
        throw new NotFoundError('Subscription', id);
      }
      throw error;
    }

    return errorHandler.checkRecordFound(data, 'Subscription', id);
  },
  'Subscription'
);

/**
 * Get all subscriptions for a specific category
 *
 * @param categoryId The ID of the category
 * @returns Promise resolving to an array of Subscription objects
 */
export const getSubscriptionsByCategory = errorHandler.withErrorHandling(
  async (categoryId: string): Promise<Subscription[]> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');

    if (error) throw error;

    return data || [];
  },
  'Subscription'
);

/**
 * Get upcoming subscriptions that are due within a specified number of days
 *
 * @param days Number of days to look ahead (default: 7)
 * @returns Promise resolving to an array of SubscriptionWithCategory objects
 */
export const getUpcomingSubscriptions = errorHandler.withErrorHandling(
  async (days: number = 7): Promise<SubscriptionWithCategory[]> => {
    // Calculate the date range
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .gte('next_billing_date', todayStr)
      .lte('next_billing_date', futureDateStr)
      .order('next_billing_date');

    if (error) throw error;

    return data || [];
  },
  'Subscription'
);

/**
 * Create a new subscription
 *
 * @param subscription The subscription data to insert
 * @returns Promise resolving to the created Subscription
 * @throws ValidationError if validation fails
 */
export const createSubscription = errorHandler.withErrorHandling(
  async (subscription: SubscriptionInsert): Promise<Subscription> => {
    // Validate the subscription data
    errorHandler.validateOrThrow(subscription, validateSubscription, 'Subscription');

    // Calculate next billing date if needed
    if (subscription.start_date && subscription.billing_cycle && !subscription.next_billing_date) {
      try {
        const nextDate = calculateNextBillingDate(
          subscription.start_date,
          subscription.billing_cycle
        );
        subscription.next_billing_date = nextDate.toISOString().split('T')[0];
      } catch (err) {
        logger.warn('Failed to calculate next billing date', err);
        // Continue without setting next_billing_date
      }
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) throw error;

    logger.info('Subscription created successfully', { id: data.id });
    return data;
  },
  'Subscription'
);

/**
 * Update an existing subscription
 *
 * @param id The ID of the subscription to update
 * @param updates The subscription data to update
 * @returns Promise resolving to the updated Subscription
 * @throws ValidationError if validation fails
 * @throws NotFoundError if the subscription doesn't exist
 */
export const updateSubscription = errorHandler.withErrorHandling(
  async (id: string, updates: SubscriptionUpdate): Promise<Subscription> => {
    // Validate the subscription updates
    errorHandler.validateOrThrow(updates, validateSubscription, 'Subscription');

    // Check if the subscription exists
    await getSubscriptionById(id);

    // Recalculate next billing date if billing information changed
    if ((updates.start_date || updates.billing_cycle) && !updates.next_billing_date) {
      // Get the current subscription data
      const currentSubscription = await getSubscriptionById(id);

      // Determine the start date and billing cycle to use for calculation
      const startDate = updates.start_date || currentSubscription.start_date;
      const billingCycle = updates.billing_cycle || currentSubscription.billing_cycle;

      if (startDate && billingCycle) {
        try {
          const nextDate = calculateNextBillingDate(startDate, billingCycle);
          updates.next_billing_date = nextDate.toISOString().split('T')[0];
        } catch (err) {
          logger.warn('Failed to recalculate next billing date during update', err);
          // Continue without updating next_billing_date
        }
      }
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      throw new NotFoundError('Subscription', id);
    }

    logger.info('Subscription updated successfully', { id });
    return data;
  },
  'Subscription'
);

/**
 * Delete a subscription
 *
 * @param id The ID of the subscription to delete
 * @returns Promise resolving to a boolean indicating success
 * @throws NotFoundError if the subscription doesn't exist
 */
export const deleteSubscription = errorHandler.withErrorHandling(
  async (id: string): Promise<boolean> => {
    // Check if the subscription exists
    await getSubscriptionById(id);

    const { error } = await supabase.from('subscriptions').delete().eq('id', id);

    if (error) throw error;

    logger.info('Subscription deleted successfully', { id });
    return true;
  },
  'Subscription'
);

/**
 * Calculate the total monthly spending on subscriptions
 *
 * @returns Promise resolving to the total monthly amount
 */
export const calculateTotalMonthlySpend = errorHandler.withErrorHandling(
  async (): Promise<number> => {
    const subscriptions = await getSubscriptions();

    return subscriptions.reduce((total, subscription) => {
      // Convert all billing cycles to monthly equivalent
      const monthlyAmount = normalizeAmountToMonthly(
        subscription.amount,
        subscription.billing_cycle
      );
      return total + monthlyAmount;
    }, 0);
  },
  'Subscription'
);

/**
 * Calculate spending by category
 *
 * @returns Promise resolving to an array of categories with their total amounts
 */
export const calculateSpendingByCategory = errorHandler.withErrorHandling(
  async (): Promise<{ category: Category; amount: number }[]> => {
    const subscriptionsWithCategories = await getSubscriptionsWithCategories();

    // Group subscriptions by category
    const categoryMap = new Map<
      string,
      { category: Category; subscriptions: SubscriptionWithCategory[] }
    >();

    // First pass: organize subscriptions by category
    for (const subscription of subscriptionsWithCategories) {
      if (subscription.category) {
        const categoryId = subscription.category.id;

        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            category: subscription.category,
            subscriptions: [],
          });
        }

        categoryMap.get(categoryId)?.subscriptions.push(subscription);
      }
    }

    // Second pass: calculate amounts for each category
    const result: { category: Category; amount: number }[] = [];

    for (const { category, subscriptions } of categoryMap.values()) {
      const totalAmount = subscriptions.reduce((sum, subscription) => {
        // Convert to monthly amount
        const monthlyAmount = normalizeAmountToMonthly(
          subscription.amount,
          subscription.billing_cycle
        );
        return sum + monthlyAmount;
      }, 0);

      result.push({
        category,
        amount: totalAmount,
      });
    }

    // Sort by amount (highest first)
    return result.sort((a, b) => b.amount - a.amount);
  },
  'Subscription'
);

/**
 * Calculate the spending for a specific time period
 *
 * @param startDate The start date of the period (YYYY-MM-DD)
 * @param endDate The end date of the period (YYYY-MM-DD)
 * @returns Promise resolving to the total amount spent in the period
 */
export const calculateSpendForPeriod = errorHandler.withErrorHandling(
  async (startDate: string, endDate: string): Promise<number> => {
    // Validate input dates
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format');
    }

    if (start > end) {
      throw new Error('Start date must be before end date');
    }

    // Get all subscriptions
    const subscriptions = await getSubscriptions();

    // Calculate the total spending for the period
    let totalSpent = 0;

    for (const subscription of subscriptions) {
      const subscriptionStartDate = new Date(subscription.start_date);

      // Skip if subscription starts after the period ends
      if (subscriptionStartDate > end) {
        continue;
      }

      // Calculate how many times the subscription was billed in this period
      const billingDates = [];
      let currentDate = new Date(subscriptionStartDate);

      // Generate all billing dates for this subscription within the period
      while (currentDate <= end) {
        if (currentDate >= start) {
          billingDates.push(new Date(currentDate));
        }

        // Move to next billing date based on cycle
        switch (subscription.billing_cycle) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'quarterly':
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
          case 'biannually':
            currentDate.setMonth(currentDate.getMonth() + 6);
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            // Skip unknown billing cycles
            logger.warn(
              `Unknown billing cycle: ${subscription.billing_cycle} for subscription ${subscription.id}`
            );
            currentDate = new Date(end.getTime() + 1); // Exit the loop
        }
      }

      // Add subscription cost for each billing date in the period
      totalSpent += subscription.amount * billingDates.length;
    }

    return totalSpent;
  },
  'Subscription'
);

/**
 * Find potential duplicate subscriptions for a given subscription
 *
 * @param subscription The subscription to check for duplicates, or its ID
 * @param config Duplicate detection configuration
 * @returns Promise resolving to duplicate detection result
 */
export const findDuplicateSubscriptions = errorHandler.withErrorHandling(
  async (
    subscription: Subscription | string,
    config: DuplicateDetectionConfig = DEFAULT_DUPLICATE_DETECTION_CONFIG
  ): Promise<DuplicateDetectionResult> => {
    // If subscription is a string (ID), fetch the subscription
    const subscriptionObj =
      typeof subscription === 'string' ? await getSubscriptionById(subscription) : subscription;

    // Get all subscriptions for the user
    const userSubscriptions = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', subscriptionObj.user_id);

    if (userSubscriptions.error) {
      throw userSubscriptions.error;
    }

    // Filter out the current subscription from the list
    const otherSubscriptions = (userSubscriptions.data || []).filter(
      sub => sub.id !== subscriptionObj.id
    );

    // Use the duplicate detection utility to find duplicates
    return detectDuplicateSubscription(subscriptionObj, otherSubscriptions, config);
  },
  'Subscription'
);

/**
 * Merge duplicate subscriptions into a single subscription
 *
 * @param subscriptions Array of duplicate subscriptions to merge
 * @param keepId Optional ID of the subscription to keep (if not provided, the best one will be chosen)
 * @returns Promise resolving to the merged subscription
 */
export const mergeSubscriptions = errorHandler.withErrorHandling(
  async (subscriptions: Subscription[], keepId?: string): Promise<Subscription> => {
    if (!subscriptions.length) {
      throw new Error('No subscriptions provided for merging');
    }

    if (subscriptions.length === 1) {
      return subscriptions[0];
    }

    // Determine which subscription to keep
    let subscriptionToKeep: Subscription;

    if (keepId) {
      const found = subscriptions.find(sub => sub.id === keepId);
      if (!found) {
        throw new Error(`Subscription with ID ${keepId} not found in the provided subscriptions`);
      }
      subscriptionToKeep = found;
    } else {
      subscriptionToKeep = determinePreferredSubscription(subscriptions);
    }

    // Get IDs of the subscriptions to delete
    const subscriptionIdsToDelete = subscriptions
      .filter(sub => sub.id !== subscriptionToKeep.id)
      .map(sub => sub.id);

    // Start a transaction
    const { error: transactionError } = await supabase.rpc('merge_subscriptions', {
      keep_id: subscriptionToKeep.id,
      delete_ids: subscriptionIdsToDelete,
    });

    if (transactionError) {
      // If the RPC fails, do it manually
      logger.warn('Merge subscriptions RPC failed, falling back to manual merge', {
        error: transactionError,
        keepId: subscriptionToKeep.id,
        deleteIds: subscriptionIdsToDelete,
      });

      // Update subscription messages to link to the kept subscription
      for (const deleteId of subscriptionIdsToDelete) {
        const { error: updateError } = await supabase
          .from('subscription_messages')
          .update({ subscription_id: subscriptionToKeep.id })
          .eq('subscription_id', deleteId);

        if (updateError) {
          logger.error('Failed to update subscription messages during merge', {
            error: updateError,
            keepId: subscriptionToKeep.id,
            deleteId,
          });
        }

        // Update transactions to link to the kept subscription
        const { error: transactionUpdateError } = await supabase
          .from('transactions')
          .update({ subscription_id: subscriptionToKeep.id })
          .eq('subscription_id', deleteId);

        if (transactionUpdateError) {
          logger.error('Failed to update transactions during merge', {
            error: transactionUpdateError,
            keepId: subscriptionToKeep.id,
            deleteId,
          });
        }

        // Delete the duplicate subscription
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', deleteId);

        if (deleteError) {
          logger.error('Failed to delete duplicate subscription during merge', {
            error: deleteError,
            deleteId,
          });
        }
      }
    }

    // Get the updated subscription
    return getSubscriptionById(subscriptionToKeep.id);
  },
  'Subscription'
);

/**
 * Create a subscription, checking for duplicates
 *
 * @param subscription The subscription data to insert
 * @param checkDuplicates Whether to check for duplicates
 * @param autoMergeDuplicates Whether to automatically merge duplicates if found
 * @returns Promise resolving to the created subscription or duplicate detection result
 */
export const createSubscriptionWithDuplicateCheck = errorHandler.withErrorHandling(
  async (
    subscription: SubscriptionInsert,
    checkDuplicates: boolean = true,
    autoMergeDuplicates: boolean = false
  ): Promise<
    Subscription | { subscription: Subscription; duplicates: DuplicateDetectionResult }
  > => {
    // First create the subscription
    const newSubscription = await createSubscription(subscription);

    // If duplicate checking is disabled, return the new subscription
    if (!checkDuplicates) {
      return newSubscription;
    }

    // Check for duplicates
    const duplicateResult = await findDuplicateSubscriptions(newSubscription);

    // If no duplicates found, return the new subscription
    if (!duplicateResult.isDuplicate) {
      return newSubscription;
    }

    // If duplicates found and auto-merge is enabled, merge them
    if (autoMergeDuplicates) {
      const allSubscriptions = [newSubscription, ...duplicateResult.duplicates];
      return mergeSubscriptions(allSubscriptions);
    }

    // Otherwise, return the new subscription along with duplicate information for UI handling
    return {
      subscription: newSubscription,
      duplicates: duplicateResult,
    };
  },
  'Subscription'
);

/**
 * Run a batch duplicate detection on all subscriptions for a user
 *
 * @param userId The user ID
 * @param config Duplicate detection configuration
 * @returns Promise resolving to an array of duplicate groups
 */
export const batchFindDuplicates = errorHandler.withErrorHandling(
  async (
    userId: string,
    config: DuplicateDetectionConfig = DEFAULT_DUPLICATE_DETECTION_CONFIG
  ): Promise<Subscription[][]> => {
    // Get all subscriptions for the user
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId);

    if (error) throw error;
    if (!data || !data.length) return [];

    const subscriptions = data as Subscription[];
    const duplicateGroups: Subscription[][] = [];
    const processedIds = new Set<string>();

    // Check each subscription against others
    for (const subscription of subscriptions) {
      // Skip if already processed
      if (processedIds.has(subscription.id)) continue;

      const result = detectDuplicateSubscription(
        subscription,
        subscriptions.filter(s => s.id !== subscription.id),
        config
      );

      if (result.isDuplicate && result.duplicates.length > 0) {
        // Add this subscription and its duplicates to a group
        const group = [subscription, ...result.duplicates];
        duplicateGroups.push(group);

        // Mark all as processed
        group.forEach(s => processedIds.add(s.id));
      } else {
        // Just mark this one as processed
        processedIds.add(subscription.id);
      }
    }

    return duplicateGroups;
  },
  'Subscription'
);

export default {
  getSubscriptions,
  getSubscriptionsWithCategories,
  getSubscriptionById,
  getSubscriptionWithCategoryById,
  getSubscriptionsByCategory,
  getUpcomingSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  calculateTotalMonthlySpend,
  calculateSpendingByCategory,
  calculateSpendForPeriod,
  calculateNextBillingDate,
  normalizeAmountToMonthly,
  findDuplicateSubscriptions,
  mergeSubscriptions,
  createSubscriptionWithDuplicateCheck,
  batchFindDuplicates,
};
