import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { Text } from '../../atoms/Text';

export type SubscriptionCycle = 'monthly' | 'annually' | 'quarterly' | 'weekly';

export interface SubscriptionCardDetailsProps {
  amount: number;
  cycle?: SubscriptionCycle;
  category?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Details component for SubscriptionCard
 *
 * @param {number} amount - The subscription amount
 * @param {string} cycle - The billing cycle (monthly, annually, etc.)
 * @param {string} category - The subscription category
 * @returns {React.ReactElement} A subscription card details component
 */
export const SubscriptionCardDetails: React.FC<SubscriptionCardDetailsProps> = ({
  amount,
  cycle = 'monthly',
  category,
  style,
  testID,
}) => {
  const { theme } = useTheme();

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Format cycle text
  const formatCycle = (cycleType: SubscriptionCycle) => {
    switch (cycleType) {
      case 'weekly':
        return '/week';
      case 'monthly':
        return '/month';
      case 'quarterly':
        return '/quarter';
      case 'annually':
        return '/year';
      default:
        return '/month';
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.priceContainer}>
        <Text variant="heading1" style={{ color: theme.colors.text.primary }}>
          {formatCurrency(amount)}
        </Text>
        <Text variant="body" style={[styles.cycle, { color: theme.colors.text.secondary }]}>
          {formatCycle(cycle)}
        </Text>
      </View>

      {category && (
        <View style={styles.categoryContainer}>
          <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
            {category}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cycle: {
    marginLeft: 4,
  },
  categoryContainer: {
    marginTop: 4,
  },
});

export default SubscriptionCardDetails;
