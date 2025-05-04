/**
 * Subscription Message Service
 *
 * This service provides functions for managing subscription messages detected from SMS
 */

import { supabase } from './supabase';
import {
  SubscriptionMessage,
  SubscriptionMessageInsert,
  SubscriptionMessageUpdate,
  SubscriptionWithMessages,
} from '../types/supabase';
import errorHandler from '../utils/errorHandler';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';

/**
 * Get all subscription messages for a user
 *
 * @param userId The ID of the user
 * @returns Promise resolving to an array of SubscriptionMessage objects
 */
export const getSubscriptionMessages = errorHandler.withErrorHandling(
  async (userId: string): Promise<SubscriptionMessage[]> => {
    const { data, error } = await supabase
      .from('subscription_messages')
      .select('*')
      .eq('user_id', userId)
      .order('detected_at', { ascending: false });

    if (error) throw error;

    return data || [];
  },
  'SubscriptionMessage'
);

/**
 * Get subscription messages for a specific subscription
 *
 * @param subscriptionId The ID of the subscription
 * @returns Promise resolving to an array of SubscriptionMessage objects
 */
export const getMessagesBySubscription = errorHandler.withErrorHandling(
  async (subscriptionId: string): Promise<SubscriptionMessage[]> => {
    const { data, error } = await supabase
      .from('subscription_messages')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('detected_at', { ascending: false });

    if (error) throw error;

    return data || [];
  },
  'SubscriptionMessage'
);

/**
 * Get a single subscription message by ID
 *
 * @param id The ID of the message to retrieve
 * @returns Promise resolving to a SubscriptionMessage object or null if not found
 * @throws NotFoundError if the message doesn't exist
 */
export const getSubscriptionMessageById = errorHandler.withErrorHandling(
  async (id: string): Promise<SubscriptionMessage> => {
    const { data, error } = await supabase
      .from('subscription_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // "Not found" error code
        throw new NotFoundError('SubscriptionMessage', id);
      }
      throw error;
    }

    return errorHandler.checkRecordFound(data, 'SubscriptionMessage', id);
  },
  'SubscriptionMessage'
);

/**
 * Create a new subscription message
 *
 * @param message The subscription message data to insert
 * @returns Promise resolving to the created SubscriptionMessage
 */
export const createSubscriptionMessage = errorHandler.withErrorHandling(
  async (message: SubscriptionMessageInsert): Promise<SubscriptionMessage> => {
    const { data, error } = await supabase
      .from('subscription_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;

    logger.info('Subscription message created successfully', { id: data.id });
    return data;
  },
  'SubscriptionMessage'
);

/**
 * Update an existing subscription message
 *
 * @param id The ID of the message to update
 * @param updates The message data to update
 * @returns Promise resolving to the updated SubscriptionMessage
 * @throws NotFoundError if the message doesn't exist
 */
export const updateSubscriptionMessage = errorHandler.withErrorHandling(
  async (id: string, updates: SubscriptionMessageUpdate): Promise<SubscriptionMessage> => {
    // Check if the message exists
    await getSubscriptionMessageById(id);

    const { data, error } = await supabase
      .from('subscription_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Subscription message updated successfully', { id });
    return data;
  },
  'SubscriptionMessage'
);

/**
 * Delete a subscription message
 *
 * @param id The ID of the message to delete
 * @returns Promise resolving to a boolean indicating success
 * @throws NotFoundError if the message doesn't exist
 */
export const deleteSubscriptionMessage = errorHandler.withErrorHandling(
  async (id: string): Promise<boolean> => {
    // Check if the message exists
    await getSubscriptionMessageById(id);

    const { error } = await supabase.from('subscription_messages').delete().eq('id', id);

    if (error) throw error;

    logger.info('Subscription message deleted successfully', { id });
    return true;
  },
  'SubscriptionMessage'
);

/**
 * Link a subscription message to a subscription
 *
 * @param messageId The ID of the message
 * @param subscriptionId The ID of the subscription
 * @returns Promise resolving to the updated SubscriptionMessage
 */
export const linkMessageToSubscription = errorHandler.withErrorHandling(
  async (messageId: string, subscriptionId: string): Promise<SubscriptionMessage> => {
    return updateSubscriptionMessage(messageId, { subscription_id: subscriptionId });
  },
  'SubscriptionMessage'
);

/**
 * Get a subscription with its messages
 *
 * @param subscriptionId The ID of the subscription
 * @returns Promise resolving to a SubscriptionWithMessages object
 */
export const getSubscriptionWithMessages = errorHandler.withErrorHandling(
  async (subscriptionId: string): Promise<SubscriptionWithMessages> => {
    const { data, error } = await supabase
      .from('subscription_with_messages')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Subscription', subscriptionId);
      }
      throw error;
    }

    return data as SubscriptionWithMessages;
  },
  'SubscriptionMessage'
);

/**
 * Create a message from an SMS detection
 *
 * @param userId The ID of the user
 * @param sender The sender of the SMS
 * @param messageBody The body of the SMS
 * @param extractedData The data extracted from the SMS
 * @param messageId The original message ID (if available)
 * @param confidenceScore The confidence score of the detection
 * @returns Promise resolving to the created SubscriptionMessage
 */
export const createSMSDetectionMessage = errorHandler.withErrorHandling(
  async (
    userId: string,
    sender: string,
    messageBody: string,
    extractedData: any,
    messageId?: string,
    confidenceScore: number = 0.8
  ): Promise<SubscriptionMessage> => {
    const messageData: SubscriptionMessageInsert = {
      user_id: userId,
      sender,
      message_body: messageBody,
      detected_at: new Date().toISOString(),
      confidence_score: confidenceScore,
      extracted_data: extractedData,
      message_id: messageId || null,
    };

    return createSubscriptionMessage(messageData);
  },
  'SubscriptionMessage'
);

export default {
  getSubscriptionMessages,
  getMessagesBySubscription,
  getSubscriptionMessageById,
  createSubscriptionMessage,
  updateSubscriptionMessage,
  deleteSubscriptionMessage,
  linkMessageToSubscription,
  getSubscriptionWithMessages,
  createSMSDetectionMessage,
};
