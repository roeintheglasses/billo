/**
 * Format Utilities
 * 
 * Utility functions for formatting different types of data for display.
 */

/**
 * Format a number as a currency string
 * 
 * @param amount The number to format
 * @param currency The currency code (default: USD)
 * @param locale The locale to use for formatting (default: en-US)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format a number as a percentage
 * 
 * @param value The decimal value to format as percentage (0.5 = 50%)
 * @param digits Number of digits after decimal (default: 0)
 * @param locale The locale to use for formatting (default: en-US)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  digits: number = 0,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
};

/**
 * Format a number with thousands separators
 * 
 * @param value The number to format
 * @param digits Number of digits after decimal (default: 0)
 * @param locale The locale to use for formatting (default: en-US)
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number,
  digits: number = 0,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
};

export default {
  formatCurrency,
  formatPercentage,
  formatNumber
}; 