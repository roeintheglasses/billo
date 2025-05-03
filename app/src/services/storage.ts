/**
 * Secure Storage Service
 * 
 * This file provides a secure storage service for managing auth tokens and
 * other sensitive data using either SecureStore or AsyncStorage as a fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'billo_access_token',
  REFRESH_TOKEN: 'billo_refresh_token',
  SESSION: 'billo_session',
  USER_ID: 'billo_user_id',
};

/**
 * Check if SecureStore is available on the current device
 * 
 * @returns {Promise<boolean>} True if SecureStore is available
 */
const isSecureStoreAvailable = async (): Promise<boolean> => {
  return await SecureStore.isAvailableAsync();
};

/**
 * Secure storage service with optional fallback to AsyncStorage
 */
export const secureStorage = {
  /**
   * Store a value securely
   * 
   * @param {string} key Storage key
   * @param {any} value Value to store (will be stringified if not a string)
   * @returns {Promise<void>}
   */
  async setItem(key: string, value: any): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, stringValue);
    } else {
      await AsyncStorage.setItem(key, stringValue);
    }
  },
  
  /**
   * Retrieve a stored value
   * 
   * @param {string} key Storage key
   * @param {boolean} parseJson Whether to parse the result as JSON
   * @returns {Promise<any>} The stored value or null if not found
   */
  async getItem(key: string, parseJson = false): Promise<any> {
    let value;
    
    if (await isSecureStoreAvailable()) {
      value = await SecureStore.getItemAsync(key);
    } else {
      value = await AsyncStorage.getItem(key);
    }
    
    if (value && parseJson) {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error(`Error parsing JSON from storage for key ${key}:`, e);
        return null;
      }
    }
    
    return value;
  },
  
  /**
   * Remove a stored value
   * 
   * @param {string} key Storage key
   * @returns {Promise<void>}
   */
  async removeItem(key: string): Promise<void> {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
  
  /**
   * Store auth session data securely
   * 
   * @param {object} session Session data with tokens
   * @returns {Promise<void>}
   */
  async storeSession(session: { access_token: string, refresh_token: string, user: { id: string } }): Promise<void> {
    if (!session) return;
    
    await Promise.all([
      this.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.access_token),
      this.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refresh_token),
      this.setItem(STORAGE_KEYS.USER_ID, session.user.id),
      this.setItem(STORAGE_KEYS.SESSION, session),
    ]);
  },
  
  /**
   * Clear all auth session data
   * 
   * @returns {Promise<void>}
   */
  async clearSession(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      this.removeItem(STORAGE_KEYS.SESSION),
      this.removeItem(STORAGE_KEYS.USER_ID),
    ]);
  },
  
  /**
   * Get stored session data
   * 
   * @returns {Promise<object|null>} The session data or null if not found
   */
  async getSession(): Promise<any> {
    return this.getItem(STORAGE_KEYS.SESSION, true);
  }
};

export default secureStorage; 