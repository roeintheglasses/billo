/**
 * Logger Utility
 * 
 * This file provides logging functionality for the application.
 * It wraps console methods but can be extended to use external logging services.
 */

import { AppError, ValidationError, DatabaseError } from './errors';

/**
 * Log levels for the application
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Current log level for the application
 * Override with environment variables
 */
const currentLogLevel = 
  (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;

/**
 * Determine if a given log level should be logged based on current config
 * 
 * @param level The log level to check
 * @returns Whether this level should be logged
 */
const shouldLog = (level: LogLevel): boolean => {
  const levels = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3
  };

  return levels[level] >= levels[currentLogLevel];
};

/**
 * Format log messages for consistency
 * 
 * @param message The message to format
 * @param level The log level
 * @returns Formatted message string
 */
const formatMessage = (message: string, level: LogLevel): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

/**
 * Log a debug message
 * 
 * @param message Message to log
 * @param data Optional data to include
 */
export const debug = (message: string, data?: any): void => {
  if (!shouldLog(LogLevel.DEBUG)) return;
  
  const formattedMessage = formatMessage(message, LogLevel.DEBUG);
  if (data) {
    console.debug(formattedMessage, data);
  } else {
    console.debug(formattedMessage);
  }
};

/**
 * Log an info message
 * 
 * @param message Message to log
 * @param data Optional data to include
 */
export const info = (message: string, data?: any): void => {
  if (!shouldLog(LogLevel.INFO)) return;
  
  const formattedMessage = formatMessage(message, LogLevel.INFO);
  if (data) {
    console.info(formattedMessage, data);
  } else {
    console.info(formattedMessage);
  }
};

/**
 * Log a warning message
 * 
 * @param message Message to log
 * @param data Optional data to include
 */
export const warn = (message: string, data?: any): void => {
  if (!shouldLog(LogLevel.WARN)) return;
  
  const formattedMessage = formatMessage(message, LogLevel.WARN);
  if (data) {
    console.warn(formattedMessage, data);
  } else {
    console.warn(formattedMessage);
  }
};

/**
 * Log an error message
 * 
 * @param message Message to log
 * @param error Optional error to include
 */
export const error = (message: string, error?: unknown): void => {
  if (!shouldLog(LogLevel.ERROR)) return;
  
  const formattedMessage = formatMessage(message, LogLevel.ERROR);
  
  if (error) {
    if (error instanceof ValidationError) {
      console.error(formattedMessage, {
        name: error.name,
        message: error.message,
        errors: error.errors
      });
    } else if (error instanceof DatabaseError) {
      console.error(formattedMessage, {
        name: error.name,
        message: error.message,
        code: error.code,
        originalError: error.originalError
      });
    } else if (error instanceof AppError) {
      console.error(formattedMessage, {
        name: error.name,
        message: error.message
      });
    } else if (error instanceof Error) {
      console.error(formattedMessage, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error(formattedMessage, error);
    }
  } else {
    console.error(formattedMessage);
  }
};

/**
 * Log a database operation
 * 
 * @param operation The database operation being performed
 * @param entity The entity being operated on
 * @param result The result of the operation
 */
export const logDatabaseOperation = (
  operation: string,
  entity: string,
  result: 'success' | 'failure',
  data?: any
): void => {
  const level = result === 'success' ? LogLevel.DEBUG : LogLevel.ERROR;
  const message = `Database ${operation} on ${entity}: ${result}`;
  
  if (level === LogLevel.DEBUG) {
    debug(message, data);
  } else {
    error(message, data);
  }
};

/**
 * Log a validation operation
 * 
 * @param entity The entity being validated
 * @param result The validation result
 * @param validationErrors Any validation errors
 */
export const logValidation = (
  entity: string,
  result: 'success' | 'failure',
  validationErrors?: Record<string, string>
): void => {
  const level = result === 'success' ? LogLevel.DEBUG : LogLevel.WARN;
  const message = `Validation for ${entity}: ${result}`;
  
  if (level === LogLevel.DEBUG) {
    debug(message);
  } else {
    warn(message, { validationErrors });
  }
};

// Default export
export default {
  debug,
  info,
  warn,
  error,
  logDatabaseOperation,
  logValidation
}; 