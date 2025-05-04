/**
 * Date utility functions for the application
 */
import { BillingCycle } from './constants';

/**
 * Format a date to a readable string
 * @param date Date to format
 * @returns Formatted date string (e.g., "Jan 1, 2023")
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Calculate the next billing date based on the start date and billing cycle
 * @param startDate Start date of the subscription
 * @param billingCycle Billing cycle (monthly, yearly, etc.)
 * @returns Date object representing the next billing date
 */
export const getNextBillingDate = (startDate: Date, billingCycle: BillingCycle): Date => {
  const nextDate = new Date(startDate);
  
  switch (billingCycle) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'biannually':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    default:
      // Default to monthly if unknown
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
}; 