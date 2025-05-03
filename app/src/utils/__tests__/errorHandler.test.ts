/**
 * Tests for error handler utilities
 */

import errorHandler from '../errorHandler';
import { PostgrestError } from '@supabase/supabase-js';
import {
  AppError,
  ValidationError,
  DatabaseError,
  NotFoundError
} from '../errors';
import logger from '../logger';
import { ValidationResult } from '../validationUtils';

// Mock the logger to avoid actual logging in tests
jest.mock('../logger', () => ({
  logDatabaseOperation: jest.fn(),
  logValidation: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processSupabaseError', () => {
    test('processes a PostgrestError correctly', () => {
      const pgError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
        details: 'Details about the error'
      } as PostgrestError;
      
      const result = errorHandler.processSupabaseError(pgError, 'Subscription');
      
      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.code).toBe('23505');
      expect(result.message).toBe('duplicate key value violates unique constraint');
    });
    
    test('handles null error with generic message', () => {
      const result = errorHandler.processSupabaseError(null, 'Subscription');
      
      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toContain('unknown database error');
    });
  });
  
  describe('checkRecordFound', () => {
    test('returns the record if it exists', () => {
      const record = { id: '123', name: 'Test Record' };
      
      const result = errorHandler.checkRecordFound(record, 'Subscription');
      
      expect(result).toBe(record);
    });
    
    test('throws NotFoundError if record is null', () => {
      expect(() => {
        errorHandler.checkRecordFound(null, 'Subscription', '123');
      }).toThrow(NotFoundError);
    });
    
    test('includes ID in error message if provided', () => {
      try {
        errorHandler.checkRecordFound(null, 'Subscription', '123');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).message).toContain('123');
      }
    });
  });
  
  describe('validateOrThrow', () => {
    test('returns data if validation passes', () => {
      const data = { name: 'Test' };
      const validateFn = jest.fn(() => ({ isValid: true, errors: {} }));
      
      const result = errorHandler.validateOrThrow(data, validateFn, 'TestEntity');
      
      expect(result).toBe(data);
      expect(validateFn).toHaveBeenCalledWith(data);
      expect(logger.logValidation).toHaveBeenCalledWith('TestEntity', 'success');
    });
    
    test('throws ValidationError if validation fails', () => {
      const data = { name: '' };
      const errors = { name: 'Name is required' };
      const validateFn = jest.fn(() => ({ isValid: false, errors }));
      
      expect(() => {
        errorHandler.validateOrThrow(data, validateFn, 'TestEntity');
      }).toThrow(ValidationError);
      
      expect(validateFn).toHaveBeenCalledWith(data);
      expect(logger.logValidation).toHaveBeenCalledWith('TestEntity', 'failure', errors);
    });
  });
  
  describe('withErrorHandling', () => {
    test('returns result of operation if successful', async () => {
      const operation = jest.fn().mockResolvedValue({ success: true });
      const wrappedOperation = errorHandler.withErrorHandling(operation, 'TestEntity');
      
      const result = await wrappedOperation('arg1', 'arg2');
      
      expect(result).toEqual({ success: true });
      expect(operation).toHaveBeenCalledWith('arg1', 'arg2');
      expect(logger.logDatabaseOperation).toHaveBeenCalled();
    });
    
    test('passes through AppError without wrapping', async () => {
      const appError = new AppError('Test error');
      const operation = jest.fn().mockRejectedValue(appError);
      const wrappedOperation = errorHandler.withErrorHandling(operation, 'TestEntity');
      
      await expect(wrappedOperation()).rejects.toBe(appError);
      expect(logger.error).toHaveBeenCalled();
    });
    
    test('processes PostgrestError into DatabaseError', async () => {
      const pgError = {
        code: '23505',
        message: 'duplicate key value',
        details: 'Details'
      };
      const operation = jest.fn().mockRejectedValue(pgError);
      const wrappedOperation = errorHandler.withErrorHandling(operation, 'TestEntity');
      
      try {
        await wrappedOperation();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).code).toBe('23505');
      }
      
      expect(logger.error).toHaveBeenCalled();
    });
    
    test('wraps generic errors in DatabaseError', async () => {
      const genericError = new Error('Something went wrong');
      const operation = jest.fn().mockRejectedValue(genericError);
      const wrappedOperation = errorHandler.withErrorHandling(operation, 'TestEntity');
      
      try {
        await wrappedOperation();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).originalError).toBe(genericError);
      }
      
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('handleErrorDisplay', () => {
    test('returns user-friendly message for ValidationError', () => {
      const error = new ValidationError('Multiple errors', { field: 'Field error' });
      const message = errorHandler.handleErrorDisplay(error);
      
      expect(message).toBe('Field error');
    });
    
    test('returns custom message for NotFoundError', () => {
      const error = new NotFoundError('Subscription', '123');
      const message = errorHandler.handleErrorDisplay(error);
      
      expect(message).toContain('Subscription');
      expect(message).toContain('123');
    });
    
    test('returns user-friendly message for generic Error', () => {
      const error = new Error('Something went wrong');
      const message = errorHandler.handleErrorDisplay(error);
      
      expect(message).toBe('Something went wrong');
    });
  });
}); 