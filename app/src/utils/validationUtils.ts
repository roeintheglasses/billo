/**
 * Validation Utilities
 * 
 * This file contains common validation functions used across the application
 * for validating user input and data models.
 */

import { 
  Subscription, 
  Transaction, 
  Category, 
  Notification,
  DarkPattern
} from '../types/supabase';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Create an empty validation result
 */
export const createValidationResult = (): ValidationResult => ({
  isValid: true,
  errors: {}
});

/**
 * Add an error to a validation result
 * 
 * @param result The validation result to update
 * @param field The field with the error
 * @param message The error message
 * @returns The updated validation result
 */
export const addValidationError = (
  result: ValidationResult,
  field: string,
  message: string
): ValidationResult => {
  return {
    isValid: false,
    errors: { ...result.errors, [field]: message }
  };
};

/**
 * Combine multiple validation results into one
 * 
 * @param results Array of validation results to combine
 * @returns A single validation result
 */
export const combineValidationResults = (
  results: ValidationResult[]
): ValidationResult => {
  return results.reduce(
    (combined, current) => ({
      isValid: combined.isValid && current.isValid,
      errors: { ...combined.errors, ...current.errors }
    }),
    createValidationResult()
  );
};

/**
 * Validate that a string is not empty
 * 
 * @param value The string to validate
 * @param fieldName The name of the field being validated
 * @returns A validation result
 */
export const validateRequired = (
  value: string | null | undefined,
  fieldName: string
): ValidationResult => {
  const result = createValidationResult();
  
  if (!value || value.trim() === '') {
    return addValidationError(result, fieldName, `${fieldName} is required`);
  }
  
  return result;
};

/**
 * Validate a numeric value is within range
 * 
 * @param value The number to validate
 * @param fieldName The name of the field being validated
 * @param min The minimum allowed value (inclusive)
 * @param max The maximum allowed value (inclusive)
 * @returns A validation result
 */
export const validateNumberRange = (
  value: number | null | undefined,
  fieldName: string,
  min?: number,
  max?: number
): ValidationResult => {
  const result = createValidationResult();
  
  if (value === null || value === undefined) {
    return addValidationError(result, fieldName, `${fieldName} is required`);
  }
  
  if (isNaN(value)) {
    return addValidationError(result, fieldName, `${fieldName} must be a valid number`);
  }
  
  if (min !== undefined && value < min) {
    return addValidationError(result, fieldName, `${fieldName} must be at least ${min}`);
  }
  
  if (max !== undefined && value > max) {
    return addValidationError(result, fieldName, `${fieldName} must not exceed ${max}`);
  }
  
  return result;
};

/**
 * Validate an email address format
 * 
 * @param email The email address to validate
 * @returns A validation result
 */
export const validateEmail = (email: string | null | undefined): ValidationResult => {
  const result = createValidationResult();
  
  if (!email || email.trim() === '') {
    return addValidationError(result, 'email', 'Email is required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return addValidationError(result, 'email', 'Invalid email format');
  }
  
  return result;
};

/**
 * Validate a date string is in correct format and is a valid date
 * 
 * @param dateStr The date string to validate
 * @param fieldName The name of the date field
 * @returns A validation result
 */
export const validateDate = (
  dateStr: string | null | undefined,
  fieldName: string
): ValidationResult => {
  const result = createValidationResult();
  
  if (!dateStr || dateStr.trim() === '') {
    return addValidationError(result, fieldName, `${fieldName} is required`);
  }
  
  // Check format (yyyy-MM-dd)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return addValidationError(result, fieldName, `${fieldName} must be in the format YYYY-MM-DD`);
  }
  
  // Check it's a valid date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return addValidationError(result, fieldName, `${fieldName} is not a valid date`);
  }
  
  return result;
};

/**
 * Validate a hex color code
 * 
 * @param color The color string to validate
 * @param fieldName The name of the color field
 * @returns A validation result
 */
export const validateHexColor = (
  color: string | null | undefined,
  fieldName: string
): ValidationResult => {
  const result = createValidationResult();
  
  if (!color) {
    return result; // Color can be optional
  }
  
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexColorRegex.test(color)) {
    return addValidationError(result, fieldName, `${fieldName} must be a valid hex color (e.g., #FF0000)`);
  }
  
  return result;
};

