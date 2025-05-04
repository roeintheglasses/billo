/**
 * Permission types for the application
 */

/**
 * Enum representing the state of a permission
 */
export enum PermissionState {
  NOT_REQUESTED = 'NOT_REQUESTED',
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  DENIED_PERMANENTLY = 'DENIED_PERMANENTLY',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

/**
 * Permission types supported by the application
 */
export enum PermissionType {
  SMS = 'SMS',
  CAMERA = 'CAMERA',
}

/**
 * Permission context state interface
 */
export interface PermissionsContextState {
  [PermissionType.SMS]: PermissionState;
  [PermissionType.CAMERA]: PermissionState;
}

/**
 * Permission request result
 */
export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
} 