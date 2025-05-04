import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SubscriptionWithCategory } from '../../../types/supabase';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatCurrency } from '../../../utils/formatUtils';
import { formatDate } from '../../../utils/dateUtils';

export interface UpcomingPaymentsListProps {
  /**
   * Array of subscriptions with payment due dates
   */
  subscriptions: SubscriptionWithCategory[];
  
  /**
   * Loading state for the data
   */
  loading?: boolean;
  
  /**
   * Error message if data fetch failed
   */
  error?: string | null;
  
  /**
   * Title for the component
   */
  title?: string;
  
  /**
   * Maximum number of items to display
   */
  maxItems?: number;
  
  /**
   * Callback when a subscription is pressed
   */
  onSubscriptionPress?: (subscription: SubscriptionWithCategory) => void;
  
  /**
   * Callback when "View All" button is pressed
   */
  onViewAllPress?: () => void;
}

/**
 * UpcomingPaymentsList component
 * 
 * Displays a list of upcoming subscription payments with their due dates
 * and amounts. Provides options for interaction and a "View All" button
 * for viewing more items.
 */
export const UpcomingPaymentsList: React.FC<UpcomingPaymentsListProps> = ({
  subscriptions,
  loading = false,
  error = null,
  title = 'Upcoming Payments',
  maxItems = 3,
  onSubscriptionPress,
  onViewAllPress,
}) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  
  // Display items up to the maximum specified
  const displayItems = subscriptions.slice(0, maxItems);
  const hasMoreItems = subscriptions.length > maxItems;
  
  // Handle empty state
  if (!loading && subscriptions.length === 0 && !error) {
    return (
      <View 
        style={[
          styles.container, 
          { 
            backgroundColor: colors.background.secondary, 
            borderColor: colors.border.light
          }
        ]}
      >
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {title}
        </Text>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No upcoming payments
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
            You have no payments due soon
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background.secondary, 
          borderColor: colors.border.light
        }
      ]}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading upcoming payments...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.listContainer}>
            {displayItems.map((subscription) => (
              <TouchableOpacity
                key={subscription.id}
                style={[styles.paymentItem, { borderBottomColor: colors.border.light }]}
                onPress={() => onSubscriptionPress && onSubscriptionPress(subscription)}
              >
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentName, { color: colors.text.primary }]}>
                    {subscription.name}
                  </Text>
                  {subscription.category && (
                    <View 
                      style={[
                        styles.categoryTag, 
                        { 
                          backgroundColor: subscription.category.color || colors.primary,
                          opacity: 0.8 
                        }
                      ]}
                    >
                      <Text style={styles.categoryText}>
                        {subscription.category.name}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.paymentDetails}>
                  <Text style={[styles.paymentDate, { color: colors.text.secondary }]}>
                    {subscription.next_billing_date ? formatDate(new Date(subscription.next_billing_date)) : 'N/A'}
                  </Text>
                  <Text style={[styles.paymentAmount, { color: colors.primary }]}>
                    {formatCurrency(subscription.amount)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {hasMoreItems && (
            <TouchableOpacity
              style={[styles.viewAllButton, { borderColor: colors.primary }]}
              onPress={onViewAllPress}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View All ({subscriptions.length})
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    marginBottom: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  paymentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  paymentName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  categoryText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  paymentDetails: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  paymentDate: {
    fontSize: 13,
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  viewAllButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
}); 