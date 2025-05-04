import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../atoms/Text';
import { Button } from '../atoms/Button';
import { useTheme } from '../../contexts/ThemeContext';
import feedbackService, { FeedbackType } from '../../services/feedbackService';
import logger from '../../utils/logger';

interface FeedbackFormProps {
  subscriptionId?: string;
  messageId?: string;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

/**
 * FeedbackForm Component
 *
 * A form that allows users to submit feedback about subscription detection
 * to help improve the detection algorithms.
 */
export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  subscriptionId,
  messageId,
  onSubmitSuccess,
  onCancel,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const [loading, setLoading] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.GENERAL_FEEDBACK);
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(0);

  // Define feedback type options
  const feedbackTypeOptions = [
    { value: FeedbackType.FALSE_POSITIVE, label: 'Not a Subscription' },
    { value: FeedbackType.FALSE_NEGATIVE, label: 'Missed Subscription' },
    { value: FeedbackType.INCORRECT_AMOUNT, label: 'Incorrect Amount' },
    { value: FeedbackType.INCORRECT_SERVICE, label: 'Incorrect Service Name' },
    { value: FeedbackType.INCORRECT_BILLING_CYCLE, label: 'Incorrect Billing Cycle' },
    { value: FeedbackType.INCORRECT_DATE, label: 'Incorrect Date' },
    { value: FeedbackType.GENERAL_FEEDBACK, label: 'Other Feedback' },
  ];

  // Handle submitting the feedback
  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of your feedback');
      return;
    }

    setLoading(true);

    try {
      if (subscriptionId) {
        await feedbackService.submitSubscriptionFeedback(
          subscriptionId,
          feedbackType,
          description,
          rating > 0 ? rating : undefined
        );
      } else if (messageId) {
        await feedbackService.submitMessageFeedback(
          messageId,
          feedbackType,
          description,
          rating > 0 ? rating : undefined
        );
      } else {
        // Neither subscription nor message ID, use general feedback
        Alert.alert('Error', 'Missing subscription or message reference');
        setLoading(false);
        return;
      }

      // Success
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted and will help improve our service.',
        [{ text: 'OK', onPress: onSubmitSuccess }]
      );
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render star rating selector
  const renderRatingSelector = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text variant="label" style={{ color: colors.text.secondary, marginBottom: 8 }}>
          Accuracy Rating
        </Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
              <Ionicons
                name={rating >= star ? 'star' : 'star-outline'}
                size={32}
                color={rating >= star ? colors.warning : colors.text.secondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text variant="heading2" style={styles.title}>
        Submit Feedback
      </Text>

      <Text variant="body" style={{ color: colors.text.secondary, marginBottom: 16 }}>
        Your feedback helps us improve our subscription detection. Please let us know what went
        wrong or what could be better.
      </Text>

      <View style={styles.formSection}>
        <Text variant="label" style={{ color: colors.text.secondary, marginBottom: 8 }}>
          Feedback Type
        </Text>

        <View style={styles.optionsContainer}>
          {feedbackTypeOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    feedbackType === option.value ? colors.primary : colors.background.secondary,
                  borderColor: colors.border.light,
                },
              ]}
              onPress={() => setFeedbackType(option.value)}
            >
              <Text
                variant="body"
                style={{
                  color: feedbackType === option.value ? colors.text.inverted : colors.text.primary,
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {renderRatingSelector()}

      <View style={styles.formSection}>
        <Text variant="label" style={{ color: colors.text.secondary, marginBottom: 8 }}>
          Description
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.light,
              color: colors.text.primary,
            },
          ]}
          placeholder="Please describe the issue or suggestion..."
          placeholderTextColor={colors.text.tertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Submit Feedback"
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
        <Button
          title="Cancel"
          onPress={onCancel}
          disabled={loading}
          style={styles.cancelButton}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    marginBottom: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 200,
  },
  starButton: {
    padding: 5,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  submitButton: {
    marginBottom: 10,
    width: '100%',
  },
  cancelButton: {
    marginBottom: 40,
    width: '100%',
  },
  loader: {
    marginVertical: 10,
  },
});
