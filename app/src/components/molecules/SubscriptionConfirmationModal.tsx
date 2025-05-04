import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import { FormInput } from '../FormInput';
import { useTheme } from '../../contexts/ThemeContext';
import { SubscriptionSMSMessage } from '../../services/SMSService';
import subscriptionService, {
  BillingCycle,
  BILLING_CYCLES,
} from '../../services/subscriptionService';
import { formatCurrency } from '../../utils/formatUtils';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionInsert } from '../../types/supabase';
import subscriptionMessageService from '../../services/subscriptionMessageService';
import { supabase } from '../../services/supabase';
import feedbackService, { FeedbackType } from '../../services/feedbackService';

// Validation schema for subscription form
const validationSchema = Yup.object().shape({
  serviceName: Yup.string().required('Service name is required'),
  amount: Yup.number()
    .typeError('Amount must be a number')
    .positive('Amount must be positive')
    .required('Amount is required'),
  billingCycle: Yup.string()
    .oneOf(BILLING_CYCLES, 'Invalid billing cycle')
    .required('Billing cycle is required'),
  startDate: Yup.date().typeError('Invalid date format').required('Start date is required'),
  currency: Yup.string().required('Currency is required'),
});

interface SubscriptionConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  subscription: SubscriptionSMSMessage | null;
  onConfirm: () => void;
}

/**
 * SubscriptionConfirmationModal Component
 *
 * A modal for confirming subscription details detected from SMS
 * Allows users to edit details before saving
 */
