/**
 * Authentication Context
 * 
 * This file provides a context for managing authentication state
 * throughout the application.
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Session as SupabaseSession, User } from '../types/supabase';
import { 
  getSupabaseSession, 
  getCurrentUser,
  signOut as signOutUser
} from '../services/supabase';
import { Alert } from 'react-native';
import { loginWithEmail, registerUser, resetPassword, onAuthStateChange } from '../services/auth';

// Define authentication context value type
interface AuthContextValue {
  session: SupabaseSession | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
}

// Create authentication context with default values
const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  signOut: async () => {},
  forgotPassword: async () => false,
});

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Manages authentication state and provides auth functions
 * to the application.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is authenticated
  const isAuthenticated = !!session;

  // Load user session on component mount
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const currentSession = await getSupabaseSession();
        setSession(currentSession);
        
        // If session exists, get user details
        if (currentSession) {
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        Alert.alert('Error', 'Failed to load user session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserSession();
    
    // Listen for auth state changes
    const { data } = onAuthStateChange((event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED', session: any) => {
      console.log('Auth state changed:', event);
      setSession(session);
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        getCurrentUser().then(userData => {
          setUser(userData);
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    
    // Clean up auth listener on unmount
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);
  
  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      return await loginWithEmail(email, password);
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Login Error', 'Failed to login. Please check your credentials and try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Register new user
   */
  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const newUser = await registerUser(email, password, { full_name: fullName });
      return !!newUser;
    } catch (error) {
      console.error('Error during registration:', error);
      Alert.alert('Registration Error', 'Failed to register. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Sign out user
   */
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signOutUser();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Sign Out Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Send password reset email
   */
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      return await resetPassword(email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      Alert.alert('Reset Password Error', 'Failed to send password reset email. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Context value
  const contextValue: AuthContextValue = {
    session,
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    signOut,
    forgotPassword,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for accessing auth context
 * 
 * @returns {AuthContextValue} Auth context with current auth state and related functions
 */
export const useAuth = (): AuthContextValue => useContext(AuthContext);

export default AuthContext; 