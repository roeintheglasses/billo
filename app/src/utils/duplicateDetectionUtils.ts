/**
 * Duplicate Detection Utilities
 *
 * This module provides utilities for detecting duplicate subscriptions and
 * SMS messages to prevent creating multiple entries for the same subscription.
 */

import { Subscription, SubscriptionMessage, Json } from '../types/supabase';
import crypto from 'crypto';
import logger from './logger';
import { normalizeAmountToMonthly } from '../services/subscriptionService';

// Define common service name aliases since they may not be exported from subscriptionDataExtractor
const SERVICE_ALIASES: Record<string, string> = {
  netflix: 'Netflix',
  nflx: 'Netflix',
  spotify: 'Spotify',
  spot: 'Spotify',
  'amazon prime': 'Amazon Prime',
  'prime video': 'Amazon Prime',
  'amazon video': 'Amazon Prime',
  prime: 'Amazon Prime',
  'disney+': 'Disney+',
  'disney plus': 'Disney+',
  'apple music': 'Apple Music',
  itunes: 'Apple',
  icloud: 'iCloud',
  'icloud+': 'iCloud',
  'apple one': 'Apple One',
  'youtube premium': 'YouTube Premium',
  'youtube music': 'YouTube Music',
  'yt premium': 'YouTube Premium',
  'yt music': 'YouTube Music',
  'hbo max': 'HBO Max',
  hbo: 'HBO',
  hulu: 'Hulu',
  'paramount+': 'Paramount+',
  'paramount plus': 'Paramount+',
};

/**
 * Configuration for duplicate detection
 */
export interface DuplicateDetectionConfig {
  /** Threshold for service name similarity (0-1) */
  serviceNameSimilarityThreshold: number;
  /** Threshold for amount similarity in percentage (0-100) */
  amountSimilarityThreshold: number;
  /** Time window in days for considering subscriptions as duplicates */
  timeWindowDays: number;
  /** Whether to normalize amounts by billing cycle for comparison */
  normalizeAmounts: boolean;
}

/**
 * Default configuration for duplicate detection
 */
export const DEFAULT_DUPLICATE_DETECTION_CONFIG: DuplicateDetectionConfig = {
  serviceNameSimilarityThreshold: 0.8,
  amountSimilarityThreshold: 5, // 5% difference
  timeWindowDays: 7,
  normalizeAmounts: true,
};

/**
 * Result of duplicate detection
 */
export interface DuplicateDetectionResult {
  /** Whether a duplicate was detected */
  isDuplicate: boolean;
  /** List of potential duplicate subscriptions */
  duplicates: Subscription[];
  /** Confidence score for the duplicate match (0-100) */
  confidence: number;
  /** Reason for the duplicate detection */
  reason: 'service_name_match' | 'amount_time_match' | 'fingerprint_match' | 'multiple_factors';
}

/**
 * Calculate Levenshtein distance between two strings
 *
 * @param a First string
 * @param b Second string
 * @returns Distance between the strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity between two strings (0-1)
 *
 * @param a First string
 * @param b Second string
 * @returns Similarity score (0-1)
 */
export function calculateStringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);

  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

/**
 * Normalize a service name using known aliases
 *
 * @param name Service name to normalize
 * @returns Normalized service name
 */
