import { NativeModules, NativeEventEmitter, DeviceEventEmitter, Platform } from 'react-native';
import {
  containsSubscriptionPattern,
  extractPrice,
  extractServiceName,
  analyzeSubscriptionText,
  PatternType,
  PatternMatchResult,
} from '../utils/subscriptionPatternUtils';
import { extractSubscriptionData } from '../utils/subscriptionDataExtractor';
import subscriptionMessageService from './subscriptionMessageService';
import subscriptionService from './subscriptionService';
import { supabase } from './supabase';
import { SubscriptionMessageInsert, SubscriptionInsert } from '../types/supabase';
import logger from '../utils/logger';
import { isMessageDuplicate, calculateMessageFingerprint } from '../utils/duplicateDetectionUtils';

/**
 * Interface for SMS message object returned from native code
 */
export interface SMSMessage {
  _id: number;
  thread_id: number;
  address: string;
  person: number;
  date: number;
  date_sent: number;
  protocol: number;
  read: number;
  status: number;
  type: number;
  body: string;
  service_center: string;
}

/**
 * Enhanced subscription message with additional extracted data
 */
export interface SubscriptionSMSMessage extends SMSMessage {
  serviceName?: string;
  price?: number;
  billingCycle?: string;
  currency?: string;
  confidence?: number;
  patternType?: PatternType;
  isSubscription: boolean;
  nextBillingDate?: string;
}

/**
 * Filter options for querying SMS messages
 */
export interface SMSFilter {
  box?: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued' | '';
  minDate?: number;
  maxDate?: number;
  bodyRegex?: string;
  read?: number;
  _id?: number;
  thread_id?: number;
  address?: string;
  body?: string;
  indexFrom?: number;
  maxCount?: number;
}

/**
 * Service class for accessing and scanning SMS messages
 */
class SMSService {
  /**
   * Checks if the device is Android (iOS doesn't allow SMS access)
   */
  isSupported(): boolean {
    return Platform.OS === 'android';
  }

