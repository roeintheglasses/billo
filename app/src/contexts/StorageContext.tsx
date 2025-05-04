import React, { createContext, useContext, useEffect, useState } from 'react';
import { Subscription, Category, SubscriptionInsert, SubscriptionUpdate } from '../types/supabase';
import * as subscriptionService from '../services/subscriptionService';
import * as categoryService from '../services/categoryService';
import * as localSubscriptionService from '../services/localSubscriptionService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Storage method types
export type StorageMethod = 'remote' | 'local';

// Context interface
interface StorageContextType {
  // Storage method state
  storageMethod: StorageMethod;
  setStorageMethod: (method: StorageMethod) => Promise<void>;
  isOnline: boolean;

  // Subscription operations
  subscriptions: Subscription[];
  fetchSubscriptions: () => Promise<void>;
  getSubscriptionById: (id: string) => Promise<Subscription | null>;
  createSubscription: (subscription: Omit<SubscriptionInsert, 'id'>) => Promise<Subscription>;
  updateSubscription: (id: string, updates: SubscriptionUpdate) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<boolean>;

  // Category operations
  categories: Category[];
  fetchCategories: () => Promise<void>;
  createCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => Promise<Category>;
  
  // Status
  isLoading: boolean;
  error: string | null;
}

// Storage method preference key
const STORAGE_METHOD_KEY = 'billo_storage_method';

// Create context with default values
const StorageContext = createContext<StorageContextType>({
  storageMethod: 'remote',
  setStorageMethod: async () => {},
  isOnline: true,
  
  subscriptions: [],
  fetchSubscriptions: async () => {},
  getSubscriptionById: async () => null,
  createSubscription: async () => ({} as Subscription),
  updateSubscription: async () => ({} as Subscription),
  deleteSubscription: async () => false,
  
  categories: [],
  fetchCategories: async () => {},
  createCategory: async () => ({} as Category),
  
  isLoading: false,
  error: null
});

