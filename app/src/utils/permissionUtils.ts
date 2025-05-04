import { Alert, Linking, Platform } from 'react-native';
import { PermissionResult, PermissionState, PermissionType } from '../types/permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid } from 'react-native';

// Storage keys
const PERMISSION_STATE_KEY_PREFIX = '@Billo:permission:';
const PERMISSION_LAST_REQUESTED_KEY_PREFIX = '@Billo:permission_last_requested:';

/**
 * Get storage key for permission state
 */
const getPermissionStateKey = (permission: PermissionType): string => 
  `${PERMISSION_STATE_KEY_PREFIX}${permission}`;

/**
 * Get storage key for last requested timestamp
 */
const getPermissionLastRequestedKey = (permission: PermissionType): string => 
  `${PERMISSION_LAST_REQUESTED_KEY_PREFIX}${permission}`;

/**
 * Store permission state in AsyncStorage
 */
export const storePermissionState = async (
  permission: PermissionType,
  state: PermissionState
): Promise<void> => {
  try {
    await AsyncStorage.setItem(getPermissionStateKey(permission), state);
  } catch (error) {
    console.error('Error storing permission state:', error);
  }
};

/**
 * Get stored permission state from AsyncStorage
 */
export const getStoredPermissionState = async (
  permission: PermissionType
): Promise<PermissionState | null> => {
  try {
    const state = await AsyncStorage.getItem(getPermissionStateKey(permission));
    return state as PermissionState || null;
  } catch (error) {
    console.error('Error getting stored permission state:', error);
    return null;
  }
};

/**
 * Store timestamp of last permission request
 */
export const storeLastRequestedTimestamp = async (
  permission: PermissionType
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      getPermissionLastRequestedKey(permission),
      Date.now().toString()
    );
  } catch (error) {
    console.error('Error storing permission request timestamp:', error);
  }
};

/**
 * Check if we can request permission again (to avoid excessive prompts)
 * Returns true if permission hasn't been requested in the last 24 hours
 */
export const canRequestPermissionAgain = async (
  permission: PermissionType
): Promise<boolean> => {
  try {
    const lastRequestedStr = await AsyncStorage.getItem(
      getPermissionLastRequestedKey(permission)
    );
    
    if (!lastRequestedStr) return true;
    
    const lastRequested = parseInt(lastRequestedStr, 10);
    const now = Date.now();
    const hoursSinceLastRequest = (now - lastRequested) / (1000 * 60 * 60);
    
    return hoursSinceLastRequest >= 24;
  } catch (error) {
    console.error('Error checking if permission can be requested again:', error);
    return true;
  }
};

/**
 * Open app settings to allow user to enable permissions manually
 */
export const openAppSettings = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('Error opening app settings:', error);
  }
};

/**
 * Check SMS permissions status
 */
export const checkSMSPermissions = async (): Promise<PermissionState> => {
  // iOS doesn't support SMS permissions, so we return NOT_APPLICABLE
  if (Platform.OS === 'ios') {
    return PermissionState.NOT_APPLICABLE;
  }

  try {
    // Check both READ_SMS and RECEIVE_SMS permissions
    const hasReadSms = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    const hasReceiveSms = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
    );

    // Both permissions needed
    return hasReadSms && hasReceiveSms 
      ? PermissionState.GRANTED 
      : PermissionState.NOT_REQUESTED;
  } catch (error) {
    console.error('Error checking SMS permissions:', error);
    return PermissionState.NOT_REQUESTED;
  }
};

/**
 * Request SMS permissions with proper rationale
 */
export const requestSMSPermissions = async (): Promise<PermissionResult> => {
  // iOS doesn't support SMS permissions
  if (Platform.OS === 'ios') {
    return { granted: false, canAskAgain: false };
  }

  try {
    // Store the timestamp of this request
    await storeLastRequestedTimestamp(PermissionType.SMS);

    // Request both READ_SMS and RECEIVE_SMS permissions
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);

    const isReadGranted = 
      result[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED;
    const isReceiveGranted = 
      result[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED;
    
    const isGranted = isReadGranted && isReceiveGranted;
    
    // Check if we can ask again (not NEVER_ASK_AGAIN)
    const canAskAgainRead = 
      result[PermissionsAndroid.PERMISSIONS.READ_SMS] !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
    const canAskAgainReceive = 
      result[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
    
    const canAskAgain = canAskAgainRead && canAskAgainReceive;

    return { granted: isGranted, canAskAgain };
  } catch (error) {
    console.error('Error requesting SMS permissions:', error);
    return { granted: false, canAskAgain: true };
  }
};

/**
 * Show alert explaining why SMS permissions are needed
 * with options to request permission or go to settings
 */
export const showSMSPermissionRationaleAlert = (
  onRequestPermission: () => void,
  onOpenSettings: () => void
): void => {
  Alert.alert(
    'SMS Permissions Required',
    'Billo needs to access your SMS messages to automatically detect subscriptions. Your messages are processed on device and no message content is stored or transmitted.',
    [
      {
        text: 'Not Now',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: onOpenSettings,
      },
      {
        text: 'Allow Access',
        onPress: onRequestPermission,
      },
    ],
    { cancelable: true }
  );
}; 