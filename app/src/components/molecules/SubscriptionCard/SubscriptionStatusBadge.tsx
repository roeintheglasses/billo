import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { Text } from '../../atoms/Text';
import { SubscriptionStatus } from './SubscriptionCard';

export interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Status badge component for SubscriptionCard
 *
 * @param {SubscriptionStatus} status - The subscription status
 * @param {string} size - Size of the badge
 * @returns {React.ReactElement} A subscription status badge component
 */
export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({
  status,
  size = 'small',
  style,
  testID,
}) => {
  const { theme } = useTheme();

  // Get status color and text
  const getStatusConfig = (): { color: string; text: string } => {
    switch (status) {
      case 'active':
        return {
          color: theme.colors.success || '#28a745', // Fallback color if theme doesn't have success
          text: 'Active',
        };
      case 'pending':
        return {
          color: theme.colors.warning || '#ffc107', // Fallback color if theme doesn't have warning
          text: 'Pending',
        };
      case 'expired':
        return {
          color: theme.colors.error || '#dc3545', // Fallback color if theme doesn't have error
          text: 'Expired',
        };
      case 'trial':
        return {
          color: theme.colors.primary,
          text: 'Trial',
        };
      case 'canceled':
        return {
          color: theme.colors.error || '#dc3545', // Fallback color if theme doesn't have error
          text: 'Canceled',
        };
      default:
        return {
          color: theme.colors.border.medium,
          text: 'Unknown',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: statusConfig.color,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 6 : 10,
        },
        style,
      ]}
      testID={testID}
    >
      <Text
        variant="caption"
        style={[
          styles.text,
          {
            color: '#FFFFFF', // White text on colored background
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {statusConfig.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: 'bold',
  },
});

export default SubscriptionStatusBadge;
