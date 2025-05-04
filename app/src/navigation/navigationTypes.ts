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
  Profile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  SubscriptionDetail: { subscriptionId: string };
  EditSubscription: { subscriptionId: string };
  CategoryManagement: undefined;
};

// Root navigator types that includes both Auth and Tabs
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
};

// Auth stack screen props
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

// Tab screen props
export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<
  TabParamList,
  T
>;

// Root stack screen props
export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

// Utility to make the navigation prop available throughout the app
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 