  /**
   * Setup listeners for incoming SMS messages
   *
   * @returns A cleanup function to remove listeners
   */
  setupSMSListeners(): () => void {
    if (!this.isSupported()) {
      return () => {};
    }

    // Set up listener for incoming SMS
    const subscription = DeviceEventEmitter.addListener('onSMSReceived', async event => {
      try {
        const data = typeof event === 'string' ? JSON.parse(event) : event;
        console.log('SMS received:', data);
        const messageBody = data.body || data.messageBody;
        const senderAddress = data.address || data.senderPhoneNumber;

        // Get current user
        const { data: userData } = await supabase.auth.getSession();
        if (!userData?.session?.user) {
          logger.warn('No authenticated user found, cannot process SMS');
          return;
        }

        const userId = userData.session.user.id;

        // Generate a fingerprint for message deduplication
        const messageFingerprint = await calculateMessageFingerprint(messageBody);

        // Check if this message has been processed before
        const { data: existingMessages } = await supabase
          .from('subscription_messages')
          .select('*')
          .eq('user_id', userId);

        const isDuplicate = await isMessageDuplicate(messageBody, existingMessages || []);
        if (isDuplicate) {
          logger.info('Duplicate SMS message detected, skipping processing', {
            fingerprint: messageFingerprint,
            sender: senderAddress,
          });
          return;
        }

        // Use the enhanced pattern analysis
        const analysisResult = analyzeSubscriptionText(messageBody, senderAddress);

        // Also perform advanced data extraction
        const extractionResult = extractSubscriptionData(messageBody, senderAddress);

        // Merge the extraction data with analysis result for more complete data
        if (extractionResult.service && !analysisResult.extractedData.serviceName) {
          analysisResult.extractedData.serviceName = extractionResult.service.normalizedName;
        }

        if (extractionResult.amount && !analysisResult.extractedData.price) {
          analysisResult.extractedData.price = extractionResult.amount.value;
          analysisResult.extractedData.currency = extractionResult.amount.currency;
        }

        if (extractionResult.billingCycle && !analysisResult.extractedData.billingCycle) {
          analysisResult.extractedData.billingCycle = extractionResult.billingCycle.cycle;
        }

        if (extractionResult.date && !analysisResult.extractedData.date) {
          analysisResult.extractedData.date = extractionResult.date.date
            .toISOString()
            .split('T')[0];

          // For renewal or trial ending patterns, set next billing date
          if (
            analysisResult.patternType === PatternType.RENEWAL_NOTICE ||
            analysisResult.patternType === PatternType.TRIAL_ENDING
          ) {
            analysisResult.extractedData.nextBillingDate = extractionResult.date.date
              .toISOString()
              .split('T')[0];
          }
        }

        // If no pattern match but extraction has high confidence, consider it a match
        if (!analysisResult.matched && extractionResult.overallConfidence > 0.6) {
          analysisResult.matched = true;
          analysisResult.confidence = Math.floor(extractionResult.overallConfidence * 100);
        }

        if (analysisResult.matched) {
          // Notify the app that a subscription SMS was detected
          DeviceEventEmitter.emit('subscriptionDetected', {
            ...data,
            confidence: analysisResult.confidence,
            patternType: analysisResult.patternType,
          });

          try {
            // Store subscription message in database with all the extracted data
            const extractedData = {
              ...analysisResult.extractedData,
              original_sms_id: data._id?.toString(),
              message_source: 'sms_listener',
              confidence: analysisResult.confidence,
              pattern_type: analysisResult.patternType,
              currency: analysisResult.extractedData.currency || 'USD',
              next_billing_date: analysisResult.extractedData.nextBillingDate,
              fingerprint: messageFingerprint, // Add fingerprint for deduplication
            };

            const savedMessage = await subscriptionMessageService.createSMSDetectionMessage(
              userId,
              senderAddress,
              messageBody,
              extractedData,
              data._id?.toString(),
              analysisResult.confidence / 100 // Convert 0-100 to 0-1 range
            );

            logger.info('Created subscription message from SMS listener', {
              messageId: savedMessage.id,
              confidence: analysisResult.confidence,
              patternType: analysisResult.patternType,
            });

            // If we have both service name and price, create a potential subscription
            if (analysisResult.extractedData.serviceName && analysisResult.extractedData.price) {
              try {
                // Create subscription with enhanced data
                const subscriptionData: SubscriptionInsert = {
                  user_id: userId,
                  name: analysisResult.extractedData.serviceName,
                  amount: analysisResult.extractedData.price,
                  billing_cycle: analysisResult.extractedData.billingCycle || 'monthly', // Default to monthly if not detected
                  start_date: new Date().toISOString().split('T')[0],
                  source_type: 'sms',
                  auto_detected: true,
                  next_billing_date: analysisResult.extractedData.nextBillingDate || null,
                };

                // Check for duplicates when creating subscription
                const result = await subscriptionService.createSubscriptionWithDuplicateCheck(
                  subscriptionData,
                  true, // Check for duplicates
                  false // Don't auto merge, we'll show UI for user to decide
                );

                // Check if we got a subscription with duplicates
                if ('subscription' in result && 'duplicates' in result) {
                  const { subscription: savedSubscription, duplicates } = result;

                  // Link message to subscription
                  await subscriptionMessageService.linkMessageToSubscription(
                    savedMessage.id,
                    savedSubscription.id
                  );

                  // Emit an event with duplicate information
                  DeviceEventEmitter.emit('duplicateSubscriptionDetected', {
                    subscription: savedSubscription,
                    duplicates: duplicates.duplicates,
                    confidence: duplicates.confidence,
                  });

                  logger.info('Created subscription with duplicates from SMS listener', {
                    subscriptionId: savedSubscription.id,
                    messageId: savedMessage.id,
                    duplicatesCount: duplicates.duplicates.length,
                    confidence: duplicates.confidence,
                  });
                } else {
                  // No duplicates, just a regular subscription
                  const savedSubscription = result;

                  // Link message to subscription
                  await subscriptionMessageService.linkMessageToSubscription(
                    savedMessage.id,
                    savedSubscription.id
                  );

                  logger.info('Created subscription from SMS listener', {
                    subscriptionId: savedSubscription.id,
                    messageId: savedMessage.id,
                    confidence: analysisResult.confidence,
                  });
                }
              } catch (error) {
                logger.error('Failed to create subscription from SMS listener', error);
              }
            }
          } catch (error) {
            logger.error('Failed to store subscription message from SMS listener', error);
          }
        }
      } catch (error) {
        console.error('Error processing SMS event:', error);
      }
    });

    return () => {
      subscription.remove();
    };
  }