export function normalizeServiceName(name: string): string {
  if (!name) return '';

  const lowercaseName = name.toLowerCase();

  // Check for exact match in aliases
  for (const [alias, normalized] of Object.entries(SERVICE_ALIASES)) {
    if (lowercaseName === alias.toLowerCase()) {
      return normalized;
    }
  }

  // Check for partial matches
  for (const [alias, normalized] of Object.entries(SERVICE_ALIASES)) {
    if (
      lowercaseName.includes(alias.toLowerCase()) ||
      alias.toLowerCase().includes(lowercaseName)
    ) {
      return normalized;
    }
  }

  // Return original name with first letter capitalized
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Calculate similarity between subscription amounts, considering billing cycles
 *
 * @param sub1 First subscription
 * @param sub2 Second subscription
 * @param config Duplicate detection configuration
 * @returns Similarity as percentage difference
 */
export function calculateAmountSimilarity(
  sub1: Subscription,
  sub2: Subscription,
  config: DuplicateDetectionConfig = DEFAULT_DUPLICATE_DETECTION_CONFIG
): number {
  let amount1 = sub1.amount;
  let amount2 = sub2.amount;

  // Normalize amounts to monthly if needed
  if (config.normalizeAmounts) {
    amount1 = normalizeAmountToMonthly(sub1.amount, sub1.billing_cycle);
    amount2 = normalizeAmountToMonthly(sub2.amount, sub2.billing_cycle);
  }

  if (amount1 === 0 && amount2 === 0) return 100;
  if (amount1 === 0 || amount2 === 0) return 0;

  const maxAmount = Math.max(amount1, amount2);
  const minAmount = Math.min(amount1, amount2);

  // Calculate percentage difference
  return 100 - ((maxAmount - minAmount) / maxAmount) * 100;
}

/**
 * Calculate hash fingerprint for a message to identify duplicates
 *
 * @param message Message to fingerprint
 * @returns Hash fingerprint
 */
export function calculateMessageFingerprint(message: string | SubscriptionMessage): string {
  if (typeof message === 'string') {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  // If it's a SubscriptionMessage object
  return crypto
    .createHash('sha256')
    .update(`${message.sender}:${message.message_body}`)
    .digest('hex');
}

/**
 * Check if two dates are within a specific time window
 *
 * @param date1 First date (string or Date)
 * @param date2 Second date (string or Date)
 * @param dayWindow Number of days window
 * @returns Whether dates are within the window
 */
export function areDatesWithinWindow(
  date1: string | Date,
  date2: string | Date,
  dayWindow: number
): boolean {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return false;
  }

  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= dayWindow;
}

/**
 * Detect if a subscription is a duplicate of any existing subscriptions
 *
 * @param subscription Subscription to check
 * @param existingSubscriptions List of existing subscriptions
 * @param config Configuration for duplicate detection
 * @returns Duplicate detection result
 */
export function detectDuplicateSubscription(
  subscription: Subscription,
  existingSubscriptions: Subscription[],
  config: DuplicateDetectionConfig = DEFAULT_DUPLICATE_DETECTION_CONFIG
): DuplicateDetectionResult {
  const duplicates: Subscription[] = [];
  let highestConfidence = 0;
  let detectionReason: DuplicateDetectionResult['reason'] = 'service_name_match';

  // Normalize the new subscription's service name
  const normalizedNewName = normalizeServiceName(subscription.name);

  for (const existingSub of existingSubscriptions) {
    // Skip if it's the same subscription
    if (existingSub.id === subscription.id) continue;

    // Normalize the existing subscription's service name
    const normalizedExistingName = normalizeServiceName(existingSub.name);

    // Calculate name similarity
    const nameSimilarity = calculateStringSimilarity(normalizedNewName, normalizedExistingName);

    // Calculate amount similarity
    const amountSimilarity = calculateAmountSimilarity(subscription, existingSub, config);

    // Check if dates are within time window
    const datesWithinWindow = areDatesWithinWindow(
      subscription.created_at,
      existingSub.created_at,
      config.timeWindowDays
    );

    // Calculate overall confidence score
    let confidence = 0;
    let reason: DuplicateDetectionResult['reason'] = 'service_name_match';

    if (nameSimilarity >= config.serviceNameSimilarityThreshold) {
      confidence += nameSimilarity * 60; // Name similarity contributes 60% to confidence
      reason = 'service_name_match';
    }

    if (amountSimilarity >= 100 - config.amountSimilarityThreshold) {
      confidence += (amountSimilarity / 100) * 30; // Amount similarity contributes 30% to confidence
      reason = confidence > 0 ? 'multiple_factors' : 'amount_time_match';
    }

    if (datesWithinWindow) {
      confidence += 10; // Time window contributes 10% to confidence
      reason = confidence > 10 ? reason : 'amount_time_match';
    }

    // If confidence is high enough, add to duplicates
    if (confidence >= 60) {
      duplicates.push(existingSub);

      // Track highest confidence and its reason
      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        detectionReason = reason;
      }
    }
  }

  return {
    isDuplicate: duplicates.length > 0,
    duplicates,
    confidence: highestConfidence,
    reason: detectionReason,
  };
}

