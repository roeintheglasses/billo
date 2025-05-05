/**
 * Supabase Database Types
 *
 * This file contains TypeScript definitions that match the Supabase
 * database schema. These types provide type safety when interacting
 * with Supabase data.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          phone: string | null;
          preferences: Json | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          phone?: string | null;
          preferences?: Json | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          phone?: string | null;
          preferences?: Json | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          theme_preference: string | null;
          notification_settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme_preference?: string | null;
          notification_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme_preference?: string | null;
          notification_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          color: string | null;
          user_id: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          user_id?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          user_id?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          billing_cycle: string;
          start_date: string;
          next_billing_date: string | null;
          category_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          source_type: string;
          auto_detected: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          billing_cycle: string;
          start_date: string;
          next_billing_date?: string | null;
          category_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          source_type?: string;
          auto_detected?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          billing_cycle?: string;
          start_date?: string;
          next_billing_date?: string | null;
          category_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          source_type?: string;
          auto_detected?: boolean;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          amount: number;
          date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          amount: number;
          date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          amount?: number;
          date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          priority: string;
          link_url?: string;
          metadata?: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read?: boolean;
          priority?: string;
          link_url?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          priority?: string;
          link_url?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      dark_patterns: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          examples: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: string;
          examples?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: string;
          examples?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_messages: {
        Row: {
          id: string;
          subscription_id: string | null;
          user_id: string;
          sender: string;
          message_body: string;
          detected_at: string;
          confidence_score: number;
          extracted_data: Json;
          message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscription_id?: string | null;
          user_id: string;
          sender: string;
          message_body: string;
          detected_at?: string;
          confidence_score?: number;
          extracted_data?: Json;
          message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string | null;
          user_id?: string;
          sender?: string;
          message_body?: string;
          detected_at?: string;
          confidence_score?: number;
          extracted_data?: Json;
          message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_feedback: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          message_id: string | null;
          feedback_type: string;
          description: string;
          accuracy_rating: number | null;
          source_screen: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          message_id?: string | null;
          feedback_type: string;
          description: string;
          accuracy_rating?: number | null;
          source_screen: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          message_id?: string | null;
          feedback_type?: string;
          description?: string;
          accuracy_rating?: number | null;
          source_screen?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      subscription_with_messages: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          billing_cycle: string;
          start_date: string;
          next_billing_date: string | null;
          category_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          source_type: string;
          auto_detected: boolean;
          messages: Json;
        };
      };
      subscription_analytics: {
        Row: {
          user_id: string;
          total_subscriptions: number;
          total_monthly_cost: number;
          monthly_subscriptions: number;
          yearly_subscriptions: number;
          detected_messages_count: number;
          auto_detected_count: number;
          latest_subscription_date: string;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Type definitions for user profile related data
export type UserProfile = Database['public']['Tables']['profiles']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type User = Database['public']['Tables']['users']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// User with profile joined data
export interface UserWithProfile extends User {
  profile?: UserProfile;
}

// Auth-related types
export interface AuthUser {
  id: string;
  email: string;
}

export interface Session {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Category-related types
export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

// Subscription-related types
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];

// Subscription message types
export type SubscriptionMessage = Database['public']['Tables']['subscription_messages']['Row'];
export type SubscriptionMessageInsert =
  Database['public']['Tables']['subscription_messages']['Insert'];
export type SubscriptionMessageUpdate =
  Database['public']['Tables']['subscription_messages']['Update'];

// Transaction-related types
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// Notification-related types
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

// Extend notification types with our custom fields
export interface ExtendedNotificationInsert extends NotificationInsert {
  scheduled_for?: string;
  status?: string;
  related_entity_id?: string;
  related_entity_type?: string;
  deep_link_url?: string;
}

export interface ExtendedNotificationUpdate extends NotificationUpdate {
  scheduled_for?: string;
  status?: string;
  related_entity_id?: string;
  related_entity_type?: string;
  deep_link_url?: string;
}

// Dark Pattern-related types
export type DarkPattern = Database['public']['Tables']['dark_patterns']['Row'];
export type DarkPatternInsert = Database['public']['Tables']['dark_patterns']['Insert'];
export type DarkPatternUpdate = Database['public']['Tables']['dark_patterns']['Update'];

// Extended types for joined data
export interface SubscriptionWithCategory extends Subscription {
  category?: Category;
}

export interface SubscriptionWithMessages extends Subscription {
  messages?: SubscriptionMessage[];
}

export interface SubscriptionWithTransactions extends Subscription {
  transactions?: Transaction[];
}

// Add new interface types for cross-model relationships
export interface SubscriptionWithCategoryAndTransactions extends Subscription {
  category?: Category;
  transactions?: Transaction[];
}

export interface SubscriptionWithCategoryAndMessages extends Subscription {
  category?: Category;
  messages?: SubscriptionMessage[];
}

export interface SubscriptionWithAllRelations extends Subscription {
  category?: Category;
  transactions?: Transaction[];
  messages?: SubscriptionMessage[];
}

export interface CategoryWithSubscriptions extends Category {
  subscriptions?: Subscription[];
}

export interface UserWithSubscriptionsAndTransactions {
  user: User;
  subscriptions?: SubscriptionWithCategoryAndTransactions[];
}

export interface SpendingAnalytics {
  totalAmount: number;
  averageAmount: number;
  subscriptionCount: number;
  transactionCount: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
  timeSeriesData?: {
    period: string;
    amount: number;
  }[];
}

// User Feedback-related types
export type UserFeedback = Database['public']['Tables']['user_feedback']['Row'];
export type UserFeedbackInsert = Database['public']['Tables']['user_feedback']['Insert'];
export type UserFeedbackUpdate = Database['public']['Tables']['user_feedback']['Update'];

export interface SubscriptionWithFeedback extends Subscription {
  feedback?: UserFeedback[];
}
