import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SubscriptionSMSMessage } from '../../services/SMSService';

interface SubscriptionCardProps {
  subscription: SubscriptionSMSMessage;
  onPress?: () => void;
}

/**
 * SubscriptionCard Component
 *
 * Displays detected subscription information from SMS
 */
export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, onPress }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Format price with currency symbol
  const formatPrice = (price?: number) => {
    if (price === undefined) return '';
    return `$${price.toFixed(2)}`;
  };

  // Get the subscription name, using the extracted serviceName if available
  const getSubscriptionName = () => {
    if (subscription.serviceName) {
      return subscription.serviceName;
    }

    const sender = subscription.address || '';
    // Try to extract a more readable name from the sender
    if (sender.match(/^[a-zA-Z]+$/)) {
      return sender;
    }

    // Try to find a potential subscription name in the body
    const bodyWords = subscription.body.split(' ');
    const potentialNames = bodyWords.filter(
      word => word.length > 3 && !word.match(/subscription|payment|receipt|confirm/i)
    );

    if (potentialNames.length > 0) {
      return potentialNames[0];
    }

    return sender;
  };

  const subscriptionName = getSubscriptionName();
  const price = subscription.price;
  const priceText = price !== undefined ? formatPrice(price) : '';

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="card-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.subscriptionName, { color: colors.text.primary }]}>
              {subscriptionName}
            </Text>
            {priceText ? (
              <Text style={[styles.price, { color: colors.text.primary }]}>{priceText}</Text>
            ) : null}
          </View>
          <Text style={[styles.date, { color: colors.text.secondary }]}>
            Detected on {formatDate(subscription.date)}
          </Text>
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[styles.body, { color: colors.text.secondary }]}
          >
            {subscription.body}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={24}
          color={colors.text.primary}
          style={styles.arrow}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  date: {
    fontSize: 12,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
  },
  arrow: {
    marginLeft: 8,
  },
});
