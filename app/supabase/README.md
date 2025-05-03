# Supabase Database Configuration

This directory contains the Supabase database configuration and migrations for the Billo application.

## Data Models

The application uses the following data models:

### Users and Profiles
- `users`: Core user data with authentication information
- `profiles`: Extended user profile information

### Subscription Management
- `categories`: Subscription categories with customizable colors and icons
- `subscriptions`: User subscriptions with billing information
- `transactions`: Payment transactions related to subscriptions

### User Experience
- `notifications`: System notifications for users
- `dark_patterns`: Database of known dark patterns in subscription services

## Database Structure

### Users
- Primary user table linked to Supabase Auth
- Contains basic user information like email, name, and avatar
- Each user has an associated profile

### Categories
- Subscription categories can be default (system-provided) or user-created
- Default categories are created automatically for new users
- Fields include name, icon, color, and user_id

### Subscriptions
- Core subscription data including name, amount, billing cycle
- Linked to a user and optionally to a category
- Contains start date and optional notes

### Transactions
- Records of payments for subscriptions
- Linked to both user and subscription
- Contains amount, date, and optional notes

### Notifications
- System-generated notifications for users
- Includes title, message, type, and read status
- Used for payment reminders and subscription alerts

### Dark Patterns
- Database of known dark patterns in subscription services
- Used for education and detection features
- Read-only data accessible to all users

## Migrations

The `migrations` directory contains SQL files that define the database schema:

- `00001_create_auth_tables.sql`: Sets up initial users and profiles tables
- `00002_create_core_data_models.sql`: Adds subscription management tables

## Security Policies

All tables have Row Level Security (RLS) policies configured:

- Users can only access their own data
- Default categories are visible to all users
- Dark patterns are read-only and accessible to all users

## Environment Setup

To connect to Supabase, the following environment variables must be configured:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These can be set in a `.env` file in the app directory.

## Accessing Supabase in the Application

The Supabase client is initialized in `src/services/supabase.ts` and provides the following functionality:

- Automatic session management
- Type-safe database queries using TypeScript types
- Helper functions for common operations

## Running Migrations

Migrations should be run against your Supabase instance using the Supabase CLI. Ensure you have the CLI installed and configured before running migrations.

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Testing Connection

You can test your connection to Supabase using the `testConnection` function in `src/services/supabase.ts`:

```typescript
import { testConnection } from '../services/supabase';

async function checkConnection() {
  const result = await testConnection();
  console.log(result);
}
``` 