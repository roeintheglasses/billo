/**
 * Services index
 * 
 * This file exports all services used in the application.
 */

import * as authService from './auth';
import supabase, * as supabaseService from './supabase';
import storageService from './storage';
import categoryService from './categoryService';
import subscriptionService from './subscriptionService';

export {
  authService,
  supabase,
  supabaseService,
  storageService,
  categoryService,
  subscriptionService
};

export default {
  auth: authService,
  supabase,
  storage: storageService,
  category: categoryService,
  subscription: subscriptionService
}; 