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
  
  // Bulk operations
  bulkDeleteSubscriptions: (ids: string[]) => Promise<boolean>;
  bulkUpdateCategory: (ids: string[], categoryId: string) => Promise<boolean>;
  bulkUpdateBillingCycle: (ids: string[], billingCycle: string) => Promise<boolean>;

  // Category operations
  categories: Category[];
  fetchCategories: () => Promise<void>;
  createCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => Promise<Category>;
  updateCategory: (id: string, updates: Omit<Partial<Category>, 'id' | 'created_at' | 'updated_at'>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;
  
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
  
  bulkDeleteSubscriptions: async () => false,
  bulkUpdateCategory: async () => false,
  bulkUpdateBillingCycle: async () => false,
  
  categories: [],
  fetchCategories: async () => {},
  createCategory: async () => ({} as Category),
  updateCategory: async () => ({} as Category),
  deleteCategory: async () => false,
  
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

  // Update an existing category
  const updateCategory = async (id: string, updates: Omit<Partial<Category>, 'id' | 'created_at' | 'updated_at'>): Promise<Category> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let updatedCategory: Category;
      
      if (storageMethod === 'remote' && isOnline) {
        updatedCategory = await categoryService.updateCategory(id, updates);
        
        // Also update in local storage as backup
        try {
          await localSubscriptionService.updateLocalCategory(id, updates);
        } catch (localError) {
          console.warn('Error updating category in local backup:', localError);
        }
      } else {
        // This would be implemented in localSubscriptionService
        // For now, just update the local state
        const existingCategory = categories.find(cat => cat.id === id);
        if (!existingCategory) {
          throw new Error(`Category with ID ${id} not found`);
        }
        
        updatedCategory = {
          ...existingCategory,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      
      // Update local state
      setCategories(prev => 
        prev.map(cat => cat.id === id ? updatedCategory : cat)
      );
      
      return updatedCategory;
    } catch (error) {
      console.error(`Error updating category with id ${id}:`, error);
      setError(`Failed to update category: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a category
  const deleteCategory = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let success: boolean;
      
      if (storageMethod === 'remote' && isOnline) {
        success = await categoryService.deleteCategory(id);
        
        // Also delete from local storage as backup
        try {
          await localSubscriptionService.deleteLocalCategory(id);
        } catch (localError) {
          console.warn('Error deleting category from local backup:', localError);
        }
      } else {
        // This would be implemented in localSubscriptionService
        // For now, just update the local state
        const categoryToDelete = categories.find(cat => cat.id === id);
        if (!categoryToDelete) {
          throw new Error(`Category with ID ${id} not found`);
        }
        
        if (categoryToDelete.is_default) {
          throw new Error('Default categories cannot be deleted');
        }
        
        success = true;
      }
      
      // Update local state
      if (success) {
        setCategories(prev => prev.filter(cat => cat.id !== id));
      }
      
      return success;
    } catch (error) {
      console.error(`Error deleting category with id ${id}:`, error);
      setError(`Failed to delete category: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk delete multiple subscriptions
  const bulkDeleteSubscriptions = async (ids: string[]): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let success = true;
      
      if (storageMethod === 'remote' && isOnline) {
        // For remote storage, we can potentially make a bulk delete API call
        // But for now, we'll loop through and delete individually
        for (const id of ids) {
          const deleted = await subscriptionService.deleteSubscription(id);
          if (!deleted) {
            success = false;
          }
          
          // Also delete from local storage as backup
          try {
            await localSubscriptionService.deleteLocalSubscription(id);
          } catch (localError) {
            console.warn('Error deleting subscription from local backup:', localError);
          }
        }
      } else {
        // For local storage, we need to loop through and delete individually
        for (const id of ids) {
          const deleted = await localSubscriptionService.deleteLocalSubscription(id);
          if (!deleted) {
            success = false;
          }
        }
      }
      
      // Update the local state by filtering out deleted subscriptions
      if (success) {
        setSubscriptions(prev => prev.filter(sub => !ids.includes(sub.id)));
      }
      
      return success;
    } catch (error) {
      console.error('Error bulk deleting subscriptions:', error);
      setError(`Failed to delete subscriptions: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk update category for multiple subscriptions
  const bulkUpdateCategory = async (ids: string[], categoryId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let success = true;
      
      // Loop through each subscription and update the category
      for (const id of ids) {
        try {
          if (storageMethod === 'remote' && isOnline) {
            await subscriptionService.updateSubscription(id, { category_id: categoryId });
            
            // Also update in local storage as backup
            try {
              await localSubscriptionService.updateLocalSubscription(id, { category_id: categoryId });
            } catch (localError) {
              console.warn('Error updating subscription in local backup:', localError);
            }
          } else {
            await localSubscriptionService.updateLocalSubscription(id, { category_id: categoryId });
          }
        } catch (error) {
          console.error(`Error updating category for subscription ${id}:`, error);
          success = false;
        }
      }
      
      // Update the local state to reflect the changes
      if (success) {
        setSubscriptions(prev => 
          prev.map(sub => ids.includes(sub.id) ? { ...sub, category_id: categoryId } : sub)
        );
      }
      
      return success;
    } catch (error) {
      console.error('Error bulk updating subscription categories:', error);
      setError(`Failed to update categories: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk update billing cycle for multiple subscriptions
  const bulkUpdateBillingCycle = async (ids: string[], billingCycle: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let success = true;
      
      // Loop through each subscription and update the billing cycle
      for (const id of ids) {
        try {
          // First get the current subscription to calculate new next_billing_date
          let subscription: Subscription | null = null;
          
          if (storageMethod === 'remote' && isOnline) {
            subscription = await subscriptionService.getSubscriptionById(id);
          } else {
            subscription = await localSubscriptionService.getLocalSubscriptionById(id);
          }
          
          if (!subscription) {
            console.error(`Subscription with id ${id} not found`);
            success = false;
            continue;
          }
          
          // Calculate new next_billing_date based on the new billing cycle
          const nextBillingDate = subscriptionService.calculateNextBillingDate(
            subscription.start_date,
            billingCycle
          ).toISOString().split('T')[0];
          
          // Update the subscription
          const updates = { 
            billing_cycle: billingCycle, 
            next_billing_date: nextBillingDate 
          };
          
          if (storageMethod === 'remote' && isOnline) {
            await subscriptionService.updateSubscription(id, updates);
            
            // Also update in local storage as backup
            try {
              await localSubscriptionService.updateLocalSubscription(id, updates);
            } catch (localError) {
              console.warn('Error updating subscription in local backup:', localError);
            }
          } else {
            await localSubscriptionService.updateLocalSubscription(id, updates);
          }
        } catch (error) {
          console.error(`Error updating billing cycle for subscription ${id}:`, error);
          success = false;
        }
      }
      
      // Update the local state to reflect the changes
      if (success) {
        setSubscriptions(prev => 
          prev.map(sub => {
            if (ids.includes(sub.id)) {
              const nextBillingDate = subscriptionService.calculateNextBillingDate(
                sub.start_date,
                billingCycle
              ).toISOString().split('T')[0];
              
              return { 
                ...sub, 
                billing_cycle: billingCycle, 
                next_billing_date: nextBillingDate 
              };
            }
            return sub;
          })
        );
      }
      
      return success;
    } catch (error) {
      console.error('Error bulk updating subscription billing cycles:', error);
      setError(`Failed to update billing cycles: ${error instanceof Error ? error.message : String(error)}`);
      return false;
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
    
    bulkDeleteSubscriptions,
    bulkUpdateCategory,
    bulkUpdateBillingCycle,
    
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    
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