export const useStorage = () => useContext(StorageContext);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [storageMethod, setStorageMethodState] = useState<StorageMethod>('remote');
  const [isOnline, setIsOnline] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize storage method from preferences
  useEffect(() => {
    const initStorageMethod = async () => {
      try {
        const storedMethod = await AsyncStorage.getItem(STORAGE_METHOD_KEY);
        if (storedMethod === 'local' || storedMethod === 'remote') {
          setStorageMethodState(storedMethod);
        }
      } catch (error) {
        console.error('Error loading storage method preference:', error);
      }
    };

    initStorageMethod();
  }, []);

  // Set up network connectivity monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected !== null ? state.isConnected : true);
      
      // Automatically switch to local storage when offline
      if (state.isConnected === false && storageMethod === 'remote') {
        console.log('Network is offline. Automatically switching to local storage.');
        setStorageMethodState('local');
      }
    });

    return () => unsubscribe();
  }, [storageMethod]);

  // Function to change storage method
  const setStorageMethod = async (method: StorageMethod) => {
    try {
      setStorageMethodState(method);
      await AsyncStorage.setItem(STORAGE_METHOD_KEY, method);
      
      // Refresh data after changing storage method
      await fetchSubscriptions();
      await fetchCategories();
    } catch (error) {
      console.error('Error saving storage method preference:', error);
      setError('Failed to change storage method.');
    }
  };

  // Fetch subscriptions based on current storage method
  const fetchSubscriptions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result: Subscription[] = [];
      
      if (storageMethod === 'remote' && isOnline) {
        result = await subscriptionService.getSubscriptions();
      } else {
        result = await localSubscriptionService.getLocalSubscriptions();
      }
      
      setSubscriptions(result);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Failed to fetch subscriptions.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single subscription by ID
  const getSubscriptionById = async (id: string): Promise<Subscription | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (storageMethod === 'remote' && isOnline) {
        return await subscriptionService.getSubscriptionById(id);
      } else {
        return await localSubscriptionService.getLocalSubscriptionById(id);
      }
    } catch (error) {
      console.error(`Error fetching subscription with id ${id}:`, error);
      setError(`Failed to fetch subscription: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new subscription
  const createSubscription = async (subscription: Omit<SubscriptionInsert, 'id'>): Promise<Subscription> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let newSubscription: Subscription;
      
      if (storageMethod === 'remote' && isOnline) {
        newSubscription = await subscriptionService.createSubscription(subscription);
        
        // Also save to local storage as backup
        try {
          await localSubscriptionService.createLocalSubscription(subscription);
        } catch (localError) {
          console.warn('Error saving subscription to local backup:', localError);
        }
      } else {
        newSubscription = await localSubscriptionService.createLocalSubscription(subscription);
      }
      
      // Update local state
      setSubscriptions(prev => [...prev, newSubscription]);
      
      return newSubscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError(`Failed to create subscription: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing subscription
  const updateSubscription = async (id: string, updates: SubscriptionUpdate): Promise<Subscription> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let updatedSubscription: Subscription;
      
      if (storageMethod === 'remote' && isOnline) {
        updatedSubscription = await subscriptionService.updateSubscription(id, updates);
        
        // Also update in local storage as backup
        try {
          await localSubscriptionService.updateLocalSubscription(id, updates);
        } catch (localError) {
          console.warn('Error updating subscription in local backup:', localError);
        }
      } else {
        updatedSubscription = await localSubscriptionService.updateLocalSubscription(id, updates);
      }
      
      // Update local state
      setSubscriptions(prev => 
        prev.map(sub => sub.id === id ? updatedSubscription : sub)
      );
      
      return updatedSubscription;
    } catch (error) {
      console.error(`Error updating subscription with id ${id}:`, error);
      setError(`Failed to update subscription: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a subscription
  const deleteSubscription = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let success: boolean;
      
      if (storageMethod === 'remote' && isOnline) {
        success = await subscriptionService.deleteSubscription(id);
        
        // Also delete from local storage as backup
        try {
          await localSubscriptionService.deleteLocalSubscription(id);
        } catch (localError) {
          console.warn('Error deleting subscription from local backup:', localError);
        }
      } else {
        success = await localSubscriptionService.deleteLocalSubscription(id);
      }
      
      // Update local state
      if (success) {
        setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      }
      
      return success;
    } catch (error) {
      console.error(`Error deleting subscription with id ${id}:`, error);
      setError(`Failed to delete subscription: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories based on current storage method
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result: Category[] = [];
      
      if (storageMethod === 'remote' && isOnline) {
        result = await categoryService.getCategories();
        
        // Check if default categories exist, if not create them
        if (result.length === 0) {
          result = await categoryService.createDefaultCategories();
        }
      } else {
        result = await localSubscriptionService.getLocalCategories();
        
        // Check if default categories exist, if not create them
        if (result.length === 0) {
          result = await localSubscriptionService.createDefaultLocalCategories();
        }
      }
      
      setCategories(result);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new category
  const createCategory = async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let newCategory: Category;
      
      if (storageMethod === 'remote' && isOnline) {
        newCategory = await categoryService.createCategory(category);
        
        // Also save to local storage as backup
        try {
          await localSubscriptionService.createLocalCategory(category);
        } catch (localError) {
          console.warn('Error saving category to local backup:', localError);
        }
      } else {
        newCategory = await localSubscriptionService.createLocalCategory(category);
      }
      
      // Update local state
      setCategories(prev => [...prev, newCategory]);
      
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      setError(`Failed to create category: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      // Only fetch data on initial load if not already loading
      if (!isLoading) {
        await fetchSubscriptions();
        await fetchCategories();
      }
    };

    loadInitialData();
  }, [storageMethod]); // Re-fetch when storage method changes

  const contextValue: StorageContextType = {
    storageMethod,
    setStorageMethod,
    isOnline,
    
    subscriptions,
    fetchSubscriptions,
    getSubscriptionById,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    
    categories,
    fetchCategories,
    createCategory,
    
    isLoading,
    error
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};

export default StorageContext; 