# Services Documentation

This directory contains service modules that handle data fetching, API calls, and business logic.

## Available Services

- **authService**: Authentication-related operations
- **categoryService**: Category management
- **notificationService**: User notifications
- **relationshipService**: Cross-model queries and data relationships
- **storageService**: File storage operations
- **subscriptionService**: Subscription management
- **supabaseService**: Supabase client and utility functions
- **transactionService**: Transaction management

## Relationship Service

The `relationshipService` provides functions for working with relationships between different data models.

### Key Functions:

#### `getSubscriptionWithDetails(subscriptionId: string)`
Retrieves a subscription with its associated category and transaction data.

```typescript
// Example usage
import { relationshipService } from '../services';

const subscriptionDetails = await relationshipService.getSubscriptionWithDetails('sub-123');
// Access category data
console.log(subscriptionDetails?.category?.name);
// Access transactions
console.log(subscriptionDetails?.transactions?.length);
```

#### `getAllSubscriptionsWithDetails()`
Retrieves all subscriptions with their categories and transactions.

#### `getCategoriesWithSubscriptions()`
Retrieves all categories with their associated subscriptions.

#### `getSpendingAnalyticsByCategory(startDate: string, endDate: string)`
Generates spending analytics grouped by category for a specific time period.

```typescript
// Example usage
import { relationshipService } from '../services';

const analytics = await relationshipService.getSpendingAnalyticsByCategory(
  '2023-01-01',  // Start date (YYYY-MM-DD)
  '2023-01-31'   // End date (YYYY-MM-DD)
);

console.log(`Total spending: $${analytics.totalAmount}`);
console.log(`Top category: ${analytics.categoryBreakdown[0]?.categoryName}`);
```

#### `getSpendingTimeSeries(months: number = 12)`
Retrieves time series data showing spending trends over time.

#### `getUserSubscriptionProfile(userId: string)`
Retrieves a user with all their subscriptions and transaction data.

## Database Indexing

To optimize the performance of relationship queries, the following database indexes are used:

- `idx_transactions_subscription_id`: Speeds up queries that join transactions with subscriptions
- `idx_subscriptions_category_id`: Speeds up queries that join subscriptions with categories
- `idx_subscriptions_user_id`: Speeds up queries filtering subscriptions by user
- `idx_transactions_date`: Optimizes date-based transaction queries
- `idx_transactions_user_date`: Composite index for finding user transactions by date

These indexes are defined in the `00004_add_relationship_indexes.sql` migration file. 