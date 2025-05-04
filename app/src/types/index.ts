/**
 * Types index
 *
 * This file exports all type definitions used in the application.
 */

export * from './supabase';

/**
 * Navigation Stack Parameter List
 *
 * Defines the parameters for each screen in the navigation stack
 */
export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Profile: undefined;
  Login: undefined;
  Register: undefined;
  ChangePassword: undefined;
  SubscriptionDetail: { id: string };
  AddSubscription: undefined;
  EditSubscription: { id: string };
  CategoryManagement: undefined;
};
