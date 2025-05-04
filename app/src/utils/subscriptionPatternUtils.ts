/**
 * Utilities for detecting subscription patterns in text
 */

import {
  extractSubscriptionData,
  extractAmount as extractAdvancedAmount,
  extractServiceName as extractAdvancedServiceName,
  extractBillingCycle as extractAdvancedBillingCycle,
  extractDate
} from './subscriptionDataExtractor';

/**
 * Pattern type for different kinds of subscription messages
 */
export enum PatternType {
  SUBSCRIPTION_CONFIRMATION = 'confirmation',
  PAYMENT_CONFIRMATION = 'payment',
  TRIAL_ENDING = 'trial_ending',
  RENEWAL_NOTICE = 'renewal',
  PRICE_CHANGE = 'price_change',
  CANCELLATION = 'cancellation'
}

/**
 * Pattern definition with regex and metadata
 */
interface PatternDefinition {
  pattern: RegExp;
  type: PatternType;
  score: number; // 0-100 indicating confidence level
  extractors?: {
    price?: boolean;
    serviceName?: boolean;
    date?: boolean;
  };
}

/**
 * Result of pattern matching
 */
export interface PatternMatchResult {
  matched: boolean;
  confidence: number; // 0-100
  patternType?: PatternType;
  extractedData: {
    price?: number;
    serviceName?: string;
    date?: string;
    billingCycle?: string;
    currency?: string; // Added currency support
    nextBillingDate?: string; // Added next billing date
  };
}

/**
 * Common subscription services to detect
 */
export const SUBSCRIPTION_SERVICES = [
  'Netflix',
  'Spotify',
  'Amazon',
  'Prime',
  'Disney+',
  'Disney Plus',
  'HBO',
  'Hulu',
  'YouTube',
  'Apple',
  'Apple Music',
  'iCloud',
  'Google',
  'Microsoft',
  'Office365',
  'Xbox',
  'PlayStation',
  'EA',
  'Adobe',
  'Dropbox',
  'Audible',
  'Kindle',
  'Twitch',
  'Nintendo',
  'Paramount+',
  'Peacock',
  'Tidal',
  'Grammarly',
  'Canva',
  'GitHub',
  'Slack',
  'Zoom',
  'Notion',
  'Figma',
  'Ancestry',
  'LinkedIn',
  'Vimeo',
  'Squarespace',
  'Wix',
  'Shopify'
];

/**
 * Pattern registry for subscription detection
 */