/**
 * Validate subscription billing cycle
 * 
 * @param cycle The billing cycle to validate
 * @returns A validation result
 */
export const validateBillingCycle = (cycle: string | null | undefined): ValidationResult => {
  const result = createValidationResult();
  
  if (!cycle || cycle.trim() === '') {
    return addValidationError(result, 'billing_cycle', 'Billing cycle is required');
  }
  
  const validCycles = ['monthly', 'yearly', 'weekly', 'quarterly', 'biannual'];
  if (!validCycles.includes(cycle.toLowerCase())) {
    return addValidationError(
      result, 
      'billing_cycle', 
      `Billing cycle must be one of: ${validCycles.join(', ')}`
    );
  }
  
  return result;
};

/**
 * Validate that a value exists in a set of allowed values
 * 
 * @param value The value to validate
 * @param allowedValues Array of allowed values
 * @param fieldName The name of the field being validated
 * @returns A validation result
 */
export const validateEnum = (
  value: string | null | undefined,
  allowedValues: string[],
  fieldName: string
): ValidationResult => {
  const result = createValidationResult();
  
  if (!value || value.trim() === '') {
    return addValidationError(result, fieldName, `${fieldName} is required`);
  }
  
  if (!allowedValues.includes(value)) {
    return addValidationError(
      result, 
      fieldName, 
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
  
  return result;
};

/**
 * Validate a UUID format
 * 
 * @param uuid The UUID to validate
 * @param fieldName The name of the field being validated
 * @returns A validation result
 */
export const validateUUID = (
  uuid: string | null | undefined,
  fieldName: string
): ValidationResult => {
  const result = createValidationResult();
  
  if (!uuid || uuid.trim() === '') {
    return addValidationError(result, fieldName, `${fieldName} is required`);
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return addValidationError(result, fieldName, `${fieldName} must be a valid UUID`);
  }
  
  return result;
};

// Model-specific validation functions

/**
 * Validate a Subscription object
 * 
 * @param subscription The Subscription to validate
 * @returns A validation result
 */
export const validateSubscription = (
  subscription: Partial<Subscription>
): ValidationResult => {
  const results: ValidationResult[] = [
    validateRequired(subscription.name, 'name'),
    validateNumberRange(subscription.amount, 'amount', 0),
    validateBillingCycle(subscription.billing_cycle),
    validateDate(subscription.start_date, 'start_date')
  ];
  
  if (subscription.next_billing_date) {
    results.push(validateDate(subscription.next_billing_date, 'next_billing_date'));
  }
  
  if (subscription.category_id) {
    results.push(validateUUID(subscription.category_id, 'category_id'));
  }
  
  return combineValidationResults(results);
};

/**
 * Validate a Transaction object
 * 
 * @param transaction The Transaction to validate
 * @returns A validation result
 */
export const validateTransaction = (
  transaction: Partial<Transaction>
): ValidationResult => {
  const results: ValidationResult[] = [
    validateNumberRange(transaction.amount, 'amount', 0),
    validateDate(transaction.date, 'date')
  ];
  
  if (transaction.subscription_id) {
    results.push(validateUUID(transaction.subscription_id, 'subscription_id'));
  }
  
  return combineValidationResults(results);
};

/**
 * Validate a Category object
 * 
 * @param category The Category to validate
 * @returns A validation result
 */
export const validateCategory = (category: Partial<Category>): ValidationResult => {
  const results: ValidationResult[] = [
    validateRequired(category.name, 'name')
  ];
  
  if (category.color) {
    results.push(validateHexColor(category.color, 'color'));
  }
  
  return combineValidationResults(results);
};

/**
 * Validate a Notification object
 * 
 * @param notification The Notification to validate
 * @returns A validation result
 */
export const validateNotification = (
  notification: Partial<Notification>
): ValidationResult => {
  const results: ValidationResult[] = [
    validateRequired(notification.title, 'title'),
    validateRequired(notification.message, 'message'),
    validateRequired(notification.type, 'type')
  ];
  
  const validTypes = ['system', 'subscription_due', 'price_change', 'reminder'];
  if (notification.type) {
    results.push(validateEnum(notification.type, validTypes, 'type'));
  }
  
  const validPriorities = ['low', 'medium', 'high'];
  if (notification.priority) {
    results.push(validateEnum(notification.priority, validPriorities, 'priority'));
  }
  
  return combineValidationResults(results);
}; 