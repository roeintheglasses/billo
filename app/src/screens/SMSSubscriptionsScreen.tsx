import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSMSPermissions } from '../contexts/PermissionsContext';
import { SMSService, SubscriptionSMSMessage } from '../services';
import { SubscriptionCard } from '../components/molecules/SubscriptionCard';
import { useTheme } from '../contexts/ThemeContext';
import { DeviceEventEmitter } from 'react-native';

/**
 * SMSSubscriptionsScreen Component
 * 
 * Displays subscriptions detected from SMS messages
 */
const SMSSubscriptionsScreen: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionSMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();
  const { colors } = theme;
  const { isSMSPermissionGranted, requestSMSPermission, showSMSPermissionExplanation } = useSMSPermissions();

  // Scan for subscriptions in SMS messages
  const scanForSubscriptions = async () => {
    if (!isSMSPermissionGranted) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const subscriptionsFound = await SMSService.scanForSubscriptions();
      setSubscriptions(subscriptionsFound);
    } catch (error) {
      console.error('Error scanning for subscriptions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Set up SMS listener when component mounts
  useEffect(() => {
    if (isSMSPermissionGranted) {
      // Set up listener for real-time SMS subscription detection
      const cleanup = SMSService.setupSMSListeners();
      
      // Scan for existing subscriptions
      scanForSubscriptions();
      
      // Listen for new subscription detections
      const newSubscriptionListener = DeviceEventEmitter.addListener(
        'subscriptionDetected',
        (smsData) => {
          // When a new subscription SMS is detected, refresh the list
          scanForSubscriptions();
        }
      );
      
      // Clean up listeners when component unmounts
      return () => {
        cleanup();
        newSubscriptionListener.remove();
      };
    } else {
      setIsLoading(false);
    }
  }, [isSMSPermissionGranted]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isSMSPermissionGranted) {
        scanForSubscriptions();
      }
    }, [isSMSPermissionGranted])
  );

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    scanForSubscriptions();
  };

  // Handle subscription selection
  const handleSubscriptionPress = (subscription: SubscriptionSMSMessage) => {
    // TODO: Navigate to subscription detail screen or add to tracked subscriptions
    console.log('Subscription selected:', subscription);
  };

  // Request SMS permissions if not granted
  const handleRequestPermission = async () => {
    const granted = await requestSMSPermission();
    if (granted) {
      scanForSubscriptions();
    }
  };

  // Show empty state when no subscriptions found
  const renderEmptyState = () => {
    if (!isSMSPermissionGranted) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            SMS Permission Required
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            To automatically detect subscriptions from your SMS messages, Billo needs permission to read your SMS messages.
          </Text>
          <View style={styles.buttonContainer}>
            <Text 
              style={[styles.permissionButton, { backgroundColor: colors.primary, color: colors.text.inverted }]}
              onPress={showSMSPermissionExplanation}
            >
              Grant Permission
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
          No Subscriptions Found
        </Text>
        <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
          We couldn't find any subscription-related messages in your SMS inbox. Subscription confirmations, receipts, and renewal notices will appear here.
        </Text>
      </View>
    );
  };

  // Render loading state
  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Scanning SMS messages...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <FlatList
        data={subscriptions}
        keyExtractor={item => item._id.toString()}
        renderItem={({ item }) => (
          <SubscriptionCard 
            subscription={item} 
            onPress={() => handleSubscriptionPress(item)}
          />
        )}
        contentContainerStyle={subscriptions.length === 0 ? { flex: 1 } : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 16,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default SMSSubscriptionsScreen; 