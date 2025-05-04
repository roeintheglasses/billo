import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { PermissionState, PermissionType, PermissionsContextState } from '../types/permissions';
import {
  checkSMSPermissions,
  getStoredPermissionState,
  openAppSettings,
  requestSMSPermissions,
  showSMSPermissionRationaleAlert,
  storePermissionState,
  canRequestPermissionAgain,
} from '../utils/permissionUtils';

// Define actions for the permissions reducer
type PermissionsAction =
  | { type: 'SET_PERMISSION_STATE'; permission: PermissionType; state: PermissionState }
  | { type: 'RESET_PERMISSION_STATE'; permission: PermissionType };

// Initial state for the permissions context
const initialState: PermissionsContextState = {
  [PermissionType.SMS]: PermissionState.NOT_REQUESTED,
  [PermissionType.CAMERA]: PermissionState.NOT_REQUESTED,
};

// Reducer function for managing permission states
const permissionsReducer = (
  state: PermissionsContextState,
  action: PermissionsAction
): PermissionsContextState => {
  switch (action.type) {
    case 'SET_PERMISSION_STATE':
      return {
        ...state,
        [action.permission]: action.state,
      };
    case 'RESET_PERMISSION_STATE':
      return {
        ...state,
        [action.permission]: PermissionState.NOT_REQUESTED,
      };
    default:
      return state;
  }
};

// Create the permissions context
interface PermissionsContextValue {
  permissionState: PermissionsContextState;
  checkSMSPermissionStatus: () => Promise<PermissionState>;
  requestSMSPermission: () => Promise<boolean>;
  showSMSPermissionExplanation: () => void;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

/**
 * PermissionsProvider component to manage permission states
 */
export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissionState, dispatch] = useReducer(permissionsReducer, initialState);

  // Load stored permission states on mount
  useEffect(() => {
    const loadStoredPermissionStates = async () => {
      try {
        // Load SMS permission state
        const storedSmsState = await getStoredPermissionState(PermissionType.SMS);
        if (storedSmsState) {
          dispatch({
            type: 'SET_PERMISSION_STATE',
            permission: PermissionType.SMS,
            state: storedSmsState,
          });
        } else {
          // If no stored state, check current status
          const currentStatus = await checkSMSPermissions();
          dispatch({
            type: 'SET_PERMISSION_STATE',
            permission: PermissionType.SMS,
            state: currentStatus,
          });
          // Store the current status
          await storePermissionState(PermissionType.SMS, currentStatus);
        }
      } catch (error) {
        console.error('Error loading stored permission states:', error);
      }
    };

    loadStoredPermissionStates();
  }, []);

  /**
   * Check SMS permission status
   */
  const checkSMSPermissionStatus = async (): Promise<PermissionState> => {
    const status = await checkSMSPermissions();

    // Update state if different from current state
    if (status !== permissionState[PermissionType.SMS]) {
      dispatch({
        type: 'SET_PERMISSION_STATE',
        permission: PermissionType.SMS,
        state: status,
      });

      // Store the updated state
      await storePermissionState(PermissionType.SMS, status);
    }

    return status;
  };

  /**
   * Request SMS permission
   */
  const requestSMSPermission = async (): Promise<boolean> => {
    // Check if we can request permission
    if (permissionState[PermissionType.SMS] === PermissionState.DENIED_PERMANENTLY) {
      // If permanently denied, prompt to open settings
      showSMSPermissionRationaleAlert(
        () => console.log('Cannot request SMS permission: permanently denied'),
        openAppSettings
      );
      return false;
    }

    // Check if we've requested recently to avoid excessive prompts
    const canRequestAgain = await canRequestPermissionAgain(PermissionType.SMS);
    if (!canRequestAgain && permissionState[PermissionType.SMS] === PermissionState.DENIED) {
      // If we requested recently and were denied, show rationale
      showSMSPermissionRationaleAlert(
        () => console.log('Will try requesting SMS permission again'),
        openAppSettings
      );
      return false;
    }

    // Request the permission
    const { granted, canAskAgain } = await requestSMSPermissions();

    // Update state based on result
    const newState = granted
      ? PermissionState.GRANTED
      : canAskAgain
        ? PermissionState.DENIED
        : PermissionState.DENIED_PERMANENTLY;

    dispatch({
      type: 'SET_PERMISSION_STATE',
      permission: PermissionType.SMS,
      state: newState,
    });

    // Store the new state
    await storePermissionState(PermissionType.SMS, newState);

    return granted;
  };

  /**
   * Show SMS permission explanation
   */
  const showSMSPermissionExplanation = (): void => {
    showSMSPermissionRationaleAlert(requestSMSPermission, openAppSettings);
  };

  const value: PermissionsContextValue = {
    permissionState,
    checkSMSPermissionStatus,
    requestSMSPermission,
    showSMSPermissionExplanation,
  };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

/**
 * Hook to use the permissions context
 */
export const usePermissions = (): PermissionsContextValue => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

/**
 * Hook specifically for SMS permissions
 */
export const useSMSPermissions = () => {
  const {
    permissionState,
    checkSMSPermissionStatus,
    requestSMSPermission,
    showSMSPermissionExplanation,
  } = usePermissions();

  return {
    smsPermissionState: permissionState[PermissionType.SMS],
    checkSMSPermission: checkSMSPermissionStatus,
    requestSMSPermission,
    showSMSPermissionExplanation,
    isSMSPermissionGranted: permissionState[PermissionType.SMS] === PermissionState.GRANTED,
  };
};
