import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import { useTheme } from '../../contexts/ThemeContext';
import { SubscriptionSMSMessage } from '../../services/SMSService';
import { SubscriptionCard } from './SubscriptionCard/SubscriptionCard';
import { Ionicons } from '@expo/vector-icons';
import subscriptionService from '../../services/subscriptionService';
import { SubscriptionInsert } from '../../types/supabase';
import subscriptionMessageService from '../../services/subscriptionMessageService';
import { supabase } from '../../services/supabase';

interface BatchSubscriptionConfirmationProps {
  visible: boolean;
  onClose: () => void;
  subscriptions: SubscriptionSMSMessage[];
  onConfirm: () => void;
}

/**
 * BatchSubscriptionConfirmation Component
 *
 * A modal for batch confirming multiple subscription messages
 */
export const BatchSubscriptionConfirmation: React.FC<BatchSubscriptionConfirmationProps> = ({
  visible,
  onClose,
  subscriptions,
  onConfirm,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Toggle selection of a subscription
  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Select all subscriptions
  const selectAll = () => {
    if (selectedIds.length === subscriptions.length) {
      // If all are selected, deselect all
      setSelectedIds([]);
    } else {
      // Otherwise select all
      setSelectedIds(subscriptions.map(sub => sub._id));
    }
  };

  // Handle confirmation and saving of selected subscriptions
  const handleConfirm = async () => {
    if (selectedIds.length === 0) {
      Alert.alert(
        'No Subscriptions Selected',
        'Please select at least one subscription to confirm.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Get current user
      const { data: userData } = await supabase.auth.getSession();
      if (!userData?.session?.user) {
        throw new Error('User not authenticated');
      }

      const userId = userData.session.user.id;
      const results = [];

      // Process each selected subscription
      for (const id of selectedIds) {
        const subscription = subscriptions.find(sub => sub._id === id);
        if (!subscription) continue;

        // Create subscription data
        const subscriptionData: SubscriptionInsert = {
          user_id: userId,
          name: subscription.serviceName || 'Unknown Subscription',
          amount: subscription.price || 0,
          billing_cycle: subscription.billingCycle || 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          next_billing_date: subscription.nextBillingDate || null,
          source_type: 'sms',
          auto_detected: true,
        };

        // Save the subscription
        const savedSubscription = await subscriptionService.createSubscription(subscriptionData);

        // Link message to subscription
        await subscriptionMessageService.linkMessageToSubscription(
          subscription._id.toString(),
          savedSubscription.id
        );

        results.push(savedSubscription);
      }

      // Show success message
      Alert.alert(
        'Subscriptions Added',
        `Successfully added ${results.length} subscription${results.length !== 1 ? 's' : ''}.`,
        [{ text: 'OK', onPress: onConfirm }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save subscriptions');
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  // Render each subscription item
  const renderItem = ({ item }: { item: SubscriptionSMSMessage }) => {
    const isSelected = selectedIds.includes(item._id);

    return (
      <TouchableOpacity
        onPress={() => toggleSelection(item._id)}
        style={[styles.subscriptionItem, isSelected && { backgroundColor: colors.primary + '10' }]}
      >
        <View style={styles.selectionIndicator}>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color={isSelected ? colors.primary : colors.text.secondary}
          />
        </View>
        <View style={styles.subscriptionDetails}>
          <Text variant="heading3" style={styles.serviceName}>
            {item.serviceName || 'Unknown Service'}
          </Text>
          <Text variant="body">
            Amount: {item.price ? `${item.currency || '$'}${item.price}` : 'Unknown'}
          </Text>
          <Text variant="caption" style={{ color: colors.text.secondary }}>
            {item.billingCycle ? `Billing: ${item.billingCycle}` : ''}
            {item.confidence ? ` • ${item.confidence}% confidence` : ''}
          </Text>
          <Text variant="caption" style={styles.previewText} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Batch Confirm Subscriptions" size="large">
      <View style={styles.container}>
        <Text variant="body" style={styles.description}>
          Select the subscription messages you want to add to your subscription list.
        </Text>

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={selectAll} style={styles.selectAllButton}>
            <Ionicons
              name={selectedIds.length === subscriptions.length ? 'checkbox' : 'square-outline'}
              size={20}
              color={colors.primary}
            />
            <Text variant="body" style={{ color: colors.primary, marginLeft: 8 }}>
              {selectedIds.length === subscriptions.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <Text variant="caption" style={{ color: colors.text.secondary }}>
            {selectedIds.length} of {subscriptions.length} selected
          </Text>
        </View>

        <FlatList
          data={subscriptions}
          renderItem={renderItem}
          keyExtractor={item => item._id.toString()}
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.buttonsContainer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={onClose}
            style={styles.cancelButton}
            disabled={isLoading}
          />
          <Button
            title={isLoading ? 'Saving...' : 'Confirm Selected'}
            variant="primary"
            onPress={handleConfirm}
            style={styles.confirmButton}
            disabled={isLoading || selectedIds.length === 0}
          />
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    maxHeight: '90%',
  },
  description: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  listContainer: {
    maxHeight: 400,
  },
  listContent: {
    paddingBottom: 8,
  },
  subscriptionItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectionIndicator: {
    marginRight: 12,
    alignSelf: 'center',
  },
  subscriptionDetails: {
    flex: 1,
  },
  serviceName: {
    marginBottom: 4,
  },
  previewText: {
    marginTop: 8,
    opacity: 0.7,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
