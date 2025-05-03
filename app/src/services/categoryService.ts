/**
 * Category Service
 * 
 * This service provides functions for managing categories in the application
 * including CRUD operations and validation.
 */

import { supabase } from './supabase';
import { Category, CategoryInsert, CategoryUpdate } from '../types/supabase';

/**
 * Validates a color is in correct hex format
 * 
 * @param color The color string to validate
 * @returns True if the color is valid
 */
export const isValidColor = (color: string): boolean => {
  // Accept empty/null values
  if (!color) return true;
  
  // Check for valid hex color format (#RRGGBB or #RGB)
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Validates an icon is from the accepted set
 * 
 * @param icon The icon string to validate
 * @returns True if the icon is valid
 */
export const isValidIcon = (icon: string): boolean => {
  // Accept empty/null values
  if (!icon) return true;
  
  // Valid icon names - this would ideally be imported from a config file
  const validIcons = [
    'film', 'utility-pole', 'code', 'heart', 'pizza', 'question', 
    'shopping-cart', 'home', 'music', 'book', 'coffee', 'car',
    'plane', 'gamepad', 'dumbbell', 'wifi', 'cloud'
  ];
  
  return validIcons.includes(icon);
};

/**
 * Validates a category object
 * 
 * @param category The category object to validate
 * @returns An object with isValid and error properties
 */
export const validateCategory = (
  category: Partial<CategoryInsert> | Partial<CategoryUpdate>
): { isValid: boolean; error?: string } => {
  // Validate required fields for new categories
  if ('name' in category && category.name === undefined) {
    return { isValid: false, error: 'Category name is required' };
  }
  
  // Validate color if provided
  if (category.color && !isValidColor(category.color)) {
    return { isValid: false, error: 'Invalid color format. Use hex format (e.g., #FF5733)' };
  }
  
  // Validate icon if provided
  if (category.icon && !isValidIcon(category.icon)) {
    return { isValid: false, error: 'Invalid icon name' };
  }
  
  return { isValid: true };
};

/**
 * Get all categories for the current user, optionally including default categories
 * 
 * @param includeDefaults Whether to include default categories (true by default)
 * @returns Promise resolving to an array of Category objects
 */
export const getCategories = async (includeDefaults = true): Promise<Category[]> => {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (!includeDefaults) {
      query = query.eq('is_default', false);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error('Error fetching categories:', error.message);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
};

/**
 * Get a single category by ID
 * 
 * @param id The ID of the category to retrieve
 * @returns Promise resolving to a Category object or null if not found
 */
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // "Not found" error code
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error fetching category with id ${id}:`, error.message);
    throw new Error(`Failed to fetch category: ${error.message}`);
  }
};

/**
 * Get all default categories
 * 
 * @returns Promise resolving to an array of default Category objects
 */
export const getDefaultCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_default', true)
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error('Error fetching default categories:', error.message);
    throw new Error(`Failed to fetch default categories: ${error.message}`);
  }
};

/**
 * Create a new category
 * 
 * @param category The category data to insert
 * @returns Promise resolving to the created Category
 */
export const createCategory = async (category: CategoryInsert): Promise<Category> => {
  try {
    // Validate the category data
    const validation = validateCategory(category);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      throw new Error('Failed to create category: No data returned');
    }
    
    return data;
  } catch (error: any) {
    console.error('Error creating category:', error.message);
    throw new Error(`Failed to create category: ${error.message}`);
  }
};

/**
 * Update an existing category
 * 
 * @param id The ID of the category to update
 * @param updates The category data to update
 * @returns Promise resolving to the updated Category
 */
export const updateCategory = async (id: string, updates: CategoryUpdate): Promise<Category> => {
  try {
    // Validate the updates
    const validation = validateCategory(updates);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error updating category with id ${id}:`, error.message);
    throw new Error(`Failed to update category: ${error.message}`);
  }
};

/**
 * Delete a category by ID
 * 
 * @param id The ID of the category to delete
 * @returns Promise resolving to true if the deletion was successful
 */
export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    // Check if category is a default category
    const category = await getCategoryById(id);
    if (category?.is_default) {
      throw new Error('Default categories cannot be deleted');
    }
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error(`Error deleting category with id ${id}:`, error.message);
    throw new Error(`Failed to delete category: ${error.message}`);
  }
};

/**
 * Create a set of default categories for a user 
 * 
 * @param userId The ID of the user to create default categories for
 * @returns Promise resolving to the created categories
 */
export const createDefaultCategoriesForUser = async (userId: string): Promise<Category[]> => {
  try {
    const defaultCategories: CategoryInsert[] = [
      { name: 'Entertainment', icon: 'film', color: '#FF5733', user_id: userId, is_default: true },
      { name: 'Utilities', icon: 'utility-pole', color: '#33FFF6', user_id: userId, is_default: true },
      { name: 'Software', icon: 'code', color: '#337DFF', user_id: userId, is_default: true },
      { name: 'Health', icon: 'heart', color: '#FF33E6', user_id: userId, is_default: true },
      { name: 'Food', icon: 'pizza', color: '#76FF33', user_id: userId, is_default: true },
      { name: 'Other', icon: 'question', color: '#A233FF', user_id: userId, is_default: true }
    ];
    
    const { data, error } = await supabase
      .from('categories')
      .insert(defaultCategories)
      .select();
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error(`Error creating default categories for user ${userId}:`, error.message);
    throw new Error(`Failed to create default categories: ${error.message}`);
  }
};

export default {
  getCategories,
  getCategoryById,
  getDefaultCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createDefaultCategoriesForUser,
  validateCategory,
  isValidColor,
  isValidIcon
}; 