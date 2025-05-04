import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { UpcomingPaymentsList } from '../../atoms/visualization/UpcomingPaymentsList';
import { SubscriptionWithCategory } from '../../../types/supabase';
import subscriptionService from '../../../services/subscriptionService';
import { useNavigation } from '@react-navigation/native';
import { TabParamList } from '../../../navigation/navigationTypes';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export interface UpcomingPaymentsSectionProps {
  /**
   * Number of days to look ahead for upcoming payments
   */
  daysAhead?: number;

  /**
   * Maximum number of items to display
   */
  maxItems?: number;

  /**
   * Title for the section
   */
  title?: string;
}

/**
 * UpcomingPaymentsSection component
 *
 * A dashboard section that displays upcoming subscription payments
 * for the next few days. Fetches data from the subscription service
 * and allows navigation to subscription details.
 */
export const UpcomingPaymentsSection: React.FC<UpcomingPaymentsSectionProps> = ({
  daysAhead = 7,
  maxItems = 3,
  title = 'Upcoming Payments',
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<SubscriptionWithCategory[]>(
    []
  );

  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();

  useEffect(() => {
    const fetchUpcomingSubscriptions = async () => {
      try {
        setLoading(true);
        const data = await subscriptionService.getUpcomingSubscriptions(daysAhead);
        setUpcomingSubscriptions(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch upcoming subscriptions:', err);
        setError('Failed to load upcoming payments');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingSubscriptions();
  }, [daysAhead]);

  const handleSubscriptionPress = (subscription: SubscriptionWithCategory) => {
    // Navigate to subscription details screen
    navigation.navigate('SubscriptionDetail', { subscriptionId: subscription.id });
  };

  const handleViewAllPress = () => {
    // Navigate to subscriptions list filtered by upcoming
    navigation.navigate('Subscriptions');
  };

  return (
    <View style={styles.container}>
      <UpcomingPaymentsList
        subscriptions={upcomingSubscriptions}
        loading={loading}
        error={error}
        title={title}
        maxItems={maxItems}
        onSubscriptionPress={handleSubscriptionPress}
        onViewAllPress={handleViewAllPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default UpcomingPaymentsSection;
