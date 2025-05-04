/**
 * Utilities for detecting subscription patterns in text
 */

/**
 * Subscription patterns to look for in SMS messages
 */
export const SUBSCRIPTION_PATTERNS = [
  // Common subscription confirmation patterns
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
];

/**
 * Checks if text contains any subscription patterns
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
 */
export const extractPrice = (text: string): number | null => {
  if (!text) return null;
  
  // Look for common price patterns
  const pricePatterns = [
    // $XX.XX or $XX
    /\$\s*(\d+(?:\.\d{2})?)/i,
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
    // "XX.XX"
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
 */
export const extractServiceName = (text: string, sender: string): string | null => {
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