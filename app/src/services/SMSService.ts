import { NativeModules, NativeEventEmitter, DeviceEventEmitter, Platform } from 'react-native';
import { containsSubscriptionPattern, extractPrice, extractServiceName } from '../utils/subscriptionPatternUtils';

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
  isSubscription: boolean;
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
    const subscription = DeviceEventEmitter.addListener('onSMSReceived', (event) => {
      try {
        const data = typeof event === 'string' ? JSON.parse(event) : event;
        console.log('SMS received:', data);
        const isSubscription = this.checkForSubscription({
          messageBody: data.body || data.messageBody,
          senderPhoneNumber: data.address || data.senderPhoneNumber
        });
        
        if (isSubscription) {
          // Notify the app that a subscription SMS was detected
          DeviceEventEmitter.emit('subscriptionDetected', data);
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
    const minDate = Date.now() - (90 * 24 * 60 * 60 * 1000);
    
    const filter: SMSFilter = {
      box: 'inbox',
      minDate,
      maxCount: 100
    };

    try {
      const subscriptions: SubscriptionSMSMessage[] = [];
      
      // Use the native module to get SMS messages
      const smsResults = await this.getSMSMessages(filter);
      
      // Check each message for subscription patterns
      for (const sms of smsResults) {
        if (containsSubscriptionPattern(sms.body)) {
          const serviceName = extractServiceName(sms.body, sms.address);
          const price = extractPrice(sms.body);
          
          const enhancedSMS: SubscriptionSMSMessage = {
            ...sms,
            isSubscription: true,
            ...(serviceName && { serviceName }),
            ...(price && { price })
          };
          subscriptions.push(enhancedSMS);
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
  private checkForSubscription(sms: { messageBody: string, senderPhoneNumber: string }): boolean {
    return containsSubscriptionPattern(sms.messageBody);
  }
}

export default new SMSService(); 