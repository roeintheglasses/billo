import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Text } from '../components/atoms/Text';
import { Button } from '../components/atoms/Button';
import { useTheme } from '../contexts/ThemeContext';
import { useStorage } from '../contexts/StorageContext';
import { Subscription } from '../types/supabase';
import { formatDate } from '../utils/dateUtils';
import { BillingCycle } from '../services/subscriptionService';
import { TabParamList } from '../navigation/navigationTypes';

// Define the route params type
type DetailRouteParams = {
  SubscriptionDetail: {
    subscriptionId: string;
  };
};

/**
 * SubscriptionDetailScreen Component
 *
 * Displays detailed information about a subscription and provides
 * options to edit or delete the subscription.
 */
const SubscriptionDetailScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<DetailRouteParams, 'SubscriptionDetail'>>();
  const { deleteSubscription, getSubscriptionById } = useStorage();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscriptionId = route.params?.subscriptionId;

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!subscriptionId) {
          throw new Error('Subscription ID is missing');
        }

        const subscription = await getSubscriptionById(subscriptionId);
        if (!subscription) {
          throw new Error('Subscription not found');
        }

        setSubscription(subscription);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
        console.error('Error fetching subscription details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [subscriptionId, getSubscriptionById]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Subscription',
      'Are you sure you want to delete this subscription? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!subscription) return;

              await deleteSubscription(subscription.id);
              Alert.alert('Success', 'Subscription deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete subscription');
              console.error('Error deleting subscription:', error);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    // Navigate to the edit subscription screen
    if (subscription) {
      // Use any type to bypass type checking for now
      // Will be properly typed once the app structure is more established
      navigation.navigate('EditSubscription' as any, { subscriptionId: subscription.id });
    }
  };

  const calculateAnnualCost = (amount: number, billingCycle: string): number => {
    switch (billingCycle as BillingCycle) {
      case 'monthly':
        return amount * 12;
      case 'yearly':
        return amount;
      case 'weekly':
        return amount * 52;
      case 'quarterly':
        return amount * 4;
      case 'biannually':
        return amount * 2;
      default:
        return amount;
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (nextBillingDate: string | null): string => {
    if (!nextBillingDate) return theme.colors.text.secondary;

    const now = new Date();
    const nextBilling = new Date(nextBillingDate);

    if (nextBilling < now) {
      return theme.colors.error;
    }

    // Within 3 days
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    if (nextBilling.getTime() - now.getTime() < threeDaysMs) {
      return theme.colors.warning;
    }

    return theme.colors.success;
  };

  const getStatusText = (nextBillingDate: string | null): string => {
    if (!nextBillingDate) return 'Unknown';

    const now = new Date();
    const nextBilling = new Date(nextBillingDate);

    if (nextBilling < now) {
      return 'Overdue';
    }

    return 'Active';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !subscription) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text variant="body" style={{ color: theme.colors.error }}>
          {error || 'Subscription not found'}
        </Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const statusColor = getStatusColor(subscription.next_billing_date);
  const statusText = getStatusText(subscription.next_billing_date);
  const annualCost = calculateAnnualCost(subscription.amount, subscription.billing_cycle);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="heading1" style={styles.title}>
          {subscription.name}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Status Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <View style={styles.statusContainer}>
            <Text variant="body" style={styles.sectionTitle}>
              Status
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text variant="caption" style={styles.statusText}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Info Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <Text variant="body" style={styles.sectionTitle}>
            Key Information
          </Text>

          <View style={styles.infoRow}>
            <Text variant="body" style={styles.infoLabel}>
              Monthly Cost:
            </Text>
            <Text variant="heading3" style={styles.infoValue}>
              {formatCurrency(subscription.amount)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="body" style={styles.infoLabel}>
              Billing Cycle:
            </Text>
            <Text variant="body" style={styles.infoValue}>
              {subscription.billing_cycle.charAt(0).toUpperCase() +
                subscription.billing_cycle.slice(1)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="body" style={styles.infoLabel}>
              Next Payment:
            </Text>
            <Text variant="body" style={[styles.infoValue, { color: statusColor }]}>
              {subscription.next_billing_date
                ? formatDate(new Date(subscription.next_billing_date))
                : 'Not scheduled'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="body" style={styles.infoLabel}>
              Annual Cost:
            </Text>
            <Text variant="heading3" style={styles.infoValue}>
              {formatCurrency(annualCost)}
            </Text>
          </View>
        </View>

        {/* Category Card - This would be more detailed in a future implementation */}
        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <Text variant="body" style={styles.sectionTitle}>
            Category
          </Text>
          <View style={styles.categoryRow}>
            <Ionicons name="apps" size={24} color={theme.colors.primary} />
            <Text variant="body" style={styles.categoryText}>
              {subscription.category_id || 'Uncategorized'}
            </Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <Text variant="body" style={styles.sectionTitle}>
            Details
          </Text>

          <View style={styles.infoRow}>
            <Text variant="body" style={styles.infoLabel}>
              Start Date:
            </Text>
            <Text variant="body" style={styles.infoValue}>
              {formatDate(new Date(subscription.start_date))}
            </Text>
          </View>

          {subscription.notes && (
            <View style={styles.notesContainer}>
              <Text variant="body" style={styles.infoLabel}>
                Notes:
              </Text>
              <Text variant="body" style={styles.notesText}>
                {subscription.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Payment History Card - Placeholder for future implementation */}
        <View style={[styles.card, { backgroundColor: theme.colors.background.secondary }]}>
          <Text variant="body" style={styles.sectionTitle}>
            Payment History
          </Text>
          <Text variant="body" style={styles.placeholderText}>
            Payment history will be available in a future update.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.actionButton}>
            <Button title="Edit" onPress={handleEdit} />
          </View>
          <View style={styles.actionButton}>
            <Button title="Delete" onPress={handleDelete} variant="secondary" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    opacity: 0.7,
  },
  infoValue: {
    fontWeight: 'bold',
  },
  notesContainer: {
    marginTop: 12,
  },
  notesText: {
    marginTop: 4,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  placeholderText: {
    fontStyle: 'italic',
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default SubscriptionDetailScreen;
