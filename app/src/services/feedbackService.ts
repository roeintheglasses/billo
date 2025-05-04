/**
 * Feedback Service
 *
 * Service for collecting, storing, and retrieving user feedback to improve
 * subscription detection algorithms and user experience.
 */

import { supabase } from './supabase';
import errorHandler from '../utils/errorHandler';
import { UserFeedback, UserFeedbackInsert, Json } from '../types/supabase';
import logger from '../utils/logger';

/**
 * Feedback types enum
 */
export enum FeedbackType {
  FALSE_POSITIVE = 'false_positive', // Incorrectly detected subscription
  FALSE_NEGATIVE = 'false_negative', // Missed subscription
  INCORRECT_AMOUNT = 'incorrect_amount', // Amount was detected but incorrect
  INCORRECT_SERVICE = 'incorrect_service', // Service name was detected but incorrect
  INCORRECT_BILLING_CYCLE = 'incorrect_billing_cycle', // Billing cycle was detected but incorrect
  INCORRECT_DATE = 'incorrect_date', // Date was detected but incorrect
  FEATURE_REQUEST = 'feature_request', // User suggesting new feature
  UI_ISSUE = 'ui_issue', // User reporting UI/UX issue
  GENERAL_FEEDBACK = 'general_feedback', // General feedback
  BUG_REPORT = 'bug_report', // Bug report
}

/**
 * Feedback source screens enum
 */
export enum FeedbackSource {
  SUBSCRIPTION_LIST = 'subscription_list',
  SUBSCRIPTION_DETAIL = 'subscription_detail',
  SUBSCRIPTION_EDIT = 'subscription_edit',
  CONFIRMATION_MODAL = 'confirmation_modal',
  DASHBOARD = 'dashboard',
  SETTINGS = 'settings',
  MESSAGE_LIST = 'message_list',
  FEEDBACK_FORM = 'feedback_form',
  OTHER = 'other',
}

/**
 * Class to manage user feedback
 */
class FeedbackService {
  /**
   * Submit user feedback
   *
   * @param feedback The feedback data to submit
   * @returns The created feedback record
   */
  submitFeedback = errorHandler.withErrorHandling(
    async (feedback: UserFeedbackInsert): Promise<UserFeedback> => {
      const { data, error } = await supabase
        .from('user_feedback')
        .insert(feedback)
        .select('*')
        .single();

      if (error) {
        logger.error('Error submitting feedback:', error);
        throw error;
      }

      logger.info('Feedback submitted successfully:', data.id);
      return data;
    },
    'Feedback'
  );

  /**
   * Submit feedback for incorrect subscription detection
   *
   * @param subscriptionId The ID of the subscription
   * @param feedbackType The type of feedback
   * @param description User description of the issue
   * @param accuracyRating Optional rating of detection accuracy (1-5)
   * @param metadata Optional additional data about the issue
   * @returns The created feedback record
   */
  submitSubscriptionFeedback = errorHandler.withErrorHandling(
    async (
      subscriptionId: string,
      feedbackType: FeedbackType,
      description: string,
      accuracyRating?: number,
      metadata?: Record<string, any>
    ): Promise<UserFeedback> => {
      // Get current user
      const { data: userData } = await supabase.auth.getSession();
      if (!userData?.session?.user) {
        throw new Error('User not authenticated');
      }

      const feedbackData: UserFeedbackInsert = {
        user_id: userData.session.user.id,
        subscription_id: subscriptionId,
        feedback_type: feedbackType,
        description,
        accuracy_rating: accuracyRating || null,
        metadata: metadata as Json,
        source_screen: FeedbackSource.SUBSCRIPTION_DETAIL,
      };

      return this.submitFeedback(feedbackData);
    },
    'SubscriptionFeedback'
  );

  /**
   * Submit feedback for a specific message
   *
   * @param messageId The ID of the message
   * @param feedbackType The type of feedback
   * @param description User description of the issue
   * @param accuracyRating Optional rating of detection accuracy (1-5)
   * @param metadata Optional additional data about the issue
   * @returns The created feedback record
   */
  submitMessageFeedback = errorHandler.withErrorHandling(
    async (
      messageId: string,
      feedbackType: FeedbackType,
      description: string,
      accuracyRating?: number,
      metadata?: Record<string, any>
    ): Promise<UserFeedback> => {
      // Get current user
      const { data: userData } = await supabase.auth.getSession();
      if (!userData?.session?.user) {
        throw new Error('User not authenticated');
      }

      const feedbackData: UserFeedbackInsert = {
        user_id: userData.session.user.id,
        message_id: messageId,
        feedback_type: feedbackType,
        description,
        accuracy_rating: accuracyRating || null,
        metadata: metadata as Json,
        source_screen: FeedbackSource.MESSAGE_LIST,
      };

      return this.submitFeedback(feedbackData);
    },
    'MessageFeedback'
  );

  /**
   * Get all feedback from a user
   *
   * @returns Array of feedback items
   */
  getFeedbackByUser = errorHandler.withErrorHandling(async (): Promise<UserFeedback[]> => {
    // Get current user
    const { data: userData } = await supabase.auth.getSession();
    if (!userData?.session?.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', userData.session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching user feedback:', error);
      throw error;
    }

    return data || [];
  }, 'UserFeedback');

  /**
   * Get feedback for a specific subscription
   *
   * @param subscriptionId The subscription ID
   * @returns Array of feedback items for the subscription
   */
  getFeedbackBySubscription = errorHandler.withErrorHandling(
    async (subscriptionId: string): Promise<UserFeedback[]> => {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching subscription feedback:', error);
        throw error;
      }

      return data || [];
    },
    'SubscriptionFeedback'
  );

  /**
   * Get feedback for a specific message
   *
   * @param messageId The message ID
   * @returns Array of feedback items for the message
   */
  getFeedbackByMessage = errorHandler.withErrorHandling(
    async (messageId: string): Promise<UserFeedback[]> => {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching message feedback:', error);
        throw error;
      }

      return data || [];
    },
    'MessageFeedback'
  );
}

// Create and export a singleton instance
const feedbackService = new FeedbackService();
export default feedbackService;
