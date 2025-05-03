import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  StyleProp, 
  TouchableOpacity,
  TouchableOpacityProps
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { Card } from '../../atoms/Card';
import { SubscriptionCardHeader } from './SubscriptionCardHeader';
import { SubscriptionCardDetails } from './SubscriptionCardDetails';
import { SubscriptionCardActions } from './SubscriptionCardActions';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { Text } from '../../atoms/Text';

export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'trial' | 'canceled';

export interface SubscriptionCardProps extends TouchableOpacityProps {
  status: SubscriptionStatus;
  renewalDate?: string;
  children: React.ReactNode;
  variant?: 'default' | 'compact';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A card component for displaying subscription information
 * 
 * @param {SubscriptionStatus} status - The subscription status (active, pending, expired, trial, canceled)
 * @param {string} renewalDate - The date the subscription will renew
 * @param {ReactNode} children - The card content (typically SubscriptionCard.Header, SubscriptionCard.Details, etc.)
 * @param {string} variant - Card display variant (default or compact)
 * @param {function} onPress - Function to call when card is pressed
 * @returns {React.ReactElement} A subscription card component
 * 
 * @example
 * // Basic usage
 * <SubscriptionCard status="active" renewalDate="2025-05-15">
 *   <SubscriptionCard.Header title="Netflix" iconUrl="https://example.com/netflix.png" />
 *   <SubscriptionCard.Details amount={14.99} cycle="monthly" category="Entertainment" />
 *   <SubscriptionCard.Actions />
 * </SubscriptionCard>
 * 
 * // Compact variant
 * <SubscriptionCard status="trial" variant="compact">
 *   <SubscriptionCard.Header title="Spotify" />
 *   <SubscriptionCard.Details amount={9.99} cycle="monthly" />
 * </SubscriptionCard>
 */
export const SubscriptionCard: React.FC<SubscriptionCardProps> & {
  Header: typeof SubscriptionCardHeader;
  Details: typeof SubscriptionCardDetails;
  Actions: typeof SubscriptionCardActions;
  StatusBadge: typeof SubscriptionStatusBadge;
} = ({
  status,
  renewalDate,
  children,
  variant = 'default',
  onPress,
  style,
  testID,
  ...rest
}) => {
  const { theme } = useTheme();
  const isCompact = variant === 'compact';

  // Format renewal date if provided
  const formatRenewalDate = (date: string) => {
    if (!date) return '';
    const parsedDate = new Date(date);
    return parsedDate.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Determine if this is soon (within 7 days)
  const isRenewalSoon = () => {
    if (!renewalDate) return false;
    const renewalTime = new Date(renewalDate).getTime();
    const now = new Date().getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    return renewalTime - now <= sevenDays && renewalTime >= now;
  };

  const renderContent = () => (
    <View style={[
      styles.container,
      isCompact && styles.compactContainer,
    ]}>
      {/* Status badge (shown in the corner) */}
      <View style={styles.badgeContainer}>
        <SubscriptionStatusBadge status={status} />
      </View>

      {/* Renewal banner (only shown if renewal is soon and active) */}
      {status === 'active' && renewalDate && isRenewalSoon() && (
        <View style={[
          styles.renewalBanner,
          { backgroundColor: theme.colors.primary }
        ]}>
          <Text 
            variant="caption" 
            style={{ color: theme.colors.text.inverted }}
          >
            Renews {formatRenewalDate(renewalDate)}
          </Text>
        </View>
      )}

      {/* Main content */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );

  // If onPress is provided, wrap in a TouchableOpacity
  if (onPress) {
    return (
      <Card 
        style={[styles.card, style]}
        variant="elevated"
        testID={testID}
      >
        <TouchableOpacity 
          onPress={onPress}
          activeOpacity={0.7}
          {...rest}
        >
          {renderContent()}
        </TouchableOpacity>
      </Card>
    );
  }

  // Otherwise, render as a static card
  return (
    <Card 
      style={[styles.card, style]}
      variant="elevated"
      testID={testID}
    >
      {renderContent()}
    </Card>
  );
};

// Attach child components
SubscriptionCard.Header = SubscriptionCardHeader;
SubscriptionCard.Details = SubscriptionCardDetails;
SubscriptionCard.Actions = SubscriptionCardActions;
SubscriptionCard.StatusBadge = SubscriptionStatusBadge;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
  },
  container: {
    padding: 16,
    position: 'relative',
  },
  compactContainer: {
    padding: 12,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  contentContainer: {
    marginTop: 4,
  },
  renewalBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SubscriptionCard; 