  /**
   * Scans SMS messages for subscription-related content
   */
  async scanForSubscriptions(): Promise<SubscriptionSMSMessage[]> {
    if (!this.isSupported() || !NativeModules.SmsModule) {
      console.log('SMS scanning not supported on this device or native module not found');
      return [];
    }

    // Last 90 days
    const minDate = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const filter: SMSFilter = {
      box: 'inbox',
      minDate,
      maxCount: 100,
    };

    try {
      const subscriptions: SubscriptionSMSMessage[] = [];

      // Use the native module to get SMS messages
      const smsResults = await this.getSMSMessages(filter);

      // Get current user
      const { data: userData } = await supabase.auth.getSession();
      const userId = userData?.session?.user?.id;

      // Check each message for subscription patterns
      for (const sms of smsResults) {
        // Use the enhanced pattern analysis
        const analysisResult = analyzeSubscriptionText(sms.body, sms.address);

        // Also perform advanced data extraction
        const extractionResult = extractSubscriptionData(sms.body, sms.address);

        // Merge the extraction data with analysis result for more complete data
        if (extractionResult.service && !analysisResult.extractedData.serviceName) {
          analysisResult.extractedData.serviceName = extractionResult.service.normalizedName;
        }

        if (extractionResult.amount && !analysisResult.extractedData.price) {
          analysisResult.extractedData.price = extractionResult.amount.value;
          analysisResult.extractedData.currency = extractionResult.amount.currency;
        }

        if (extractionResult.billingCycle && !analysisResult.extractedData.billingCycle) {
          analysisResult.extractedData.billingCycle = extractionResult.billingCycle.cycle;
        }

        if (extractionResult.date && !analysisResult.extractedData.date) {
          analysisResult.extractedData.date = extractionResult.date.date
            .toISOString()
            .split('T')[0];

          // For renewal or trial ending patterns, set next billing date
          if (
            analysisResult.patternType === PatternType.RENEWAL_NOTICE ||
            analysisResult.patternType === PatternType.TRIAL_ENDING
          ) {
            analysisResult.extractedData.nextBillingDate = extractionResult.date.date
              .toISOString()
              .split('T')[0];
          }
        }

        // If no pattern match but extraction has high confidence, consider it a match
        if (!analysisResult.matched && extractionResult.overallConfidence > 0.6) {
          analysisResult.matched = true;
          analysisResult.confidence = Math.floor(extractionResult.overallConfidence * 100);
        }

        if (analysisResult.matched) {
          // Create an enhanced SMS message with all extracted data
          const enhancedSMS: SubscriptionSMSMessage = {
            ...sms,
            isSubscription: true,
            confidence: analysisResult.confidence,
            patternType: analysisResult.patternType,
            ...(analysisResult.extractedData.serviceName && {
              serviceName: analysisResult.extractedData.serviceName,
            }),
            ...(analysisResult.extractedData.price && {
              price: analysisResult.extractedData.price,
            }),
            ...(analysisResult.extractedData.billingCycle && {
              billingCycle: analysisResult.extractedData.billingCycle,
            }),
            ...(analysisResult.extractedData.currency && {
              currency: analysisResult.extractedData.currency,
            }),
            ...(analysisResult.extractedData.nextBillingDate && {
              nextBillingDate: analysisResult.extractedData.nextBillingDate,
            }),
          };

          subscriptions.push(enhancedSMS);

          // Store detected messages if user is authenticated
          if (userId) {
            try {
              // Store the message in the database with all extracted data
              const extractedData = {
                ...analysisResult.extractedData,
                original_sms_id: sms._id.toString(),
                message_source: 'batch_scan',
                confidence: analysisResult.confidence,
                pattern_type: analysisResult.patternType,
                currency: analysisResult.extractedData.currency || 'USD',
                next_billing_date: analysisResult.extractedData.nextBillingDate,
              };

              const savedMessage = await subscriptionMessageService.createSMSDetectionMessage(
                userId,
                sms.address,
                sms.body,
                extractedData,
                sms._id.toString(),
                analysisResult.confidence / 100 // Convert 0-100 to 0-1 range
              );

              // If we found both service name and price, create a potential subscription
              if (analysisResult.extractedData.serviceName && analysisResult.extractedData.price) {
                try {
                  // Create a potential subscription with enhanced data
                  const subscriptionData: SubscriptionInsert = {
                    user_id: userId,
                    name: analysisResult.extractedData.serviceName,
                    amount: analysisResult.extractedData.price,
                    billing_cycle: analysisResult.extractedData.billingCycle || 'monthly',
                    start_date: new Date(sms.date).toISOString().split('T')[0],
                    source_type: 'sms',
                    auto_detected: true,
                    next_billing_date: analysisResult.extractedData.nextBillingDate || null,
                  };

                  const savedSubscription =
                    await subscriptionService.createSubscription(subscriptionData);

                  // Link the message to the subscription
                  await subscriptionMessageService.linkMessageToSubscription(
                    savedMessage.id,
                    savedSubscription.id
                  );

                  logger.info('Created potential subscription from SMS scan', {
                    subscriptionId: savedSubscription.id,
                    messageId: savedMessage.id,
                    confidence: analysisResult.confidence,
                  });
                } catch (error) {
                  logger.error('Failed to create subscription from SMS scan', error);
                }
              }
            } catch (error) {
              logger.error('Failed to store subscription message from SMS scan', error);
            }
          }
        }
      }

      return subscriptions;
    } catch (error) {
      console.error('Error scanning SMS for subscriptions:', error);
      return [];
    }
  }

  /**
   * Gets SMS messages using the native module
   */
  private getSMSMessages(filter: SMSFilter): Promise<SMSMessage[]> {
    return new Promise((resolve, reject) => {
      if (!NativeModules.SmsModule) {
        reject(new Error('SMS module not available'));
        return;
      }

      NativeModules.SmsModule.list(
        JSON.stringify(filter),
        (error: string) => {
          reject(new Error(error));
        },
        (_count: number, smsList: string) => {
          try {
            const messages: SMSMessage[] = JSON.parse(smsList);
            resolve(messages);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Checks a single SMS for subscription content
   */
  private checkForSubscription(sms: { messageBody: string; senderPhoneNumber: string }): boolean {
    const analysisResult = analyzeSubscriptionText(sms.messageBody, sms.senderPhoneNumber);
    return analysisResult.matched;
  }
}

export default new SMSService();
