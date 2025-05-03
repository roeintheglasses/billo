/**
 * Authentication Context
 * 
 * This file provides a context for managing authentication state
 * throughout the application.
 */

import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { Session as SupabaseSession, User } from '../types/supabase';
import { 
  getSupabaseSession, 
  getCurrentUser,
  signOut as signOutUser
} from '../services/supabase';
import { secureStorage } from '../services/storage';
import { Alert } from 'react-native';
import { 
  loginWithEmail, 
  registerUser, 
  resetPassword, 
  onAuthStateChange,
  refreshSession,
  isSessionExpired 
} from '../services/auth';

// Define authentication context value type
interface AuthContextValue {
  session: SupabaseSession | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionTimeoutWarning: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  extendSession: () => Promise<boolean>;
  dismissSessionWarning: () => void;
}

// Create authentication context with default values
const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  sessionTimeoutWarning: false,
  login: async () => false,
  register: async () => false,
  signOut: async () => {},
  forgotPassword: async () => false,
  extendSession: async () => false,
  dismissSessionWarning: () => {},
});

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Session refresh timer constants (in milliseconds)
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SESSION_TIMEOUT_WARNING = 5 * 60 * 1000; // 5 minutes before expiry

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
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);
  
  // Refs for interval timers
  const tokenRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if user is authenticated
  const isAuthenticated = !!session;

  /**
   * Set up token refresh timer
   */
  const setupTokenRefresh = (currentSession: SupabaseSession | null) => {
    // Clear any existing interval
    if (tokenRefreshInterval.current) {
      clearInterval(tokenRefreshInterval.current);
      tokenRefreshInterval.current = null;
    }
    
    // If no session, don't set up refresh
    if (!currentSession) {
      return;
    }
    
    // Set up a timer to refresh the token periodically
    tokenRefreshInterval.current = setInterval(async () => {
      const expired = await isSessionExpired();
      if (expired) {
        const success = await refreshSession();
        if (success) {
          // Get the new session
          const newSession = await getSupabaseSession();
          setSession(newSession);
          
          // Set up session timeout warning for this new session
          setupSessionTimeoutWarning(newSession);
        } else {
          // If refresh fails, clear the session and show warning
          clearAllTimers();
          setSession(null);
          setUser(null);
          Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
        }
      }
    }, TOKEN_REFRESH_INTERVAL);
  };
  
  /**
   * Set up session timeout warning
   */
  const setupSessionTimeoutWarning = (currentSession: SupabaseSession | null) => {
    // Clear any existing timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    
    // If no session, don't set up warning
    if (!currentSession || !currentSession.expires_at) {
      return;
    }
    
    // Calculate time until session expires
    const expiresAtTimestamp = currentSession.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAtTimestamp - now;
    
    // Set warning to appear 5 minutes before expiry
    const timeUntilWarning = timeUntilExpiry - SESSION_TIMEOUT_WARNING;
    
    if (timeUntilWarning > 0) {
      sessionTimeoutRef.current = setTimeout(() => {
        setSessionTimeoutWarning(true);
      }, timeUntilWarning);
    }
  };
  
  /**
   * Clear all timers
   */
  const clearAllTimers = () => {
    if (tokenRefreshInterval.current) {
      clearInterval(tokenRefreshInterval.current);
      tokenRefreshInterval.current = null;
    }
    
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  };

  // Load user session on component mount
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        setIsLoading(true);
        
        // First try to get session from secure storage
        const storedSession = await secureStorage.getSession();
        
        if (storedSession) {
          // Check if the stored session is valid
          if (await isSessionExpired()) {
            // Try to refresh the session
            const refreshSuccess = await refreshSession();
            if (!refreshSuccess) {
              // If refresh fails, clear storage and return null
              await secureStorage.clearSession();
              setSession(null);
              setIsLoading(false);
              return;
            }
          }
        }
        
        // Get current session from Supabase (will be the refreshed one if refresh succeeded)
        const currentSession = await getSupabaseSession();
        setSession(currentSession);
        
        // If session exists, get user details
        if (currentSession) {
          const userData = await getCurrentUser();
          setUser(userData);
          
          // Set up token refresh and session timeout warning
          setupTokenRefresh(currentSession);
          setupSessionTimeoutWarning(currentSession);
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
    const { data } = onAuthStateChange((event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED', newSession: any) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setSession(newSession);
        
        // Set up token refresh and session timeout warning
        setupTokenRefresh(newSession);
        setupSessionTimeoutWarning(newSession);
        
        // Get user data when signed in or updated
        getCurrentUser().then(userData => {
          setUser(userData);
        });
      } else if (event === 'SIGNED_OUT') {
        // Clear timers and state on sign out
        clearAllTimers();
        setUser(null);
        setSession(null);
      }
    });
    
    // Clean up auth listener and timers on unmount
    return () => {
      data.subscription.unsubscribe();
      clearAllTimers();
    };
  }, []);
  
  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await loginWithEmail(email, password);
      
      if (success) {
        const currentSession = await getSupabaseSession();
        setSession(currentSession);
        
        if (currentSession) {
          // Get user details
          const userData = await getCurrentUser();
          setUser(userData);
          
          // Set up token refresh and session timeout warning
          setupTokenRefresh(currentSession);
          setupSessionTimeoutWarning(currentSession);
        }
      }
      
      return success;
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
      
      if (newUser) {
        const currentSession = await getSupabaseSession();
        setSession(currentSession);
        setUser(newUser);
        
        // Set up token refresh and session timeout warning
        if (currentSession) {
          setupTokenRefresh(currentSession);
          setupSessionTimeoutWarning(currentSession);
        }
      }
      
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
      
      // Clear all timers
      clearAllTimers();
      
      // Sign out from Supabase and clear storage
      await signOutUser();
      
      // Update state
      setUser(null);
      setSession(null);
      setSessionTimeoutWarning(false);
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
  
  /**
   * Extend the current session
   */
  const extendSession = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setSessionTimeoutWarning(false);
      
      const success = await refreshSession();
      
      if (success) {
        // Get the refreshed session
        const currentSession = await getSupabaseSession();
        setSession(currentSession);
        
        // Set up token refresh and session timeout warning again
        setupTokenRefresh(currentSession);
        setupSessionTimeoutWarning(currentSession);
      }
      
      return success;
    } catch (error) {
      console.error('Error extending session:', error);
      Alert.alert('Session Error', 'Failed to extend your session. Please sign in again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Dismiss session warning without refreshing
   */
  const dismissSessionWarning = (): void => {
    setSessionTimeoutWarning(false);
  };
  
  // Context value
  const contextValue: AuthContextValue = {
    session,
    user,
    isLoading,
    isAuthenticated,
    sessionTimeoutWarning,
    login,
    register,
    signOut,
    forgotPassword,
    extendSession,
    dismissSessionWarning
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