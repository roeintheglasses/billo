/**
 * Subscription Count Service
 * 
 * This service provides functions for calculating subscription counts by category
 * for visualization in the dashboard.
 */

import { supabase } from './supabase';
import { Category } from '../types/supabase';

/**
 * Interface for subscription count data
 */
export interface CategoryCount {
  category: Category;
  count: number;
  percentage?: number;
}

/**
 * Calculate the number of subscriptions in each category
 * 
 * @returns Promise resolving to an array of category count objects
 */
export const calculateSubscriptionCountByCategory = async (): Promise<CategoryCount[]> => {
  try {
    // Get all categories with their subscriptions
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        subscriptions:subscriptions (id)
      `)
      .order('name');
    
    if (error) throw error;
    
    if (!categories || categories.length === 0) {
      return [];
    }
    
    // Count subscriptions in each category
    const categoryCountData = categories.map(category => {
      const subscriptions = category.subscriptions || [];
      return {
        category: {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          user_id: category.user_id,
          is_default: category.is_default,
          created_at: category.created_at,
          updated_at: category.updated_at
        },
        count: subscriptions.length
      };
    });
    
    // Calculate total subscriptions
    const totalSubscriptions = categoryCountData.reduce(
      (sum, item) => sum + item.count, 
      0
    );
    
    // Calculate percentages
    return categoryCountData.map(item => ({
      ...item,
      percentage: totalSubscriptions > 0 
        ? Math.round((item.count / totalSubscriptions) * 100) 
        : 0
    }));
  } catch (error: any) {
    console.error('Error calculating subscription count by category:', error.message);
    throw new Error(`Failed to calculate subscription counts: ${error.message}`);
  }
};

/**
 * Get the total subscription count across all categories
 * 
 * @returns Promise resolving to the total count
 */
export const getTotalSubscriptionCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    return count || 0;
  } catch (error: any) {
    console.error('Error fetching total subscription count:', error.message);
    throw new Error(`Failed to fetch total subscription count: ${error.message}`);
  }
};

export default {
  calculateSubscriptionCountByCategory,
  getTotalSubscriptionCount
}; 