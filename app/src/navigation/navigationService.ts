import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './navigationTypes';

/**
 * Navigation Service
 * 
 * Provides functions to navigate outside of React components,
 * such as from Redux actions or API responses.
 */

// Create a navigation ref that can be used throughout the app
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate to a screen using the navigation service
 * 
 * @param name - The screen name to navigate to
 * @param params - The parameters to pass to the screen
 */
export function navigate(name: any, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.warn('Navigation attempted before navigator was ready');
  }
}

/**
 * Go back to the previous screen
 */
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  } else {
    console.warn('Cannot go back - no screens in history or navigator not ready');
  }
}

/**
 * Reset the navigation state to a new state
 * 
 * @param routeName - The route name to reset to 
 */
export function resetRoot(routeName: any) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({
      index: 0,
      routes: [{ name: routeName }],
    });
  } else {
    console.warn('Reset attempted before navigator was ready');
  }
}

export const NavigationService = {
  navigate,
  goBack,
  resetRoot,
  navigationRef,
}; 