export const SubscriptionConfirmationModal: React.FC<SubscriptionConfirmationModalProps> = ({
  visible,
  onClose,
  subscription,
  onConfirm,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.GENERAL_FEEDBACK);

  // Generate initial form values from the detected subscription
  const getInitialValues = () => {
    if (!subscription) {
      return {
        serviceName: '',
        amount: '',
        billingCycle: 'monthly' as BillingCycle,
        startDate: new Date().toISOString().split('T')[0],
        currency: 'USD',
      };
    }

    return {
      serviceName: subscription.serviceName || '',
      amount: subscription.price?.toString() || '',
      billingCycle: (subscription.billingCycle || 'monthly') as BillingCycle,
      startDate: new Date().toISOString().split('T')[0],
      currency: subscription.currency || 'USD',
      nextBillingDate: subscription.nextBillingDate || undefined,
    };
  };

  // Get confidence level style based on confidence score
  const getConfidenceStyle = (confidence?: number) => {
    if (!confidence) return {};

    if (confidence >= 85) {
      return { backgroundColor: colors.success + '20' }; // 20% opacity
    } else if (confidence >= 60) {
      return { backgroundColor: colors.warning + '20' };
    } else {
      return { backgroundColor: colors.error + '20' };
    }
  };

  // Display confidence indicator
  const renderConfidenceIndicator = (confidence?: number) => {
    if (!confidence) return null;

    let icon;
    let color: string;

    if (confidence >= 85) {
      icon = 'checkmark-circle';
      color = colors.success;
    } else if (confidence >= 60) {
      icon = 'alert-circle';
      color = colors.warning;
    } else {
      icon = 'warning';
      color = colors.error;
    }

    return (
      <View style={styles.confidenceIndicator}>
        <Ionicons name={icon as any} size={16} color={color} />
        <Text variant="caption" style={{ color }}>
          {confidence}% confidence
        </Text>
      </View>
    );
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    if (!subscription) return;

    setIsLoading(true);

    try {
      // Get current user
      const { data: userData } = await supabase.auth.getSession();
      if (!userData?.session?.user) {
        throw new Error('User not authenticated');
      }

      // Prepare subscription data
      const subscriptionData: SubscriptionInsert = {
        user_id: userData.session.user.id,
        name: values.serviceName,
        amount: parseFloat(values.amount),
        billing_cycle: values.billingCycle,
        start_date: values.startDate,
        next_billing_date: values.nextBillingDate || null,
        source_type: 'sms',
        auto_detected: true,
      };

      // Create subscription
      const savedSubscription = await subscriptionService.createSubscription(subscriptionData);

      // Link message to subscription if we have the SMS ID
      if (subscription._id) {
        await subscriptionMessageService.linkMessageToSubscription(
          subscription._id.toString(),
          savedSubscription.id
        );
      }

      // Submit feedback if provided
      if (showFeedbackInput && feedbackText.trim()) {
        try {
          await feedbackService.submitSubscriptionFeedback(
            savedSubscription.id,
            feedbackType,
            feedbackText,
            // Pass confidence as a rating if available
            subscription.confidence ? Math.ceil(subscription.confidence / 20) : undefined // Convert 0-100 to 1-5 scale
          );
        } catch (feedbackError) {
          // Don't fail the whole operation if feedback submission fails
          console.error('Error submitting feedback:', feedbackError);
        }
      }

      // Success feedback
      Alert.alert(
        'Subscription Added',
        `${values.serviceName} has been added to your subscriptions.`,
        [{ text: 'OK', onPress: onConfirm }]
      );
    } catch (error) {
      // Error feedback
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save subscription');
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  // Render select options for billing cycle
  const renderBillingCycleOptions = (setFieldValue: any, billingCycle: string) => {
    return (
      <View style={styles.billingCycleOptions}>
        {BILLING_CYCLES.map(cycle => (
          <TouchableOpacity
            key={cycle}
            style={[
              styles.cycleOption,
              billingCycle === cycle && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setFieldValue('billingCycle', cycle)}
          >
            <Text
              variant="body"
              style={[
                styles.cycleText,
                billingCycle === cycle && {
                  color: colors.text.inverted,
                },
              ]}
            >
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Reject subscription handler
  const handleReject = () => {
    Alert.alert('Reject Subscription', 'Are you sure you want to ignore this subscription?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          // TODO: Mark SMS as processed but rejected
          onClose();
          onConfirm();
        },
      },
    ]);
  };

  // Render feedback options
  const renderFeedbackSection = () => {
    if (!showFeedbackInput) {
      return (
        <TouchableOpacity
          style={[
            styles.feedbackButton,
            { backgroundColor: colors.background.secondary, borderColor: colors.border.light },
          ]}
          onPress={() => setShowFeedbackInput(true)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
          <Text variant="body" style={{ color: colors.primary, marginLeft: 8 }}>
            Provide feedback on detection accuracy
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.feedbackSection}>
        <Text variant="label" style={{ color: colors.text.secondary, marginBottom: 8 }}>
          Help us improve
        </Text>

        <View style={styles.feedbackTypeContainer}>
          <TouchableOpacity
            style={[
              styles.feedbackTypeButton,
              {
                backgroundColor:
                  feedbackType === FeedbackType.GENERAL_FEEDBACK
                    ? colors.primary
                    : colors.background.secondary,
                borderColor: colors.border.light,
              },
            ]}
            onPress={() => setFeedbackType(FeedbackType.GENERAL_FEEDBACK)}
          >
            <Text
              variant="caption"
              style={{
                color:
                  feedbackType === FeedbackType.GENERAL_FEEDBACK
                    ? colors.text.inverted
                    : colors.text.primary,
              }}
            >
              General
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedbackTypeButton,
              {
                backgroundColor:
                  feedbackType === FeedbackType.INCORRECT_SERVICE
                    ? colors.primary
                    : colors.background.secondary,
                borderColor: colors.border.light,
              },
            ]}
            onPress={() => setFeedbackType(FeedbackType.INCORRECT_SERVICE)}
          >
            <Text
              variant="caption"
              style={{
                color:
                  feedbackType === FeedbackType.INCORRECT_SERVICE
                    ? colors.text.inverted
                    : colors.text.primary,
              }}
            >
              Wrong Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedbackTypeButton,
              {
                backgroundColor:
                  feedbackType === FeedbackType.INCORRECT_AMOUNT
                    ? colors.primary
                    : colors.background.secondary,
                borderColor: colors.border.light,
              },
            ]}
            onPress={() => setFeedbackType(FeedbackType.INCORRECT_AMOUNT)}
          >
            <Text
              variant="caption"
              style={{
                color:
                  feedbackType === FeedbackType.INCORRECT_AMOUNT
                    ? colors.text.inverted
                    : colors.text.primary,
              }}
            >
              Wrong Amount
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.feedbackInput,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.light,
              color: colors.text.primary,
            },
          ]}
          placeholder="What could be improved? (optional)"
          placeholderTextColor={colors.text.tertiary}
          value={feedbackText}
          onChangeText={setFeedbackText}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={styles.cancelFeedbackButton}
          onPress={() => {
            setShowFeedbackInput(false);
            setFeedbackText('');
          }}
        >
          <Text variant="caption" style={{ color: colors.text.secondary }}>
            Cancel feedback
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!subscription) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="Confirm Subscription" size="large">
      <View style={styles.container}>
        <Text variant="body" style={styles.description}>
          We detected a subscription in your SMS messages. Please review and confirm the details
          before adding it to your subscriptions.
        </Text>

        <View style={styles.smsPreview}>
          <Text variant="caption" style={{ color: colors.text.secondary }}>
            From: {subscription.address}
          </Text>
          <Text variant="caption" style={{ color: colors.text.secondary }}>
            {new Date(subscription.date).toLocaleString()}
          </Text>
          <Text variant="body" style={styles.messageBody}>
            {subscription.body}
          </Text>
        </View>

        <Formik
          initialValues={getInitialValues()}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleSubmit, setFieldValue }) => (
            <View style={styles.form}>
              <View style={[styles.fieldContainer, getConfidenceStyle(subscription.confidence)]}>
                <FormInput
                  label="Service Name"
                  value={values.serviceName}
                  onChangeText={handleChange('serviceName')}
                  error={errors.serviceName}
                  touched={touched.serviceName}
                  autoCapitalize="words"
                />
                {renderConfidenceIndicator(subscription.confidence)}
              </View>

              <View style={[styles.fieldContainer, getConfidenceStyle(subscription.confidence)]}>
                <FormInput
                  label="Amount"
                  value={values.amount}
                  onChangeText={handleChange('amount')}
                  error={errors.amount}
                  touched={touched.amount}
                  keyboardType="decimal-pad"
                />
                {renderConfidenceIndicator(subscription.confidence)}
              </View>

              <View style={styles.fieldContainer}>
                <Text variant="label" style={{ color: colors.text.secondary, marginBottom: 8 }}>
                  Billing Cycle
                </Text>
                {renderBillingCycleOptions(setFieldValue, values.billingCycle)}
                {errors.billingCycle && touched.billingCycle && (
                  <Text variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                    {errors.billingCycle}
                  </Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <FormInput
                  label="Currency"
                  value={values.currency}
                  onChangeText={handleChange('currency')}
                  error={errors.currency}
                  touched={touched.currency}
                />
              </View>

              <View style={styles.fieldContainer}>
                <FormInput
                  label="Start Date"
                  value={values.startDate}
                  onChangeText={handleChange('startDate')}
                  error={errors.startDate}
                  touched={touched.startDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              {renderFeedbackSection()}

              <View style={styles.buttonsContainer}>
                <Button
                  title="Reject"
                  variant="outline"
                  onPress={handleReject}
                  style={styles.rejectButton}
                  disabled={isLoading}
                />
                <Button
                  title={isLoading ? 'Saving...' : 'Confirm and Save'}
                  variant="primary"
                  onPress={() => handleSubmit()}
                  style={styles.confirmButton}
                  disabled={isLoading}
                />
              </View>

              {isLoading && (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
              )}
            </View>
          )}
        </Formik>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  description: {
    marginBottom: 16,
  },
  smsPreview: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  messageBody: {
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 16,
    borderRadius: 8,
    padding: 8,
  },
  confidenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  billingCycleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cycleOption: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cycleText: {
    textAlign: 'center',
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
  rejectButton: {
    flex: 1,
    marginRight: 8,
  },
  loader: {
    marginTop: 20,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 16,
  },
  feedbackSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    height: 80,
  },
  feedbackTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  feedbackTypeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  cancelFeedbackButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginTop: 4,
  },
});
