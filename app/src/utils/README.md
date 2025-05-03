# Validation and Error Handling

This directory contains utilities for data validation and error handling across the application.

## Validation

The `validationUtils.ts` file provides a flexible and extensible system for validating user input and data models.

### Key Features

- Type-safe validation results with detailed error messages
- Composable validation functions that can be combined
- Model-specific validation for each data type
- Reusable field validators for common patterns

### Usage Example

```typescript
import { validateSubscription } from '../utils/validationUtils';
import errorHandler from '../utils/errorHandler';

// In a service function
const createSubscription = async (subscription) => {
  // Validate data and throw if invalid
  errorHandler.validateOrThrow(
    subscription,
    validateSubscription,
    'Subscription'
  );
  
  // Continue with database operation...
};
```

## Error Handling

The error handling utilities in `errors.ts` and `errorHandler.ts` provide a structured approach to handling, logging, and displaying errors.

### Key Components

#### Custom Error Classes (`errors.ts`)

- `AppError`: Base class for all application errors
- `ValidationError`: For data validation failures
- `DatabaseError`: For database operation issues
- `NotFoundError`: For missing resources
- `AuthError`: For authentication failures
- `NetworkError`: For network-related issues

#### Error Handler Functions (`errorHandler.ts`)

- `processSupabaseError`: Converts Supabase errors to application errors
- `checkRecordFound`: Ensures a record exists or throws NotFoundError
- `validateOrThrow`: Validates data or throws ValidationError
- `withErrorHandling`: Wraps service functions with standardized error handling
- `handleErrorDisplay`: Generates user-friendly error messages

### Usage Example

```typescript
import errorHandler from '../utils/errorHandler';

// Wrap a service function with error handling
export const getSubscriptionById = errorHandler.withErrorHandling(
  async (id: string): Promise<Subscription> => {
    // Database operation here...
    const { data, error } = await supabase.from('subscriptions').select('*').eq('id', id).single();
    
    if (error) throw error;
    
    // Ensure record exists
    return errorHandler.checkRecordFound(data, 'Subscription', id);
  },
  'Subscription'
);
```

## Logging

The `logger.ts` utility provides consistent logging across the application with support for different log levels.

### Key Features

- Log level management (DEBUG, INFO, WARN, ERROR)
- Specialized logging for database operations
- Specialized logging for validation results
- Detailed error logging with context

### Usage Example

```typescript
import logger from '../utils/logger';

// Log an informational message
logger.info('User logged in', { userId: '123' });

// Log database operation
logger.logDatabaseOperation('update', 'Subscription', 'success', { id: '456' });

// Log validation
logger.logValidation('Subscription', 'failure', { name: 'Name is required' });
```

## Integration

The validation and error handling systems are designed to work together:

1. **Input Validation**: User input is validated using functions from `validationUtils.ts`
2. **Error Generation**: If validation fails, a `ValidationError` is thrown
3. **Error Handling**: Service functions wrapped with `withErrorHandling` catch and process errors
4. **Logging**: All operations and errors are logged with appropriate context
5. **User Feedback**: Error messages are transformed to user-friendly format with `handleErrorDisplay`

## Testing

All utilities are fully tested with unit tests in the `__tests__` directory:

- `validationUtils.test.ts`: Tests for validation functions
- `errorHandler.test.ts`: Tests for error handling functionality
- `errors.test.ts`: Tests for custom error classes 