const PATTERN_REGISTRY: PatternDefinition[] = [
  // Payment confirmation patterns
  {
    pattern: /payment\s+of\s+([£$€][\d,.]+)\s+to\s+([A-Za-z0-9\s]+)/i,
    type: PatternType.PAYMENT_CONFIRMATION,
    score: 90,
    extractors: { price: true, serviceName: true }
  },
  {
    pattern: /(?:payment|charge)\s+of\s+([£$€]?[\d,.]+)\s+(?:USD|EUR|GBP)/i,
    type: PatternType.PAYMENT_CONFIRMATION,
    score: 85,
    extractors: { price: true }
  },
  {
    pattern: /your\s+(?:subscription|membership)\s+to\s+([A-Za-z0-9\s]+)\s+has\s+been\s+charged/i,
    type: PatternType.PAYMENT_CONFIRMATION,
    score: 90,
    extractors: { serviceName: true }
  },
  {
    pattern: /(?:we've|we\s+have)\s+charged\s+your\s+(?:card|account|payment\s+method)\s+([£$€]?[\d,.]+)/i,
    type: PatternType.PAYMENT_CONFIRMATION,
    score: 85,
    extractors: { price: true }
  },
  {
    pattern: /thank\s+you\s+for\s+your\s+payment\s+(?:of\s+)?([£$€]?[\d,.]+)?/i,
    type: PatternType.PAYMENT_CONFIRMATION,
    score: 75,
    extractors: { price: true }
  },
  
  // Subscription confirmation patterns
  {
    pattern: /welcome\s+to\s+(?:your\s+)?([A-Za-z0-9\s]+)\s+subscription/i,
    type: PatternType.SUBSCRIPTION_CONFIRMATION,
    score: 90,
    extractors: { serviceName: true }
  },
  {
    pattern: /your\s+subscription\s+(?:to\s+)?([A-Za-z0-9\s]+)?\s+has\s+(?:been\s+)?(?:confirmed|activated|started)/i,
    type: PatternType.SUBSCRIPTION_CONFIRMATION,
    score: 85,
    extractors: { serviceName: true }
  },
  {
    pattern: /(?:you're|you\s+are)\s+now\s+subscribed\s+to\s+([A-Za-z0-9\s]+)/i,
    type: PatternType.SUBSCRIPTION_CONFIRMATION,
    score: 90,
    extractors: { serviceName: true }
  },
  {
    pattern: /you\s+have\s+successfully\s+signed\s+up\s+for\s+([A-Za-z0-9\s]+)/i,
    type: PatternType.SUBSCRIPTION_CONFIRMATION,
    score: 80,
    extractors: { serviceName: true }
  },
  
  // Trial ending patterns
  {
    pattern: /your\s+(?:free\s+)?trial\s+(?:period\s+)?(?:for\s+)?([A-Za-z0-9\s]+)?\s+(?:will|is\s+about\s+to)\s+end/i,
    type: PatternType.TRIAL_ENDING,
    score: 90,
    extractors: { serviceName: true }
  },
  {
    pattern: /your\s+(?:free\s+)?trial\s+(?:period\s+)?ends\s+(?:on\s+)?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    type: PatternType.TRIAL_ENDING,
    score: 85,
    extractors: { date: true }
  },
  {
    pattern: /(?:after|once)\s+your\s+trial\s+ends\s+(?:on\s+)?(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})?,\s+you\s+will\s+be\s+charged\s+([£$€]?[\d,.]+)/i,
    type: PatternType.TRIAL_ENDING,
    score: 90,
    extractors: { price: true }
  },
  {
    pattern: /reminder:?\s+your\s+(?:free\s+)?trial\s+(?:of\s+)?([A-Za-z0-9\s]+)?\s+is\s+ending\s+soon/i,
    type: PatternType.TRIAL_ENDING,
    score: 85,
    extractors: { serviceName: true }
  },
  
  // Renewal notices
  {
    pattern: /your\s+(?:subscription|membership)\s+(?:to\s+)?([A-Za-z0-9\s]+)?\s+will\s+(?:auto[- ]?)?renew/i,
    type: PatternType.RENEWAL_NOTICE,
    score: 90,
    extractors: { serviceName: true }
  },
  {
    pattern: /your\s+(?:subscription|membership|plan)\s+(?:to\s+)?([A-Za-z0-9\s]+)?\s+has\s+been\s+renewed/i,
    type: PatternType.RENEWAL_NOTICE,
    score: 90,
    extractors: { serviceName: true }
  },
  {
    pattern: /(?:upcoming|automatic)\s+renewal:?\s+([A-Za-z0-9\s]+)/i,
    type: PatternType.RENEWAL_NOTICE,
    score: 85,
    extractors: { serviceName: true }
  },
  {
    pattern: /we'll\s+automatically\s+bill\s+you\s+([£$€]?[\d,.]+)\s+(?:on|every)\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    type: PatternType.RENEWAL_NOTICE,
    score: 90,
    extractors: { price: true, date: true }
  },
  
  // Price change notifications
  {
    pattern: /price\s+(?:change|update|increase)\s+for\s+your\s+([A-Za-z0-9\s]+)\s+subscription/i,
    type: PatternType.PRICE_CHANGE,
    score: 90,
    extractors: { serviceName: true }
  },
  {
    pattern: /your\s+(?:subscription|membership|plan)\s+price\s+will\s+change\s+from\s+([£$€]?[\d,.]+)\s+to\s+([£$€]?[\d,.]+)/i,
    type: PatternType.PRICE_CHANGE,
    score: 95,
    extractors: { price: true }
  },
  {
    pattern: /we're\s+updating\s+the\s+price\s+of\s+your\s+([A-Za-z0-9\s]+)\s+subscription/i,
    type: PatternType.PRICE_CHANGE,
    score: 85,
    extractors: { serviceName: true }
  },
  
  // Cancellation patterns
  {
    pattern: /your\s+(?:subscription|membership)\s+(?:to\s+)?([A-Za-z0-9\s]+)?\s+has\s+been\s+canceled/i,
    type: PatternType.CANCELLATION,
    score: 90,
    extractors: { serviceName: true }
  },
  {
    pattern: /we've\s+received\s+your\s+request\s+to\s+cancel\s+your\s+([A-Za-z0-9\s]+)\s+subscription/i,
    type: PatternType.CANCELLATION,
    score: 90,
    extractors: { serviceName: true }
  },
  {
    pattern: /cancellation\s+confirmation:?\s+([A-Za-z0-9\s]+)/i,
    type: PatternType.CANCELLATION,
    score: 85,
    extractors: { serviceName: true }
  }
];

// Legacy patterns for backward compatibility
export const SUBSCRIPTION_PATTERNS = [
  'has been subscribed',
  'subscription confirmed',
  'subscription has been activated',
  'welcome to your subscription',
  'recurring payment',
  'payment of [0-9]+(\\.[0-9]{2})? (?:USD|EUR|GBP)',
  'monthly subscription',
  'annual subscription',
  'you have subscribed',
  'subscription started',
  'trial period',
  'free trial',
  'trial has begun',
  'trial will end',
  'will be charged',
  'you will be billed',
  'auto-renewal',
  'renewal confirmation',
  'plan renewed', 
  'subscription renewed',
  'has been renewed',
  'bill paid',
  'payment successful',
  'payment confirmation',
  'subscription fee',
  'membership',
];

/**
 * Billing cycle detection patterns
 */
const BILLING_CYCLE_PATTERNS = [
  { pattern: /monthly|per month|\/month|each month|a month|every month/i, cycle: 'monthly' },
  { pattern: /yearly|per year|\/year|each year|a year|every year|annual|annually/i, cycle: 'yearly' },
  { pattern: /weekly|per week|\/week|each week|a week|every week/i, cycle: 'weekly' },
  { pattern: /quarterly|per quarter|\/quarter|each quarter|a quarter|every quarter|every 3 months/i, cycle: 'quarterly' },
  { pattern: /biannual|twice a year|every 6 months|bi-annual|semi-annual/i, cycle: 'biannual' }
];

/**
 * Detects the billing cycle from text
 * 
 * @param text The text to analyze
 * @returns The detected billing cycle or null
 */
export const detectBillingCycle = (text: string): string | null => {
  if (!text) return null;
  
  for (const { pattern, cycle } of BILLING_CYCLE_PATTERNS) {
    if (pattern.test(text)) {
      return cycle;
    }
  }
  
  return null;
};

/**
 * Analyzes text for subscription patterns and extracts relevant data
 * 
 * @param text The text to analyze
 * @param sender The sender of the message
 * @returns Pattern match result with confidence score and extracted data
 */
export const analyzeSubscriptionText = (text: string, sender: string): PatternMatchResult => {
  if (!text) {
    return {
      matched: false,
      confidence: 0,
      extractedData: {}
    };
  }
  
  const result: PatternMatchResult = {
    matched: false,
    confidence: 0,
    extractedData: {}
  };
  
  // First check for explicit patterns using the pattern registry
  let highestScore = 0;
  let matchedPattern: PatternDefinition | null = null;
  
  for (const patternDef of PATTERN_REGISTRY) {
    const match = text.match(patternDef.pattern);
    if (match) {
      if (patternDef.score > highestScore) {
        highestScore = patternDef.score;
        matchedPattern = patternDef;
        result.matched = true;
        result.confidence = patternDef.score;
        result.patternType = patternDef.type;
      }
    }
  }
  
  // Use the advanced data extraction utilities for best results
  const advancedExtraction = extractSubscriptionData(text, sender);
  
  // Extract service name using advanced method
  if (advancedExtraction.service) {
    result.extractedData.serviceName = advancedExtraction.service.normalizedName;
    
    // If we found a service name but didn't match a pattern, try to determine pattern type
    if (!result.matched && result.patternType === undefined) {
      // Attempt to infer pattern type from the text content
      if (text.toLowerCase().includes('renew') || text.toLowerCase().includes('next bill')) {
        result.patternType = PatternType.RENEWAL_NOTICE;
      } else if (text.toLowerCase().includes('welcome') || text.toLowerCase().includes('subscribed')) {
        result.patternType = PatternType.SUBSCRIPTION_CONFIRMATION;
      } else if (text.toLowerCase().includes('trial') && (text.toLowerCase().includes('end') || text.toLowerCase().includes('expir'))) {
        result.patternType = PatternType.TRIAL_ENDING;
      } else if (text.toLowerCase().includes('cancel')) {
        result.patternType = PatternType.CANCELLATION;
      } else if (text.toLowerCase().includes('price') && (text.toLowerCase().includes('change') || text.toLowerCase().includes('increas'))) {
        result.patternType = PatternType.PRICE_CHANGE;
      } else {
        // Default to payment confirmation if we can't determine
        result.patternType = PatternType.PAYMENT_CONFIRMATION;
      }
    }
  } else {
    // Fall back to legacy method if advanced fails
    const serviceName = extractServiceName(text, sender);
    if (serviceName) {
      result.extractedData.serviceName = serviceName;
    }
  }
  
  // Extract price and currency using advanced method
  if (advancedExtraction.amount) {
    result.extractedData.price = advancedExtraction.amount.value;
    result.extractedData.currency = advancedExtraction.amount.currency;
  } else {
    // Fall back to legacy method if advanced fails
    const price = extractPrice(text);
    if (price !== null) {
      result.extractedData.price = price;
    }
  }
  
  // Extract billing cycle using advanced method
  if (advancedExtraction.billingCycle) {
    result.extractedData.billingCycle = advancedExtraction.billingCycle.cycle;
  }
  
  // Extract date information using advanced method
  if (advancedExtraction.date) {
    result.extractedData.date = advancedExtraction.date.date.toISOString().split('T')[0];
    
    // For renewal or trial ending patterns, set next billing date
    if (result.patternType === PatternType.RENEWAL_NOTICE || 
        result.patternType === PatternType.TRIAL_ENDING) {
      result.extractedData.nextBillingDate = advancedExtraction.date.date.toISOString().split('T')[0];
    }
  }
  
  // If no pattern match but extraction has high confidence, consider it a match
  if (!result.matched && advancedExtraction.overallConfidence > 0.6) {
    result.matched = true;
    result.confidence = Math.floor(advancedExtraction.overallConfidence * 100);
  }
  
  return result;
};

/**
 * Checks if text contains any subscription patterns (legacy method)
 */
export const containsSubscriptionPattern = (text: string): boolean => {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Check for subscription patterns
  for (const pattern of SUBSCRIPTION_PATTERNS) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(lowerText)) {
      return true;
    }
  }
  
  // Check for known subscription services
  for (const service of SUBSCRIPTION_SERVICES) {
    const regex = new RegExp(`\\b${service}\\b`, 'i');
    if (regex.test(text)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Attempts to extract price from SMS message content
 * This implementation is enhanced with the advanced extractor
 */
export const extractPrice = (text: string): number | null => {
  // First try the advanced extractor
  const advancedAmount = extractAdvancedAmount(text);
  if (advancedAmount) {
    return advancedAmount.value;
  }
  
  // Fall back to legacy extraction
  if (!text) return null;
  
  // Look for common price patterns
  const pricePatterns = [
    // $XX.XX or $XX
    /\$\s*(\d+(?:\.\d{2})?)/i,
    // £XX.XX or £XX
    /£\s*(\d+(?:\.\d{2})?)/i,
    // €XX.XX or €XX
    /€\s*(\d+(?:\.\d{2})?)/i,
    // XX.XX USD or XX USD
    /(\d+(?:\.\d{2})?)\s*(?:USD|EUR|GBP)/i,
    // USD XX.XX or USD XX
    /(?:USD|EUR|GBP)\s*(\d+(?:\.\d{2})?)/i,
    // "for $XX.XX" or "of $XX.XX"
    /(?:for|of)\s+\$\s*(\d+(?:\.\d{2})?)/i,
    // "for XX.XX USD" or "of XX.XX USD"
    /(?:for|of)\s+(\d+(?:\.\d{2})?)\s*(?:USD|EUR|GBP)/i,
    // "amount: $XX.XX" or "price: $XX.XX"
    /(?:amount|price|cost|fee):\s*\$?\s*(\d+(?:\.\d{2})?)/i,
    // "XX.XX/month" or "XX.XX per month"
    /(\d+(?:\.\d{2})?)\s*(?:\/|\s+per\s+)(?:month|mo|year|yr|week|wk)/i,
    // Just "XX.XX" if there are subscription keywords nearby
    /(\d+\.\d{2})/i,
  ];
  
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }
  
  return null;
};

/**
 * Attempts to extract subscription service name from SMS message
 * Enhanced with the advanced service name extractor
 */
export const extractServiceName = (text: string, sender: string): string | null => {
  // First try the advanced extractor
  const advancedService = extractAdvancedServiceName(text, sender);
  if (advancedService) {
    return advancedService.normalizedName;
  }
  
  // Fall back to legacy extraction
  if (!text) return null;
  
  // First check if the sender is a known service
  for (const service of SUBSCRIPTION_SERVICES) {
    if (sender.toLowerCase().includes(service.toLowerCase())) {
      return service;
    }
  }
  
  // Then check if the text contains a known service
  for (const service of SUBSCRIPTION_SERVICES) {
    const regex = new RegExp(`\\b${service}\\b`, 'i');
    if (regex.test(text)) {
      return service;
    }
  }
  
  // Try to extract company name patterns
  const companyPatterns = [
    // "from XXX" or "by XXX"
    /(?:from|by)\s+([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?)/,
    // "XXX subscription" or "XXX membership"
    /([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?)\s+(?:subscription|membership)/,
    // "subscription to XXX" or "membership to XXX"
    /(?:subscription|membership)\s+(?:to|for)\s+([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?)/,
    // "your XXX plan" or "your XXX account"
    /your\s+([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)?)\s+(?:plan|account|subscription|membership)/i,
    // Check for any capitalized words that might be a company
    /\b([A-Z][A-Za-z0-9]+)\b/,
  ];
  
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If nothing found, return the sender as a fallback
  return sender || null;
};

/**
 * Registers a new pattern in the registry
 * 
 * @param pattern The regex pattern to add
 * @param type The type of pattern
 * @param score The confidence score (0-100)
 * @param extractors Optional extractors to enable for this pattern
 */
export const registerPattern = (
  pattern: RegExp,
  type: PatternType,
  score: number,
  extractors?: { price?: boolean; serviceName?: boolean; date?: boolean }
): void => {
  PATTERN_REGISTRY.push({
    pattern,
    type,
    score,
    extractors
  });
}; 