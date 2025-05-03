/**
 * Error Handler Utility
 * 
 * This file provides utilities for handling errors in service operations.
 */

import { PostgrestError } from '@supabase/supabase-js';
import {
  AppError,
  ValidationError,
  DatabaseError,
  NotFoundError,
  getUserFriendlyErrorMessage
} from './errors';
import logger from './logger';
import { ValidationResult } from './validationUtils';

/**
 * Process a PostgrestError from Supabase into a DatabaseError
 * 
 * @param error PostgrestError from Supabase
 * @param entity The entity type that had the error
 * @returns A DatabaseError with appropriate fields
 */
export const processSupabaseError = (
  error: PostgrestError | null,
  entity: string
): DatabaseError => {
  if (!error) {
    return new DatabaseError(`An unknown database error occurred with ${entity}`);
  }

  // Extract the Postgres error code (if available)
  const pgErrorCode = error.code;
  const errorMessage = error.message || `Error during database operation on ${entity}`;
  
  return new DatabaseError(
    errorMessage,
    pgErrorCode,
    new Error(errorMessage)
  );
};

/**
 * Check if a record was found in the database
 * 
 * @param result The result to check
 * @param entity The entity type being looked for
 * @param id Optional ID of the entity
 * @throws NotFoundError if the record was not found
 */
export const checkRecordFound = <T>(
  result: T | null,
  entity: string,
  id?: string
): T => {
  if (result === null) {
    throw new NotFoundError(entity, id);
  }
  return result;
};

/**
 * Validate and process data before database operations
 * 
 * @param data The data to validate
 * @param validateFn The function to validate the data
 * @param entity The entity type being validated
 * @throws ValidationError if validation fails
 */
export const validateOrThrow = <T>(
  data: T,
  validateFn: (data: T) => ValidationResult,
  entity: string
): T => {
  const validationResult = validateFn(data);
  
  if (!validationResult.isValid) {
    logger.logValidation(entity, 'failure', validationResult.errors);
    throw new ValidationError(
      `Validation failed for ${entity}`,
      validationResult.errors
    );
  }
  
  logger.logValidation(entity, 'success');
  return data;
};

/**
 * Wrap a database operation with standard error handling
 * 
 * @param operation The operation function to execute
 * @param entity The entity type being operated on
 * @returns A function that will handle errors appropriately
 */
export function withErrorHandling<T, Args extends any[]>(
  operation: (...args: Args) => Promise<T>,
  entity: string
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      const result = await operation(...args);
      logger.logDatabaseOperation('operation', entity, 'success');
      return result;
    } catch (error) {
      // Already an AppError - pass it through
      if (error instanceof AppError) {
        logger.error(`Error during operation on ${entity}`, error);
        throw error;
      }
      
      // Supabase PostgrestError
      if (
        error && 
        typeof error === 'object' && 
        'code' in error && 
        'message' in error &&
        'details' in error
      ) {
        const dbError = processSupabaseError(error as PostgrestError, entity);
        logger.error(`Database error during operation on ${entity}`, dbError);
        throw dbError;
      }
      
      // Generic error
      logger.error(`Unknown error during operation on ${entity}`, error);
      throw new DatabaseError(
        `An unexpected error occurred during operation on ${entity}`,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };
}

/**
 * Show a user-friendly error toast message
 * 
 * @param error The error to display
 * @returns User-friendly error message
 */
export const handleErrorDisplay = (error: unknown): string => {
  const message = getUserFriendlyErrorMessage(error);
  
  // Here you could add code to show the message in a toast
  // or other UI component
  
  return message;
};

export default {
  processSupabaseError,
  checkRecordFound,
  validateOrThrow,
  withErrorHandling,
  handleErrorDisplay
}; 