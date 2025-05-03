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
  Category
} from '../types/supabase';
import { getCategoryById } from './categoryService';

/**
 * Supported billing cycle values
 */
export const BILLING_CYCLES = ['monthly', 'yearly', 'weekly', 'quarterly', 'biannually'] as const;
export type BillingCycle = typeof BILLING_CYCLES[number];

/**
 * Validates that the billing cycle is a supported value
 * 
 * @param cycle The billing cycle to validate
 * @returns True if the billing cycle is valid
 */
export const isValidBillingCycle = (cycle: string): boolean => {
  return BILLING_CYCLES.includes(cycle as BillingCycle);
};

/**
 * Validates that the amount is a positive number
 * 
 * @param amount The amount to validate
 * @returns True if the amount is valid
 */
export const isValidAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount > 0;
};

/**
 * Validates a date string is in a valid format (YYYY-MM-DD)
 * 
 * @param dateString The date string to validate
 * @returns True if the date format is valid
 */
export const isValidDateFormat = (dateString: string): boolean => {
  // Accept empty/null values
  if (!dateString) return true;
  
  // Check for valid ISO date format (YYYY-MM-DD)
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(Date.parse(dateString));
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
  
  if (!isValidBillingCycle(billingCycle)) {
    throw new Error(`Invalid billing cycle: ${billingCycle}`);
  }
  
  // If the start date is in the future, it's the next billing date
  if (start > reference) {
    return start;
  }
  
  // Clone the start date
  const nextDate = new Date(start);
  
  // Calculate time elapsed since start
  const elapsedMs = reference.getTime() - start.getTime();
  
  // Calculate the cycle length in milliseconds
  let cycleLengthMs: number;
  
  switch (billingCycle) {
    case 'weekly':
      cycleLengthMs = 7 * 24 * 60 * 60 * 1000;
      break;
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
  
  // For fixed-length cycles (like weekly)
  if (cycleLengthMs) {
    // Calculate how many cycles have passed
    const cyclesPassed = Math.ceil(elapsedMs / cycleLengthMs);
    
    // Add that many cycles to the start date
    nextDate.setTime(start.getTime() + (cyclesPassed * cycleLengthMs));
    
    return nextDate;
  }
  
  throw new Error('Failed to calculate next billing date');
};

/**
 * Validates a subscription object
 * 
 * @param subscription The subscription object to validate
 * @returns An object with isValid and error properties
 */
export const validateSubscription = async (
  subscription: Partial<SubscriptionInsert> | Partial<SubscriptionUpdate>
): Promise<{ isValid: boolean; error?: string }> => {
  // Validate required fields for new subscriptions
  if ('name' in subscription && !subscription.name) {
    return { isValid: false, error: 'Subscription name is required' };
  }
  
  if ('amount' in subscription && subscription.amount !== undefined) {
    if (!isValidAmount(subscription.amount)) {
      return { isValid: false, error: 'Amount must be a positive number' };
    }
  }
  
  if ('billing_cycle' in subscription && subscription.billing_cycle) {
    if (!isValidBillingCycle(subscription.billing_cycle)) {
      return { 
        isValid: false, 
        error: `Invalid billing cycle. Valid values are: ${BILLING_CYCLES.join(', ')}` 
      };
    }
  }
  
  if ('start_date' in subscription && subscription.start_date) {
    if (!isValidDateFormat(subscription.start_date)) {
      return { isValid: false, error: 'Invalid start date format. Use YYYY-MM-DD' };
    }
  }
  
  // Validate category relationship if provided
  if (subscription.category_id) {
    const category = await getCategoryById(subscription.category_id);
    if (!category) {
      return { isValid: false, error: 'Invalid category ID' };
    }
  }
  
  return { isValid: true };
};

/**
 * Get all subscriptions for the current user
 * 
 * @returns Promise resolving to an array of Subscription objects
 */
export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error.message);
    throw new Error(`Failed to fetch subscriptions: ${error.message}`);
  }
};

/**
 * Get all subscriptions with their associated categories
 * 
 * @returns Promise resolving to an array of SubscriptionWithCategory objects
 */
export const getSubscriptionsWithCategories = async (): Promise<SubscriptionWithCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        category:categories(*)
      `)
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error('Error fetching subscriptions with categories:', error.message);
    throw new Error(`Failed to fetch subscriptions with categories: ${error.message}`);
  }
};

/**
 * Get a single subscription by ID
 * 
 * @param id The ID of the subscription to retrieve
 * @returns Promise resolving to a Subscription object or null if not found
 */
export const getSubscriptionById = async (id: string): Promise<Subscription | null> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // "Not found" error code
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error fetching subscription with id ${id}:`, error.message);
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }
};

/**
 * Get a single subscription with its category
 * 
 * @param id The ID of the subscription to retrieve
 * @returns Promise resolving to a SubscriptionWithCategory object or null if not found
 */
export const getSubscriptionWithCategoryById = async (id: string): Promise<SubscriptionWithCategory | null> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // "Not found" error code
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error fetching subscription with id ${id}:`, error.message);
    throw new Error(`Failed to fetch subscription with category: ${error.message}`);
  }
};

/**
 * Get subscriptions by category ID
 * 
 * @param categoryId The ID of the category to filter by
 * @returns Promise resolving to an array of Subscription objects
 */
export const getSubscriptionsByCategory = async (categoryId: string): Promise<Subscription[]> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error(`Error fetching subscriptions for category ${categoryId}:`, error.message);
    throw new Error(`Failed to fetch subscriptions by category: ${error.message}`);
  }
};

/**
 * Get upcoming subscriptions due in the next X days
 * 
 * @param days Number of days to look ahead (default: 7)
 * @returns Promise resolving to an array of SubscriptionWithCategory objects
 */
export const getUpcomingSubscriptions = async (days: number = 7): Promise<SubscriptionWithCategory[]> => {
  try {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    const todayFormatted = today.toISOString().split('T')[0];
    const futureDateFormatted = futureDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        category:categories(*)
      `)
      .gte('next_billing_date', todayFormatted)
      .lte('next_billing_date', futureDateFormatted)
      .order('next_billing_date');
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error('Error fetching upcoming subscriptions:', error.message);
    throw new Error(`Failed to fetch upcoming subscriptions: ${error.message}`);
  }
};

