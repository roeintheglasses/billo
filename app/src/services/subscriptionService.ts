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
};
