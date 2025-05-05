/**
 * Deep Link Service
 *
 * Manages deep link handling and generation for the application.
 * - Parses incoming deep links from URI schemes and notification links
 * - Generates deep links for different app sections
 * - Provides navigation based on deep links
 */

import { Linking } from 'react-native';
import { NavigationService } from '../navigation/navigationService';
import * as Notifications from 'expo-notifications';

// App URI scheme - should match what's defined in app.json
export const APP_SCHEME = 'billo';

// Deep link types supported by the app
export enum DeepLinkType {
  SUBSCRIPTION = 'subscription',
  PAYMENT = 'payment',
  NOTIFICATION = 'notification',
  SETTINGS = 'settings',
  CATEGORY = 'category',
}

// Deep link pattern definitions
export const DEEP_LINK_PATTERNS = {
  SUBSCRIPTION: `${APP_SCHEME}://subscriptions/:id`,
  PAYMENT: `${APP_SCHEME}://payments/:id`,
  NOTIFICATIONS: `${APP_SCHEME}://notifications`,
  SETTINGS: `${APP_SCHEME}://settings`,
  CATEGORIES: `${APP_SCHEME}://categories`,
};

/**
 * Parse a deep link URL and return structured data
 */
export const parseDeepLink = (
  url: string
): { type: DeepLinkType; id?: string; params?: any } | null => {
  try {
    // Check for URL protocol
    if (!url) return null;

    const parsed = new URL(url);
    const pathSegments = parsed.pathname.split('/').filter(Boolean);

    // Handle different path patterns
    if (parsed.protocol === `${APP_SCHEME}:`) {
      // Extract host (main section) and pathSegments (params)
      const host = parsed.hostname;

      switch (host) {
        case 'subscriptions':
          return {
            type: DeepLinkType.SUBSCRIPTION,
            id: pathSegments[0],
          };
        case 'payments':
          return {
            type: DeepLinkType.PAYMENT,
            id: pathSegments[0],
          };
        case 'notifications':
          return {
            type: DeepLinkType.NOTIFICATION,
          };
        case 'settings':
          return {
            type: DeepLinkType.SETTINGS,
          };
        case 'categories':
          return {
            type: DeepLinkType.CATEGORY,
          };
        default:
          return null;
      }
    } else if (url.startsWith('/')) {
      // Handle internal paths (from notifications)
      if (url.startsWith('/subscriptions/')) {
        const id = url.split('/subscriptions/')[1];
        return {
          type: DeepLinkType.SUBSCRIPTION,
          id,
        };
      } else if (url.startsWith('/payments/')) {
        const id = url.split('/payments/')[1];
        return {
          type: DeepLinkType.PAYMENT,
          id,
        };
      } else if (url === '/notifications') {
        return {
          type: DeepLinkType.NOTIFICATION,
        };
      } else if (url === '/settings') {
        return {
          type: DeepLinkType.SETTINGS,
        };
      } else if (url === '/categories') {
        return {
          type: DeepLinkType.CATEGORY,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

/**
 * Create a deep link for a specific resource
 */
export const createDeepLink = (type: DeepLinkType, id?: string): string => {
  switch (type) {
    case DeepLinkType.SUBSCRIPTION:
      return id ? `${APP_SCHEME}://subscriptions/${id}` : `${APP_SCHEME}://subscriptions`;
    case DeepLinkType.PAYMENT:
      return id ? `${APP_SCHEME}://payments/${id}` : `${APP_SCHEME}://payments`;
    case DeepLinkType.NOTIFICATION:
      return `${APP_SCHEME}://notifications`;
    case DeepLinkType.SETTINGS:
      return `${APP_SCHEME}://settings`;
    case DeepLinkType.CATEGORY:
      return `${APP_SCHEME}://categories`;
    default:
      return `${APP_SCHEME}://`;
  }
};

/**
 * Create an internal link path for use in notifications
 * These don't include the app scheme as they're used within the app
 */
export const createInternalLink = (type: DeepLinkType, id?: string): string => {
  switch (type) {
    case DeepLinkType.SUBSCRIPTION:
      return id ? `/subscriptions/${id}` : '/subscriptions';
    case DeepLinkType.PAYMENT:
      return id ? `/payments/${id}` : '/payments';
    case DeepLinkType.NOTIFICATION:
      return '/notifications';
    case DeepLinkType.SETTINGS:
      return '/settings';
    case DeepLinkType.CATEGORY:
      return '/categories';
    default:
      return '/';
  }
};

/**
 * Handle a deep link URL by parsing and navigating to the appropriate screen
 */
export const handleDeepLink = (url: string): boolean => {
  const parsedLink = parseDeepLink(url);

  if (!parsedLink) return false;

  // Navigate based on the link type
  switch (parsedLink.type) {
    case DeepLinkType.SUBSCRIPTION:
      if (parsedLink.id) {
        NavigationService.navigate('SubscriptionDetail', { subscriptionId: parsedLink.id });
      } else {
        NavigationService.navigate('Subscriptions');
      }
      return true;

    case DeepLinkType.PAYMENT:
      if (parsedLink.id) {
        // Navigate to payment detail when implemented
        console.log(`Should navigate to payment detail for ID: ${parsedLink.id}`);
      } else {
        // Navigate to payments list when implemented
        console.log('Should navigate to payments list');
      }
      return true;

    case DeepLinkType.NOTIFICATION:
      NavigationService.navigate('NotificationCenter');
      return true;

    case DeepLinkType.SETTINGS:
      NavigationService.navigate('Settings');
      return true;

    case DeepLinkType.CATEGORY:
      NavigationService.navigate('CategoryManagement');
      return true;

    default:
      return false;
  }
};

/**
 * Handle a notification response (when user taps notification)
 */
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse
): boolean => {
  const { notification } = response;
  const data = notification.request.content.data as Record<string, any>;

  // First check for explicit deep link in notification data
  if (data?.deepLink) {
    return handleDeepLink(data.deepLink);
  }

  // Then check for related entity
  if (data?.relatedEntityType && data?.relatedEntityId) {
    switch (data.relatedEntityType) {
      case 'subscription':
        NavigationService.navigate('SubscriptionDetail', { subscriptionId: data.relatedEntityId });
        return true;
      case 'payment':
        // Navigate to payment detail when implemented
        console.log(`Should navigate to payment detail for ID: ${data.relatedEntityId}`);
        return true;
      default:
        NavigationService.navigate('NotificationCenter');
        return true;
    }
  }

  // Default to notification center
  NavigationService.navigate('NotificationCenter');
  return true;
};

/**
 * Initialize deep linking
 * Sets up URL and initial URL listeners
 */
export const initializeDeepLinks = (): void => {
  // Handle incoming links when app is already running
  const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
    if (url) {
      handleDeepLink(url);
    }
  });

  // Check for initial URL used to launch the app
  Linking.getInitialURL()
    .then(url => {
      if (url) {
        handleDeepLink(url);
      }
    })
    .catch(err => {
      console.error('Error getting initial URL:', err);
    });
};

export const DeepLinkService = {
  parseDeepLink,
  createDeepLink,
  createInternalLink,
  handleDeepLink,
  handleNotificationResponse,
  initializeDeepLinks,
};

export default DeepLinkService;
