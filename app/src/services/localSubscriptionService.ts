/**
 * Local Subscription Service
 * 
 * This service provides functions for managing subscriptions in local storage
 * as a backup or offline alternative to the Supabase-based subscription service.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Subscription, 
  SubscriptionInsert, 
  SubscriptionUpdate, 
  Category 
} from '../types/supabase';
import { v4 as uuidv4 } from 'uuid';
import { validateSubscription } from '../utils/validationUtils';
import { BILLING_CYCLES, calculateNextBillingDate } from './subscriptionService';

// Storage keys
const STORAGE_KEYS = {
  SUBSCRIPTIONS: 'billo_local_subscriptions',
  CATEGORIES: 'billo_local_categories',
};

/**
 * Get all subscriptions from local storage
 * 
 * @returns Promise resolving to an array of Subscription objects
 */
export const getLocalSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const subscriptionsJson = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!subscriptionsJson) {
      return [];
    }
    
    return JSON.parse(subscriptionsJson);
  } catch (error) {
    console.error('Error fetching local subscriptions:', error);
    throw new Error(`Failed to fetch local subscriptions: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get a single subscription by ID from local storage
 * 
 * @param id The ID of the subscription to retrieve
 * @returns Promise resolving to a Subscription object or null if not found
 */
export const getLocalSubscriptionById = async (id: string): Promise<Subscription | null> => {
  try {
    const subscriptions = await getLocalSubscriptions();
    return subscriptions.find(subscription => subscription.id === id) || null;
  } catch (error) {
    console.error(`Error fetching local subscription with id ${id}:`, error);
    throw new Error(`Failed to fetch local subscription: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Save subscriptions to local storage
 * 
 * @param subscriptions Array of subscriptions to save
 * @returns Promise resolving when the save is complete
 */
export const saveLocalSubscriptions = async (subscriptions: Subscription[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
  } catch (error) {
    console.error('Error saving local subscriptions:', error);
    throw new Error(`Failed to save local subscriptions: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Create a new subscription in local storage
 * 
 * @param subscription The subscription data to insert
 * @returns Promise resolving to the created Subscription
 */
export const createLocalSubscription = async (subscription: Omit<SubscriptionInsert, 'id'>): Promise<Subscription> => {
  try {
    // Generate a UUID for the new subscription
    const newSubscription: Subscription = {
      ...subscription,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Calculate next billing date if not provided
      next_billing_date: subscription.next_billing_date || 
        calculateNextBillingDate(subscription.start_date, subscription.billing_cycle).toISOString().split('T')[0],
      // Ensure category_id and notes are always defined (as null if not provided)
      category_id: subscription.category_id ?? null,
      notes: subscription.notes ?? null
    };
    
    // Validate the subscription data
    const validation = validateSubscription(newSubscription);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(', '));
    }
    
    // Get existing subscriptions
    const subscriptions = await getLocalSubscriptions();
    
    // Add the new subscription
    subscriptions.push(newSubscription);
    
    // Save all subscriptions
    await saveLocalSubscriptions(subscriptions);
    
    return newSubscription;
  } catch (error) {
    console.error('Error creating local subscription:', error);
    throw new Error(`Failed to create local subscription: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Update an existing subscription in local storage
 * 
 * @param id The ID of the subscription to update
 * @param updates The subscription data to update
 * @returns Promise resolving to the updated Subscription
 */
export const updateLocalSubscription = async (id: string, updates: SubscriptionUpdate): Promise<Subscription> => {
  try {
    // Get existing subscriptions
    const subscriptions = await getLocalSubscriptions();
    
    // Find the subscription to update
    const subscriptionIndex = subscriptions.findIndex(subscription => subscription.id === id);
    if (subscriptionIndex === -1) {
      throw new Error(`Subscription with ID ${id} not found`);
    }
    
    // Create updated subscription
    const updatedSubscription: Subscription = {
      ...subscriptions[subscriptionIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Recalculate next billing date if relevant fields changed
    if (updates.start_date || updates.billing_cycle) {
      updatedSubscription.next_billing_date = calculateNextBillingDate(
        updatedSubscription.start_date,
        updatedSubscription.billing_cycle
      ).toISOString().split('T')[0];
    }
    
    // Validate the updated subscription
    const validation = validateSubscription(updatedSubscription);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(', '));
    }
    
    // Update the subscription in the array
    subscriptions[subscriptionIndex] = updatedSubscription;
    
    // Save all subscriptions
    await saveLocalSubscriptions(subscriptions);
    
    return updatedSubscription;
  } catch (error) {
    console.error(`Error updating local subscription with id ${id}:`, error);
    throw new Error(`Failed to update local subscription: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Delete a subscription by ID from local storage
 * 
 * @param id The ID of the subscription to delete
 * @returns Promise resolving to true if the deletion was successful
 */
export const deleteLocalSubscription = async (id: string): Promise<boolean> => {
  try {
    // Get existing subscriptions
    const subscriptions = await getLocalSubscriptions();
    
    // Find the subscription to delete
    const subscriptionIndex = subscriptions.findIndex(subscription => subscription.id === id);
    if (subscriptionIndex === -1) {
      throw new Error(`Subscription with ID ${id} not found`);
    }
    
    // Remove the subscription from the array
    subscriptions.splice(subscriptionIndex, 1);
    
    // Save the updated subscriptions
    await saveLocalSubscriptions(subscriptions);
    
    return true;
  } catch (error) {
    console.error(`Error deleting local subscription with id ${id}:`, error);
    throw new Error(`Failed to delete local subscription: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get all categories from local storage
 * 
 * @returns Promise resolving to an array of Category objects
 */
export const getLocalCategories = async (): Promise<Category[]> => {
  try {
    const categoriesJson = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!categoriesJson) {
      return [];
    }
    
    return JSON.parse(categoriesJson);
  } catch (error) {
    console.error('Error fetching local categories:', error);
    throw new Error(`Failed to fetch local categories: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Save categories to local storage
 * 
 * @param categories Array of categories to save
 * @returns Promise resolving when the save is complete
 */
export const saveLocalCategories = async (categories: Category[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving local categories:', error);
    throw new Error(`Failed to save local categories: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Create default categories in local storage
 * 
 * @returns Promise resolving to the created categories
 */
export const createDefaultLocalCategories = async (): Promise<Category[]> => {
  try {
    // Define default categories
    const defaultCategories: Category[] = [
      {
        id: uuidv4(),
        name: 'Entertainment',
        icon: 'film',
        color: '#FF5252',
        is_default: true,
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Software',
        icon: 'code',
        color: '#2196F3',
        is_default: true,
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Utilities',
        icon: 'home',
        color: '#4CAF50',
        is_default: true,
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Shopping',
        icon: 'shopping-cart',
        color: '#FFC107',
        is_default: true,
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Get existing categories
    const existingCategories = await getLocalCategories();
    
    // Only add default categories if no categories exist
    if (existingCategories.length === 0) {
      await saveLocalCategories(defaultCategories);
      return defaultCategories;
    }
    
    return existingCategories;
  } catch (error) {
    console.error('Error creating default local categories:', error);
    throw new Error(`Failed to create default local categories: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Create a custom category in local storage
 * 
 * @param category The category data to create
 * @returns Promise resolving to the created Category
 */
export const createLocalCategory = async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> => {
  try {
    // Generate a UUID for the new category
    const newCategory: Category = {
      ...category,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_default: false
    };
    
    // Get existing categories
    const categories = await getLocalCategories();
    
    // Add the new category
    categories.push(newCategory);
    
    // Save all categories
    await saveLocalCategories(categories);
    
    return newCategory;
  } catch (error) {
    console.error('Error creating local category:', error);
    throw new Error(`Failed to create local category: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default {
  getLocalSubscriptions,
  getLocalSubscriptionById,
  createLocalSubscription,
  updateLocalSubscription,
  deleteLocalSubscription,
  getLocalCategories,
  createDefaultLocalCategories,
  createLocalCategory
}; 