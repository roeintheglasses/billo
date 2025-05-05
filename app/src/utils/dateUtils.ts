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

/**
 * Date utilities for formatting and manipulating dates
 */

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 * @param date The date to format
 * @returns A string representing the relative time
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

/**
 * Format a date as a short date string (e.g., "Jan 1, 2023")
 * @param date The date to format
 * @returns A short date string
 */
export const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a date as a time string (e.g., "3:45 PM")
 * @param date The date to format
 * @returns A time string
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format a date as a datetime string (e.g., "Jan 1, 2023, 3:45 PM")
 * @param date The date to format
 * @returns A datetime string
 */
export const formatDateTime = (date: Date): string => {
  return `${formatShortDate(date)}, ${formatTime(date)}`;
};

/**
 * Group dates by day for display in lists
 * @param dates List of dates
 * @returns Object with dates grouped by day
 */
export const groupDatesByDay = (dates: Date[]): Record<string, Date[]> => {
  const groups: Record<string, Date[]> = {};

  dates.forEach(date => {
    const day = date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(date);
  });

  return groups;
};

/**
 * Check if a date is today
 * @param date The date to check
 * @returns True if the date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is yesterday
 * @param date The date to check
 * @returns True if the date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Format a date as a friendly day string (e.g., "Today", "Yesterday", or the actual date)
 * @param date The date to format
 * @returns A friendly day string
 */
export const formatFriendlyDay = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return formatShortDate(date);
};
