/**
 * Authentication Service
 * 
 * This file provides functions for managing user authentication with Supabase,
 * including registration, login, password management, and profile updates.
 */

import { supabase } from './supabase';
import { User, UserInsert, ProfileInsert } from '../types/supabase';

/**
 * Register a new user with email and password
 * 
 * @param email User email
 * @param password User password
 * @param userData Additional user data to save in the users table
 * @returns The new user data or null if registration failed
 */
export const registerUser = async (
  email: string,
  password: string,
  userData?: Partial<UserInsert>
): Promise<User | null> => {
  try {
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Error during registration:', authError.message);
      return null;
    }

    if (!authData.user) {
      console.error('No user returned from registration');
      return null;
    }

    // Create user record in the users table
    const newUser: UserInsert = {
      id: authData.user.id,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...userData,
    };

    const { data: userData2, error: userError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (userError) {
      console.error('Error creating user record:', userError.message);
      return null;
    }

    // Create default profile for the user
    const newProfile: ProfileInsert = {
      user_id: authData.user.id,
      theme_preference: 'light',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(newProfile);

    if (profileError) {
      console.error('Error creating profile record:', profileError.message);
      // Continue even if profile creation fails, as user is already created
    }

    return userData2;
  } catch (error) {
    console.error('Unexpected error during registration:', error);
    return null;
  }
};

/**
 * Login with email and password
 * 
 * @param email User email
 * @param password User password
 * @returns True if login successful, false otherwise
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error during login:', error.message);
      return false;
    }

    return !!data.session;
  } catch (error) {
    console.error('Unexpected error during login:', error);
    return false;
  }
};

/**
 * Send password reset email
 * 
 * @param email User email
 * @returns True if email sent successfully, false otherwise
 */
export const resetPassword = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'billo://reset-password',
    });

    if (error) {
      console.error('Error sending password reset email:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error during password reset:', error);
    return false;
  }
};

/**
 * Update user's password
 * 
 * @param newPassword New password
 * @returns True if password updated successfully, false otherwise
 */
export const updatePassword = async (newPassword: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Error updating password:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating password:', error);
    return false;
  }
};

/**
 * Update user profile data
 * 
 * @param userData User data to update
 * @returns Updated user data or null if update failed
 */
export const updateUserProfile = async (
  userData: Partial<User>
): Promise<User | null> => {
  try {
    // Get current user
    const { data: userData1 } = await supabase.auth.getUser();
    
    if (!userData1.user) {
      console.error('No authenticated user found');
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData1.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return null;
  }
};

/**
 * Set up auth state change listener
 * 
 * @param callback Function to call when auth state changes
 * @returns Subscription object to manage the listener
 */
export const onAuthStateChange = (
  callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED', session: any) => void
) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event as any, session);
  });
}; 