import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Subscription } from '../../types/supabase';
import { Button } from '../atoms/Button';
import { useTheme } from '../../contexts/ThemeContext';
import subscriptionService from '../../services/subscriptionService';
import logger from '../../utils/logger';
import { formatCurrency } from '../../utils/formatUtils';
import { FeedbackModal } from './FeedbackModal';

interface DuplicateResolutionModalProps {
  visible: boolean;
  onClose: () => void;
  subscription: Subscription;
  duplicates: Subscription[];
  onResolved: (action: 'merged' | 'kept_both' | 'deleted_new' | 'deleted_existing') => void;
}

const DuplicateResolutionModal: React.FC<DuplicateResolutionModalProps> = ({
  visible,
  onClose,
  subscription,
  duplicates,
  onResolved,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState<boolean>(false);
  const duplicate = duplicates.length > 0 ? duplicates[0] : null;

  const handleMerge = async () => {
    if (!duplicate) return;

    setLoading(true);
    setSelectedAction('merge');

    try {
      // Merge the subscriptions
      await subscriptionService.mergeSubscriptions([subscription, duplicate]);

      onResolved('merged');
      onClose();
    } catch (error) {
      logger.error('Failed to merge subscriptions', error);
      Alert.alert('Error', 'Failed to merge subscriptions. Please try again.');
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  const handleKeepBoth = () => {
    onResolved('kept_both');
    onClose();
  };

  const handleDeleteNew = async () => {
    setLoading(true);
    setSelectedAction('delete_new');

    try {
      // Delete the new subscription
      await subscriptionService.deleteSubscription(subscription.id);

      onResolved('deleted_new');
      onClose();
    } catch (error) {
      logger.error('Failed to delete new subscription', error);
      Alert.alert('Error', 'Failed to delete subscription. Please try again.');
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  const handleDeleteExisting = async () => {
    if (!duplicate) return;

    setLoading(true);
    setSelectedAction('delete_existing');

    try {
      // Delete the existing subscription
      await subscriptionService.deleteSubscription(duplicate.id);

      onResolved('deleted_existing');
      onClose();
    } catch (error) {
      logger.error('Failed to delete existing subscription', error);
      Alert.alert('Error', 'Failed to delete subscription. Please try again.');
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  const handleFeedbackPress = () => {
    setFeedbackModalVisible(true);
  };

  const handleFeedbackSuccess = () => {
    Alert.alert('Thank You', 'Your feedback helps us improve our duplicate detection system.');
  };

  if (!duplicate) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.content, { backgroundColor: theme.colors.background.primary }]}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.text.primary, fontSize: theme.typography.fontSize.xl },
            ]}
            accessibilityLabel="Duplicate Subscription Detected"
          >
            Duplicate Subscription Detected
          </Text>

          <ScrollView style={styles.scrollView}>
            <Text
              style={[
                styles.description,
                { color: theme.colors.text.primary, fontSize: theme.typography.fontSize.md },
              ]}
            >
              We found a similar existing subscription. How would you like to proceed?
            </Text>

            <View style={styles.comparisonContainer}>
              <View
                style={[
                  styles.subscriptionCard,
                  { backgroundColor: theme.colors.background.secondary },
                ]}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    { color: theme.colors.primary, fontSize: theme.typography.fontSize.lg },
                  ]}
                  accessibilityLabel="New Subscription"
                >
                  New Subscription
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.primary }]}>
                    Name:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {subscription.name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.primary }]}>
                    Amount:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {formatCurrency(subscription.amount)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.primary }]}>
                    Billing:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {subscription.billing_cycle}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.primary }]}>
                    Start:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {new Date(subscription.start_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.tagContainer}>
                  <View style={[styles.tag, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                      {subscription.auto_detected ? 'Auto-detected' : 'Manually added'}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.subscriptionCard,
                  { backgroundColor: theme.colors.background.secondary },
                ]}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    { color: theme.colors.primary, fontSize: theme.typography.fontSize.lg },
                  ]}
                  accessibilityLabel="Existing Subscription"
                >
                  Existing Subscription
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.primary }]}>
                    Name:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {duplicate.name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.primary }]}>
                    Amount:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {formatCurrency(duplicate.amount)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.primary }]}>
                    Billing:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {duplicate.billing_cycle}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.primary }]}>
                    Start:
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {new Date(duplicate.start_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.tagContainer}>
                  <View
                    style={[
                      styles.tag,
                      {
                        backgroundColor: duplicate.auto_detected
                          ? theme.colors.primary + '20'
                          : theme.colors.warning + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        {
                          color: duplicate.auto_detected
                            ? theme.colors.primary
                            : theme.colors.warning,
                        },
                      ]}
                    >
                      {duplicate.auto_detected ? 'Auto-detected' : 'Manually added'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button
              title="Merge Subscriptions"
              onPress={handleMerge}
              disabled={loading && selectedAction === 'merge'}
              style={{ marginBottom: theme.spacing.sm }}
              accessibilityLabel="Merge these subscriptions"
            >
              {loading && selectedAction === 'merge' && (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.text.inverted}
                  style={styles.buttonLoader}
                />
              )}
            </Button>

            <Button
              title="Keep Both"
              onPress={handleKeepBoth}
              variant="secondary"
              disabled={loading}
              style={{ marginBottom: theme.spacing.sm }}
              accessibilityLabel="Keep both subscriptions"
            />

            <View style={styles.row}>
              <Button
                title="Delete New"
                onPress={handleDeleteNew}
                variant="outline"
                disabled={loading && selectedAction === 'delete_new'}
                style={{ flex: 1, marginRight: theme.spacing.xs }}
                accessibilityLabel="Delete new subscription"
              >
                {loading && selectedAction === 'delete_new' && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.text.inverted}
                    style={styles.buttonLoader}
                  />
                )}
              </Button>

              <Button
                title="Delete Existing"
                onPress={handleDeleteExisting}
                variant="outline"
                disabled={loading && selectedAction === 'delete_existing'}
                style={{ flex: 1, marginLeft: theme.spacing.xs }}
                accessibilityLabel="Delete existing subscription"
              >
                {loading && selectedAction === 'delete_existing' && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.text.inverted}
                    style={styles.buttonLoader}
                  />
                )}
              </Button>
            </View>

            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={handleFeedbackPress}
              disabled={loading}
              accessibilityLabel="Provide feedback on duplicate detection"
            >
              <Text style={[styles.feedbackText, { color: theme.colors.primary }]}>
                Was this duplicate correctly identified? Provide feedback
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={loading}
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        onSubmitSuccess={handleFeedbackSuccess}
        subscriptionId={subscription.id}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    marginBottom: 16,
  },
  comparisonContainer: {
    marginVertical: 16,
  },
  subscriptionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
  },
  actions: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
  },
  buttonLoader: {
    marginLeft: 8,
  },
  feedbackButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default DuplicateResolutionModal;