/**
 * Check if a message has been processed before using fingerprinting
 *
 * @param message Message to check
 * @param existingMessages List of existing messages
 * @returns Whether the message is a duplicate
 */
export function isMessageDuplicate(
  message: string | SubscriptionMessage,
  existingMessages: SubscriptionMessage[]
): boolean {
  const fingerprint = calculateMessageFingerprint(message);

  return existingMessages.some(existingMsg => {
    // Check if extracted_data contains the fingerprint
    if (existingMsg.extracted_data && typeof existingMsg.extracted_data === 'object') {
      const extractedData = existingMsg.extracted_data as Record<string, Json>;
      if (
        extractedData.fingerprint &&
        typeof extractedData.fingerprint === 'string' &&
        extractedData.fingerprint === fingerprint
      ) {
        return true;
      }
    }

    // Also check direct message content for simple matching
    if (typeof message === 'string') {
      return calculateMessageFingerprint(existingMsg.message_body) === fingerprint;
    } else {
      return (
        message.message_body === existingMsg.message_body && message.sender === existingMsg.sender
      );
    }
  });
}

/**
 * Determine which subscription from a set of duplicates should be kept
 * based on data completeness and confidence
 *
 * @param subscriptions List of duplicate subscriptions
 * @returns The subscription to keep
 */
export function determinePreferredSubscription(subscriptions: Subscription[]): Subscription {
  if (!subscriptions.length) {
    throw new Error('Cannot determine preferred subscription from empty list');
  }

  if (subscriptions.length === 1) {
    return subscriptions[0];
  }

  // Score each subscription based on data completeness
  const scoredSubscriptions = subscriptions.map(sub => {
    let score = 0;

    // Score based on data completeness
    if (sub.name) score += 1;
    if (sub.amount) score += 1;
    if (sub.billing_cycle) score += 1;
    if (sub.start_date) score += 1;
    if (sub.next_billing_date) score += 1;
    if (sub.category_id) score += 1;
    if (sub.notes) score += 0.5;

    // Prefer non-auto-detected subscriptions (manually added)
    if (!sub.auto_detected) score += 2;

    // Prefer newer subscriptions
    const subAge = Date.now() - new Date(sub.created_at).getTime();
    score += 1 - subAge / (1000 * 60 * 60 * 24 * 30); // Age penalty decreases over 30 days

    return { subscription: sub, score };
  });

  // Sort by score and return the best one
  scoredSubscriptions.sort((a, b) => b.score - a.score);

  return scoredSubscriptions[0].subscription;
}

/**
 * Clean up old message fingerprints to prevent database bloat
 *
 * @param messages List of messages to clean
 * @param daysToKeep Number of days to keep fingerprints
 * @returns List of messages that need updating
 */
export function cleanupOldFingerprints(
  messages: SubscriptionMessage[],
  daysToKeep: number = 90
): SubscriptionMessage[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const messagesToUpdate: SubscriptionMessage[] = [];

  for (const message of messages) {
    const messageDate = new Date(message.detected_at);

    if (
      messageDate < cutoffDate &&
      message.extracted_data &&
      typeof message.extracted_data === 'object'
    ) {
      // Create a copy of extracted_data without the fingerprint
      const extractedData = { ...(message.extracted_data as Record<string, Json>) };
      if (extractedData.fingerprint) {
        delete extractedData.fingerprint;

        // Add to list to update
        messagesToUpdate.push({
          ...message,
          extracted_data: extractedData as Json,
        });
      }
    }
  }

  return messagesToUpdate;
}
