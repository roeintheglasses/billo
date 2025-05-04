/**
 * Tests for validation utilities
 */

import {
  ValidationResult,
  createValidationResult,
  addValidationError,
  combineValidationResults,
  validateRequired,
  validateNumberRange,
  validateEmail,
  validateDate,
  validateHexColor,
  validateBillingCycle,
  validateEnum,
  validateUUID,
  validateSubscription,
  validateTransaction,
  validateCategory,
} from '../validationUtils';

describe('Validation Utilities', () => {
  describe('Basic Validation Functions', () => {
    test('createValidationResult returns a valid result with empty errors', () => {
      const result = createValidationResult();
      expect(result).toEqual({ isValid: true, errors: {} });
    });

    test('addValidationError adds an error and sets isValid to false', () => {
      const result = createValidationResult();
      const withError = addValidationError(result, 'name', 'Name is required');

      expect(withError).toEqual({
        isValid: false,
        errors: { name: 'Name is required' },
      });
    });

    test('combineValidationResults combines multiple results', () => {
      const result1 = createValidationResult();
      const result2 = addValidationError(createValidationResult(), 'email', 'Invalid email');
      const result3 = addValidationError(createValidationResult(), 'password', 'Too short');

      const combined = combineValidationResults([result1, result2, result3]);

      expect(combined).toEqual({
        isValid: false,
        errors: {
          email: 'Invalid email',
          password: 'Too short',
        },
      });
    });

    test('combineValidationResults returns valid if all results are valid', () => {
      const result1 = createValidationResult();
      const result2 = createValidationResult();

      const combined = combineValidationResults([result1, result2]);

      expect(combined.isValid).toBe(true);
      expect(combined.errors).toEqual({});
    });
  });

  describe('Field Validation Functions', () => {
    describe('validateRequired', () => {
      test('returns valid for non-empty string', () => {
        const result = validateRequired('test', 'name');
        expect(result.isValid).toBe(true);
      });

      test('returns invalid for empty string', () => {
        const result = validateRequired('', 'name');
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBe('name is required');
      });

      test('returns invalid for null', () => {
        const result = validateRequired(null, 'name');
        expect(result.isValid).toBe(false);
      });

      test('returns invalid for undefined', () => {
        const result = validateRequired(undefined, 'name');
        expect(result.isValid).toBe(false);
      });
    });

    describe('validateNumberRange', () => {
      test('returns valid for number in range', () => {
        const result = validateNumberRange(5, 'amount', 0, 10);
        expect(result.isValid).toBe(true);
      });

      test('returns invalid for number below min', () => {
        const result = validateNumberRange(-1, 'amount', 0);
        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBe('amount must be at least 0');
      });

      test('returns invalid for number above max', () => {
        const result = validateNumberRange(11, 'amount', 0, 10);
        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBe('amount must not exceed 10');
      });

      test('returns invalid for non-number', () => {
        const result = validateNumberRange(NaN, 'amount');
        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBe('amount must be a valid number');
      });
    });

    describe('validateEmail', () => {
      test('returns valid for valid email', () => {
        const result = validateEmail('test@example.com');
        expect(result.isValid).toBe(true);
      });

      test('returns invalid for malformed email', () => {
        const result = validateEmail('test@example');
        expect(result.isValid).toBe(false);
        expect(result.errors.email).toBe('Invalid email format');
      });

      test('returns invalid for empty email', () => {
        const result = validateEmail('');
        expect(result.isValid).toBe(false);
        expect(result.errors.email).toBe('Email is required');
      });
    });

    describe('validateDate', () => {
      test('returns valid for valid date', () => {
        const result = validateDate('2023-05-15', 'date');
        expect(result.isValid).toBe(true);
      });

      test('returns invalid for malformed date', () => {
        const result = validateDate('15/05/2023', 'date');
        expect(result.isValid).toBe(false);
        expect(result.errors.date).toBe('date must be in the format YYYY-MM-DD');
      });

      test('returns invalid for invalid date', () => {
        const result = validateDate('2023-13-45', 'date');
        expect(result.isValid).toBe(false);
        expect(result.errors.date).toBe('date is not a valid date');
      });
    });

    describe('validateHexColor', () => {
      test('returns valid for valid hex color', () => {
        const result = validateHexColor('#FF5500', 'color');
        expect(result.isValid).toBe(true);
      });

      test('returns valid for short hex color', () => {
        const result = validateHexColor('#F50', 'color');
        expect(result.isValid).toBe(true);
      });

      test('returns invalid for malformed hex color', () => {
        const result = validateHexColor('FF5500', 'color');
        expect(result.isValid).toBe(false);
        expect(result.errors.color).toBe('color must be a valid hex color (e.g., #FF0000)');
      });

      test('returns valid for null (optional)', () => {
        const result = validateHexColor(null, 'color');
        expect(result.isValid).toBe(true);
      });
    });

    describe('validateBillingCycle', () => {
      test('returns valid for valid billing cycle', () => {
        const result = validateBillingCycle('monthly');
        expect(result.isValid).toBe(true);
      });

      test('returns invalid for invalid billing cycle', () => {
        const result = validateBillingCycle('invalid');
        expect(result.isValid).toBe(false);
        expect(result.errors.billing_cycle).toContain('Billing cycle must be one of:');
      });
    });

    describe('validateEnum', () => {
      test('returns valid for value in allowed set', () => {
        const result = validateEnum('admin', ['user', 'admin', 'moderator'], 'role');
        expect(result.isValid).toBe(true);
      });

      test('returns invalid for value not in allowed set', () => {
        const result = validateEnum('superuser', ['user', 'admin', 'moderator'], 'role');
        expect(result.isValid).toBe(false);
        expect(result.errors.role).toContain('role must be one of:');
      });
    });

    describe('validateUUID', () => {
      test('returns valid for valid UUID', () => {
        const result = validateUUID('123e4567-e89b-12d3-a456-426614174000', 'id');
        expect(result.isValid).toBe(true);
      });

      test('returns invalid for malformed UUID', () => {
        const result = validateUUID('not-a-uuid', 'id');
        expect(result.isValid).toBe(false);
        expect(result.errors.id).toBe('id must be a valid UUID');
      });
    });
  });

  describe('Model Validation Functions', () => {
    describe('validateSubscription', () => {
      test('validates a valid subscription', () => {
        const subscription = {
          name: 'Netflix',
          amount: 14.99,
          billing_cycle: 'monthly',
          start_date: '2023-01-01',
        };

        const result = validateSubscription(subscription);
        expect(result.isValid).toBe(true);
      });

      test('invalidates a subscription with missing name', () => {
        const subscription = {
          name: '',
          amount: 14.99,
          billing_cycle: 'monthly',
          start_date: '2023-01-01',
        };

        const result = validateSubscription(subscription);
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBeTruthy();
      });

      test('invalidates a subscription with negative amount', () => {
        const subscription = {
          name: 'Netflix',
          amount: -14.99,
          billing_cycle: 'monthly',
          start_date: '2023-01-01',
        };

        const result = validateSubscription(subscription);
        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBeTruthy();
      });
    });

    describe('validateTransaction', () => {
      test('validates a valid transaction', () => {
        const transaction = {
          amount: 14.99,
          date: '2023-05-15',
        };

        const result = validateTransaction(transaction);
        expect(result.isValid).toBe(true);
      });

      test('invalidates a transaction with negative amount', () => {
        const transaction = {
          amount: -14.99,
          date: '2023-05-15',
        };

        const result = validateTransaction(transaction);
        expect(result.isValid).toBe(false);
        expect(result.errors.amount).toBeTruthy();
      });
    });

    describe('validateCategory', () => {
      test('validates a valid category', () => {
        const category = {
          name: 'Entertainment',
          color: '#FF5500',
        };

        const result = validateCategory(category);
        expect(result.isValid).toBe(true);
      });

      test('invalidates a category with missing name', () => {
        const category = {
          name: '',
          color: '#FF5500',
        };

        const result = validateCategory(category);
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBeTruthy();
      });

      test('invalidates a category with invalid color', () => {
        const category = {
          name: 'Entertainment',
          color: 'red',
        };

        const result = validateCategory(category);
        expect(result.isValid).toBe(false);
        expect(result.errors.color).toBeTruthy();
      });
    });
  });
});