/**
 * Create a new subscription
 * 
 * @param subscription The subscription data to insert
 * @returns Promise resolving to the created Subscription
 */
export const createSubscription = async (subscription: SubscriptionInsert): Promise<Subscription> => {
  try {
    // Validate the subscription data
    const validation = await validateSubscription(subscription);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Calculate next billing date if not provided
    if (!subscription.next_billing_date && subscription.start_date && subscription.billing_cycle) {
      const nextDate = calculateNextBillingDate(
        subscription.start_date,
        subscription.billing_cycle
      );
      subscription.next_billing_date = nextDate.toISOString().split('T')[0];
    }
    
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      throw new Error('Failed to create subscription: No data returned');
    }
    
    return data;
  } catch (error: any) {
    console.error('Error creating subscription:', error.message);
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
};

/**
 * Update an existing subscription
 * 
 * @param id The ID of the subscription to update
 * @param updates The subscription data to update
 * @returns Promise resolving to the updated Subscription
 */
export const updateSubscription = async (id: string, updates: SubscriptionUpdate): Promise<Subscription> => {
  try {
    // Validate the updates
    const validation = await validateSubscription(updates);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // If start_date or billing_cycle changed, recalculate next_billing_date
    const currentSubscription = await getSubscriptionById(id);
    if (!currentSubscription) {
      throw new Error(`Subscription with ID ${id} not found`);
    }
    
    const updatedSubscription = { ...currentSubscription, ...updates };
    
    // Recalculate next billing date if start date or billing cycle changed
    if (
      (updates.start_date || updates.billing_cycle) &&
      updatedSubscription.start_date &&
      updatedSubscription.billing_cycle
    ) {
      const nextDate = calculateNextBillingDate(
        updatedSubscription.start_date,
        updatedSubscription.billing_cycle
      );
      updates.next_billing_date = nextDate.toISOString().split('T')[0];
    }
    
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      throw new Error(`Subscription with ID ${id} not found`);
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error updating subscription with id ${id}:`, error.message);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
};

/**
 * Delete a subscription by ID
 * 
 * @param id The ID of the subscription to delete
 * @returns Promise resolving to true if the deletion was successful
 */
export const deleteSubscription = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error(`Error deleting subscription with id ${id}:`, error.message);
    throw new Error(`Failed to delete subscription: ${error.message}`);
  }
};

/**
 * Calculate total monthly spending across all subscriptions
 * 
 * @returns Promise resolving to the total monthly spend
 */
export const calculateTotalMonthlySpend = async (): Promise<number> => {
  try {
    const subscriptions = await getSubscriptions();
    
    let monthlyTotal = 0;
    
    for (const subscription of subscriptions) {
      switch (subscription.billing_cycle) {
        case 'weekly':
          monthlyTotal += subscription.amount * 4.33; // Average weeks in a month
          break;
        case 'monthly':
          monthlyTotal += subscription.amount;
          break;
        case 'quarterly':
          monthlyTotal += subscription.amount / 3;
          break;
        case 'biannually':
          monthlyTotal += subscription.amount / 6;
          break;
        case 'yearly':
          monthlyTotal += subscription.amount / 12;
          break;
      }
    }
    
    return parseFloat(monthlyTotal.toFixed(2));
  } catch (error: any) {
    console.error('Error calculating total monthly spend:', error.message);
    throw new Error(`Failed to calculate total monthly spend: ${error.message}`);
  }
};

/**
 * Calculate total spending by category
 * 
 * @returns Promise resolving to an array of { category, amount } objects
 */
export const calculateSpendingByCategory = async (): Promise<{ category: Category, amount: number }[]> => {
  try {
    const subscriptionsWithCategories = await getSubscriptionsWithCategories();
    
    const categorySpending: Record<string, { category: Category, amount: number }> = {};
    
    for (const subscription of subscriptionsWithCategories) {
      if (!subscription.category) continue;
      
      const categoryId = subscription.category.id;
      
      if (!categorySpending[categoryId]) {
        categorySpending[categoryId] = {
          category: subscription.category,
          amount: 0
        };
      }
      
      let monthlyAmount = 0;
      
      switch (subscription.billing_cycle) {
        case 'weekly':
          monthlyAmount = subscription.amount * 4.33; // Average weeks in a month
          break;
        case 'monthly':
          monthlyAmount = subscription.amount;
          break;
        case 'quarterly':
          monthlyAmount = subscription.amount / 3;
          break;
        case 'biannually':
          monthlyAmount = subscription.amount / 6;
          break;
        case 'yearly':
          monthlyAmount = subscription.amount / 12;
          break;
      }
      
      categorySpending[categoryId].amount += monthlyAmount;
    }
    
    return Object.values(categorySpending).map(({ category, amount }) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    }));
  } catch (error: any) {
    console.error('Error calculating spending by category:', error.message);
    throw new Error(`Failed to calculate spending by category: ${error.message}`);
  }
};

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
  calculateNextBillingDate,
  calculateTotalMonthlySpend,
  calculateSpendingByCategory,
  validateSubscription,
  isValidAmount,
  isValidBillingCycle,
  isValidDateFormat,
  BILLING_CYCLES
}; 