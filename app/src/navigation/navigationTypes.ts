/**
 * Navigation type definitions for the app
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth stack types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

// Tab navigator types
export type TabParamList = {
  Home: undefined;
  Subscriptions: undefined;
  Add: undefined;
  Calendar: undefined;
  Settings: undefined;
  ChangePassword: undefined;
};

// Root navigator types that includes both Auth and Tabs
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Tabs: NavigatorScreenParams<TabParamList>;
};

// Helper type for screen props in the Auth Navigator
export type AuthScreenProps<Screen extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, Screen>;

// Helper type for screen props in the Tab Navigator
export type TabScreenProps<Screen extends keyof TabParamList> = 
  BottomTabScreenProps<TabParamList, Screen>;

// Helper type for the root navigation
export type RootScreenProps<Screen extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, Screen>;

// Utility to make the navigation prop available throughout the app
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 