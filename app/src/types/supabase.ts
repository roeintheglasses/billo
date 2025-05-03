/**
 * Supabase Database Types
 * 
 * This file contains TypeScript definitions that match the Supabase
 * database schema. These types provide type safety when interacting
 * with Supabase data.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
    };
    Views: {
      [_ in never]: never;
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