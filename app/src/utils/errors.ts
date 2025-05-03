/**
 * Custom Error Classes
 * 
 * This file defines custom error classes used throughout the application
 * for more specific error handling.
 */

/**
 * Base class for all application errors
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends AppError {
  readonly errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error for database operation failures
 */
export class DatabaseError extends AppError {
  readonly code?: string;
  readonly originalError?: Error;

  constructor(message: string, code?: string, originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.originalError = originalError;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Error for authentication/authorization failures
 */
export class AuthError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Error for when a requested resource is not found
 */
export class NotFoundError extends AppError {
  readonly resourceType: string;
  readonly resourceId?: string;

  constructor(resourceType: string, resourceId?: string) {
    const message = resourceId
      ? `${resourceType} with ID '${resourceId}' not found`
      : `${resourceType} not found`;
    
    super(message);
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error for network-related issues
 */
export class NetworkError extends AppError {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error for rate limiting or quota issues
 */
export class RateLimitError extends AppError {
  readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Maps database error codes to user-friendly messages
 * 
 * @param code The database error code
 * @returns A user-friendly error message
 */
export const getDatabaseErrorMessage = (code?: string): string => {
  if (!code) return 'A database error occurred';

  // Common Postgres/Supabase error codes
  switch (code) {
    case '23505': // unique_violation
      return 'This record already exists';
    case '23503': // foreign_key_violation
      return 'This operation would break a relationship with another record';
    case '23514': // check_violation
      return 'The data does not meet the required constraints';
    case '23502': // not_null_violation
      return 'A required field is missing';
    case '22P02': // invalid_text_representation
      return 'Invalid data format provided';
    case '42P01': // undefined_table
      return 'The requested data table does not exist';
    case '42703': // undefined_column
      return 'A field in the request does not exist';
    default:
      return 'A database error occurred';
  }
};

/**
 * Determine if an error is a specific type of AppError
 * 
 * @param error The error to check
 * @param errorType The constructor of the error type to check against
 * @returns True if the error is of the specified type
 */
export const isErrorType = (
  error: unknown, 
  errorType: new (...args: any[]) => AppError
): boolean => {
  return error instanceof errorType;
};

/**
 * Create a user-friendly error message from any error
 * 
 * @param error The error to create a message from
 * @returns A user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof ValidationError) {
    const firstError = Object.values(error.errors)[0];
    return firstError || error.message;
  }
  
  if (error instanceof NotFoundError) {
    return error.message;
  }
  
  if (error instanceof DatabaseError) {
    return getDatabaseErrorMessage(error.code);
  }
  
  if (error instanceof AuthError) {
    return 'You do not have permission to perform this action';
  }
  
  if (error instanceof NetworkError) {
    return 'Network error. Please check your connection and try again';
  }
  
  if (error instanceof RateLimitError) {
    return `Too many requests. Please try again ${error.retryAfter ? `in ${error.retryAfter} seconds` : 'later'}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}; 