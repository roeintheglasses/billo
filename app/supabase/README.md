# Supabase Configuration for Billo

This directory contains the Supabase configuration for the Billo application, focusing primarily on authentication and user management.

## Database Schema

The database schema for authentication includes:

### Tables

1. **users** - Stores user information linked to Supabase Auth
   - `id`: UUID (Primary Key, references auth.users)
   - `email`: Text (Not Null, Unique)
   - `full_name`: Text
   - `avatar_url`: Text
   - `created_at`: Timestamp with time zone
   - `updated_at`: Timestamp with time zone
   - `phone`: Text
   - `preferences`: JSONB

2. **profiles** - Stores additional user profile information
   - `id`: UUID (Primary Key, generated)
   - `user_id`: UUID (Foreign Key to users.id)
   - `theme_preference`: Text (Default: 'light')
   - `notification_settings`: JSONB
   - `created_at`: Timestamp with time zone
   - `updated_at`: Timestamp with time zone

### Row Level Security (RLS) Policies

The following RLS policies are implemented for data security:

- Users can view and update only their own user data
- Users can view and update only their own profile data
- Public insertion is allowed for the users table (for registration)
- Authenticated users can create their own profiles

### Triggers

A trigger is set up to automatically create a user record in the `public.users` table when a new user signs up through Supabase Auth.

## Setting Up Supabase

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. Run the migration script in `migrations/00001_create_auth_tables.sql` in the Supabase SQL editor
3. Configure authentication settings in the Supabase dashboard:
   - Enable email/password sign-in
   - Configure email templates if needed
   - Set up redirect URLs for password recovery
4. Copy your Supabase URL and anon key to your environment variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Local Development

For local development, create a `.env` file in the `app` directory with your Supabase credentials. You can copy `env.example` as a template.

## Authentication Flow

The authentication flow in the application includes:

1. **Registration**: Users can sign up with email and password
2. **Login**: Users can sign in with email and password
3. **Password Reset**: Users can request a password reset link
4. **Profile Management**: Users can update their profile information

These features are implemented in the `src/services/auth.ts` and `src/contexts/AuthContext.tsx` files. 