/**
 * Supabase Client Service
 * 
 * This file sets up the Supabase client with the appropriate configuration
 * and exports it for use throughout the application.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Database, User, UserProfile, AuthUser, Session as SupabaseSession } from '../types/supabase';

// Get Supabase URL and anon key from environment variables or Constants
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '';

// Validate that Supabase credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase credentials missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment or app.config.js'
  );
}

/**
 * Initialize Supabase client with AsyncStorage for session persistence
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Get the current Supabase session
 * 
 * @returns {Promise<SupabaseSession|null>} The current session or null if not authenticated
 */
export const getSupabaseSession = async (): Promise<SupabaseSession | null> => {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  
  if (!data.session) {
    return null;
  }

  return {
    user: {
      id: data.session.user.id,
      email: data.session.user.email || '',
    },
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at || Math.floor(Date.now() / 1000) + 3600, // Default to 1 hour from now if missing
  };
};

/**
 * Check if the user is authenticated
 * 
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSupabaseSession();
  return session !== null;
};

/**
 * Get the current user
 * 
 * @returns {Promise<User|null>} The current user or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const session = await getSupabaseSession();
  
  if (!session) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }
  
  return data;
};

/**
 * Get the current user with profile
 * 
 * @returns {Promise<User & { profile: UserProfile }|null>} The current user with profile
 */
export const getCurrentUserWithProfile = async (): Promise<(User & { profile: UserProfile }) | null> => {
  const session = await getSupabaseSession();
  
  if (!session) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error fetching user with profile:', error.message);
    return null;
  }
  
  return data as (User & { profile: UserProfile });
};

/**
 * Sign out the current user
 * 
 * @returns {Promise<void>}
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
};

export default supabase; 