/**
 * Dark Pattern Service
 * 
 * This service provides functions for working with dark pattern data,
 * including retrieval by category, ID, and search functionality.
 */

import { supabase } from './supabase';
import { DarkPattern, DarkPatternInsert, DarkPatternUpdate } from '../types/supabase';

/**
 * Validates dark pattern data
 * 
 * @param darkPattern The dark pattern data to validate
 * @returns An object with isValid and error properties
 */
export const validateDarkPattern = (
  darkPattern: Partial<DarkPatternInsert> | Partial<DarkPatternUpdate>
): { isValid: boolean; error?: string } => {
  // Check for required fields
  if ('name' in darkPattern && !darkPattern.name) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if ('description' in darkPattern && !darkPattern.description) {
    return { isValid: false, error: 'Description is required' };
  }
  
  if ('category' in darkPattern && !darkPattern.category) {
    return { isValid: false, error: 'Category is required' };
  }
  
  // Validate examples if provided
  if (darkPattern.examples) {
    if (!Array.isArray(darkPattern.examples) && typeof darkPattern.examples !== 'object') {
      return { isValid: false, error: 'Examples must be a valid JSON array or object' };
    }
  }
  
  return { isValid: true };
};

/**
 * Get all dark patterns
 * 
 * @returns Promise resolving to an array of DarkPattern objects
 */
export const getAllDarkPatterns = async (): Promise<DarkPattern[]> => {
  try {
    const { data, error } = await supabase
      .from('dark_patterns')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error('Error fetching dark patterns:', error.message);
    throw new Error(`Failed to fetch dark patterns: ${error.message}`);
  }
};

/**
 * Get dark patterns by category
 * 
 * @param category The category to filter by
 * @returns Promise resolving to an array of DarkPattern objects
 */
export const getDarkPatternsByCategory = async (category: string): Promise<DarkPattern[]> => {
  try {
    const { data, error } = await supabase
      .from('dark_patterns')
      .select('*')
      .eq('category', category)
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error(`Error fetching dark patterns for category ${category}:`, error.message);
    throw new Error(`Failed to fetch dark patterns: ${error.message}`);
  }
};

/**
 * Get a dark pattern by ID
 * 
 * @param id The ID of the dark pattern to retrieve
 * @returns Promise resolving to a DarkPattern object or null if not found
 */
export const getDarkPatternById = async (id: string): Promise<DarkPattern | null> => {
  try {
    const { data, error } = await supabase
      .from('dark_patterns')
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
    console.error(`Error fetching dark pattern with id ${id}:`, error.message);
    throw new Error(`Failed to fetch dark pattern: ${error.message}`);
  }
};

/**
 * Search dark patterns by query string
 * 
 * @param query The search query
 * @returns Promise resolving to an array of matching DarkPattern objects
 */
export const searchDarkPatterns = async (query: string): Promise<DarkPattern[]> => {
  try {
    // Convert query to lowercase for case-insensitive search
    const searchTerm = query.toLowerCase();
    
    // Fetch all dark patterns (optimally, this would use a database fulltext search)
    const { data, error } = await supabase
      .from('dark_patterns')
      .select('*');
    
    if (error) throw error;
    
    if (!data) return [];
    
    // Filter the results in memory since we're using a simple search
    const filteredResults = data.filter((pattern) => {
      return (
        pattern.name.toLowerCase().includes(searchTerm) ||
        pattern.description.toLowerCase().includes(searchTerm) ||
        pattern.category.toLowerCase().includes(searchTerm)
      );
    });
    
    return filteredResults;
  } catch (error: any) {
    console.error(`Error searching dark patterns for query "${query}":`, error.message);
    throw new Error(`Failed to search dark patterns: ${error.message}`);
  }
};

/**
 * Create a new dark pattern
 * 
 * @param darkPattern The dark pattern data to insert
 * @returns Promise resolving to the created DarkPattern
 */
export const createDarkPattern = async (darkPattern: DarkPatternInsert): Promise<DarkPattern> => {
  try {
    // Validate the dark pattern data
    const validation = validateDarkPattern(darkPattern);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const { data, error } = await supabase
      .from('dark_patterns')
      .insert(darkPattern)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      throw new Error('Failed to create dark pattern: No data returned');
    }
    
    return data;
  } catch (error: any) {
    console.error('Error creating dark pattern:', error.message);
    throw new Error(`Failed to create dark pattern: ${error.message}`);
  }
};

/**
 * Update an existing dark pattern
 * 
 * @param id The ID of the dark pattern to update
 * @param updates The dark pattern data to update
 * @returns Promise resolving to the updated DarkPattern
 */
export const updateDarkPattern = async (id: string, updates: DarkPatternUpdate): Promise<DarkPattern> => {
  try {
    // Validate the updates
    const validation = validateDarkPattern(updates);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const { data, error } = await supabase
      .from('dark_patterns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      throw new Error(`Dark pattern with ID ${id} not found`);
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error updating dark pattern with id ${id}:`, error.message);
    throw new Error(`Failed to update dark pattern: ${error.message}`);
  }
};

/**
 * Delete a dark pattern by ID
 * 
 * @param id The ID of the dark pattern to delete
 * @returns Promise resolving to true if the deletion was successful
 */
export const deleteDarkPattern = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('dark_patterns')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error(`Error deleting dark pattern with id ${id}:`, error.message);
    throw new Error(`Failed to delete dark pattern: ${error.message}`);
  }
};

/**
 * Get all distinct dark pattern categories
 * 
 * @returns Promise resolving to an array of category names
 */
export const getDarkPatternCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('dark_patterns')
      .select('category');
    
    if (error) throw error;
    
    if (!data) return [];
    
    // Extract unique categories
    const categories = [...new Set(data.map(item => item.category))];
    return categories.sort();
  } catch (error: any) {
    console.error('Error fetching dark pattern categories:', error.message);
    throw new Error(`Failed to fetch dark pattern categories: ${error.message}`);
  }
};

/**
 * Get dark patterns with examples containing a specific service
 * 
 * @param serviceName The service name to search for in examples
 * @returns Promise resolving to an array of matching DarkPattern objects
 */
export const getDarkPatternsByService = async (serviceName: string): Promise<DarkPattern[]> => {
  try {
    // Fetch all dark patterns and filter in memory
    // This approach works for small datasets
    const { data, error } = await supabase
      .from('dark_patterns')
      .select('*');
    
    if (error) throw error;
    
    if (!data) return [];
    
    // Filter patterns that have examples with the specified service
    const matchingPatterns = data.filter(pattern => {
      if (!pattern.examples || !Array.isArray(pattern.examples)) return false;
      
      return pattern.examples.some((example: any) => {
        return example.service && example.service.toLowerCase().includes(serviceName.toLowerCase());
      });
    });
    
    return matchingPatterns;
  } catch (error: any) {
    console.error(`Error finding dark patterns for service ${serviceName}:`, error.message);
    throw new Error(`Failed to find dark patterns: ${error.message}`);
  }
}; 