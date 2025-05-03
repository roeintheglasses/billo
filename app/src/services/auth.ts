/**
 * Authentication Service
 * 
 * This file provides functions for managing user authentication with Supabase,
 * including registration, login, password management, and profile updates.
 */

import { supabase } from './supabase';
import { secureStorage, STORAGE_KEYS } from './storage';
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

    // Store session data in secure storage
    if (authData.session) {
      await secureStorage.storeSession(authData.session);
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

    // Store session in secure storage
    if (data.session) {
      await secureStorage.storeSession(data.session);
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
 * Refresh the authentication session
 * 
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const refreshSession = async (): Promise<boolean> => {
  try {
    // Use the stored refresh token
    const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      console.error('No refresh token available');
      return false;
    }
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    
    if (error) {
      console.error('Error refreshing session:', error.message);
      return false;
    }
    
    if (data.session) {
      // Store the new session data
      await secureStorage.storeSession(data.session);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Unexpected error refreshing session:', error);
    return false;
  }
};

/**
 * Check if the session is expired or about to expire
 * 
 * @param {number} bufferSeconds Number of seconds before actual expiry to consider as "expired"
 * @returns {Promise<boolean>} True if session is expired or about to expire
 */
export const isSessionExpired = async (bufferSeconds = 300): Promise<boolean> => {
  const session = await secureStorage.getSession();
  
  if (!session || !session.expires_at) {
    return true;
  }
  
  // Check if token is expired or about to expire (within buffer time)
  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  
  return now + bufferSeconds >= expiresAt;
};

/**
 * Sign out the current user and clear storage
 * 
 * @returns {Promise<boolean>} True if signed out successfully
 */
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    // Always clear local storage regardless of whether the API call succeeded
    await secureStorage.clearSession();
    
    if (error) {
      console.error('Error signing out from Supabase:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    // Still clear local storage
    await secureStorage.clearSession();
    return false;
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
    // When user signs in or session is updated, store the session data
    if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
      secureStorage.storeSession(session).catch(error => {
        console.error('Error storing session during auth state change:', error);
      });
    }
    
    // When user signs out, clear the session data
    if (event === 'SIGNED_OUT') {
      secureStorage.clearSession().catch(error => {
        console.error('Error clearing session during auth state change:', error);
      });
    }
    
    callback(event as any, session);
  });
}; 