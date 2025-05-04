/**
 * Advanced Subscription Data Extraction Utilities
 *
 * This module provides enhanced extraction capabilities for subscription-related
 * information from text messages, with improved accuracy and confidence scoring.
 */

import { SUBSCRIPTION_SERVICES } from './subscriptionPatternUtils';

/**
 * Normalized currency amount with value and currency code
 */
export interface NormalizedAmount {
  value: number;
  currency: string;
  originalText: string;
  confidence: number;
}

/**
 * Normalized date information
 */
export interface ExtractedDate {
  date: Date;
  originalText: string;
  isRelative: boolean;
  confidence: number;
}

/**
 * Normalized service information
 */
export interface ExtractedService {
  name: string;
  normalizedName: string;
  confidence: number;
}

/**
 * Normalized billing cycle information
 */
export interface ExtractedBillingCycle {
  cycle: string; // 'monthly', 'yearly', etc.
  intervalCount?: number; // For custom intervals like "every 3 months"
  confidence: number;
}

/**
 * Complete extraction result
 */
export interface ExtractionResult {
  amount?: NormalizedAmount;
  service?: ExtractedService;
  date?: ExtractedDate;
  billingCycle?: ExtractedBillingCycle;
  overallConfidence: number;
}

/**
 * Currency mapping from symbol to ISO code
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₹': 'INR',
  '₩': 'KRW',
  R$: 'BRL',
  kr: 'SEK',
  C$: 'CAD',
  A$: 'AUD',
  CHF: 'CHF',
  NZ$: 'NZD',
  '₽': 'RUB',
  '฿': 'THB',
  '₺': 'TRY',
  'ر.س': 'SAR',
  'د.إ': 'AED',
  '₴': 'UAH',
  zł: 'PLN',
  Kč: 'CZK',
  RM: 'MYR',
  '₱': 'PHP',
  '₦': 'NGN',
};

/**
 * Mapping of currency names to ISO codes
 */
const CURRENCY_NAMES: Record<string, string> = {
  dollars: 'USD',
  usd: 'USD',
  euros: 'EUR',
  eur: 'EUR',
  pounds: 'GBP',
  gbp: 'GBP',
  yen: 'JPY',
  rupees: 'INR',
  won: 'KRW',
  reais: 'BRL',
  kronor: 'SEK',
  'canadian dollars': 'CAD',
  cad: 'CAD',
  'australian dollars': 'AUD',
  aud: 'AUD',
  'swiss francs': 'CHF',
  'new zealand dollars': 'NZD',
  nzd: 'NZD',
  rubles: 'RUB',
  rub: 'RUB',
  baht: 'THB',
  lira: 'TRY',
  try: 'TRY',
  riyal: 'SAR',
  dirhams: 'AED',
  hryvnia: 'UAH',
  zloty: 'PLN',
  koruna: 'CZK',
  ringgit: 'MYR',
  peso: 'PHP',
  naira: 'NGN',
};

/**
 * Service name variations and their normalized forms
 */
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
  'xbox game pass': 'Xbox Game Pass',
  'xbox live': 'Xbox Live',
  xbox: 'Xbox',
  'playstation plus': 'PlayStation Plus',
  'ps plus': 'PlayStation Plus',
  'ps+': 'PlayStation Plus',
  'ea play': 'EA Play',
  office365: 'Microsoft 365',
  'office 365': 'Microsoft 365',
  'microsoft 365': 'Microsoft 365',
  'ms 365': 'Microsoft 365',
  'google one': 'Google One',
  'google play': 'Google Play',
  'play pass': 'Google Play Pass',
  'google fi': 'Google Fi',
  'google storage': 'Google One',
  stadia: 'Google Stadia',
  crunchyroll: 'Crunchyroll',
  funimation: 'Funimation',
  twitch: 'Twitch',
  'twitch prime': 'Twitch Prime',
  'amazon music': 'Amazon Music',
  'kindle unlimited': 'Kindle Unlimited',
  audible: 'Audible',
  'audible plus': 'Audible Plus',
  'nintendo switch online': 'Nintendo Switch Online',
  'nintendo online': 'Nintendo Switch Online',
  'gym membership': 'Gym Membership',
  'planet fitness': 'Planet Fitness',
  'adobe cc': 'Adobe Creative Cloud',
  'adobe creative cloud': 'Adobe Creative Cloud',
  adobe: 'Adobe',
  photoshop: 'Adobe Photoshop',
  lightroom: 'Adobe Lightroom',
  dropbox: 'Dropbox',
  'dropbox plus': 'Dropbox Plus',
  zoom: 'Zoom',
  'zoom pro': 'Zoom Pro',
  slack: 'Slack',
  notion: 'Notion',
  'notion plus': 'Notion Plus',
  'notion pro': 'Notion Pro',
  evernote: 'Evernote',
  trello: 'Trello',
  lastpass: 'LastPass',
  '1password': '1Password',
  dashlane: 'Dashlane',
  vpn: 'VPN Service',
  nordvpn: 'NordVPN',
  expressvpn: 'ExpressVPN',
  surfshark: 'Surfshark',
  protonvpn: 'ProtonVPN',
  protonmail: 'ProtonMail',
  mailchimp: 'Mailchimp',
  squarespace: 'Squarespace',
  wix: 'Wix',
  shopify: 'Shopify',
  canva: 'Canva',
  'canva pro': 'Canva Pro',
};

/**
 * Billing cycle variations and their normalized forms
 */
const BILLING_CYCLES: Record<string, string> = {
  monthly: 'monthly',
  'per month': 'monthly',
  '/month': 'monthly',
  '/mo': 'monthly',
  'each month': 'monthly',
  'a month': 'monthly',
  'every month': 'monthly',
  'monthly subscription': 'monthly',
  mo: 'monthly',

  yearly: 'yearly',
  annual: 'yearly',
  annually: 'yearly',
  'per year': 'yearly',
  '/year': 'yearly',
  '/yr': 'yearly',
  'each year': 'yearly',
  'a year': 'yearly',
  'every year': 'yearly',
  yr: 'yearly',

  weekly: 'weekly',
  'per week': 'weekly',
  '/week': 'weekly',
  '/wk': 'weekly',
  'each week': 'weekly',
  'a week': 'weekly',
  'every week': 'weekly',
  wk: 'weekly',

  quarterly: 'quarterly',
  'per quarter': 'quarterly',
  '/quarter': 'quarterly',
  'each quarter': 'quarterly',
  'a quarter': 'quarterly',
  'every quarter': 'quarterly',
  'every 3 months': 'quarterly',
  '3 months': 'quarterly',
  '3mo': 'quarterly',
  '3-month': 'quarterly',

  biannual: 'biannual',
  'semi-annual': 'biannual',
  'semi annual': 'biannual',
  'twice a year': 'biannual',
  'every 6 months': 'biannual',
  '6 months': 'biannual',
  '6mo': 'biannual',
  '6-month': 'biannual',

  daily: 'daily',
  'per day': 'daily',
  '/day': 'daily',
  'each day': 'daily',
  'a day': 'daily',
  'every day': 'daily',
};

/**
 * Date format patterns to extract dates from text
 */
const DATE_PATTERNS = [
  // MM/DD/YYYY
  {
    pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    format: (m: RegExpMatchArray) => new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2])),
    confidence: 0.9,
  },
  // MM/DD/YY
  {
    pattern: /(\d{1,2})\/(\d{1,2})\/(\d{2})/,
    format: (m: RegExpMatchArray) => {
      const year = parseInt(m[3]) < 50 ? 2000 + parseInt(m[3]) : 1900 + parseInt(m[3]);
      return new Date(year, parseInt(m[1]) - 1, parseInt(m[2]));
    },
    confidence: 0.85,
  },
  // DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
  {
    pattern: /(\d{1,2})[.-](\d{1,2})[.-](\d{4})/,
    format: (m: RegExpMatchArray) => new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1])),
    confidence: 0.85,
  },
  // DD-MM-YY or DD.MM.YY
  {
    pattern: /(\d{1,2})[.-](\d{1,2})[.-](\d{2})/,
    format: (m: RegExpMatchArray) => {
      const year = parseInt(m[3]) < 50 ? 2000 + parseInt(m[3]) : 1900 + parseInt(m[3]);
      return new Date(year, parseInt(m[2]) - 1, parseInt(m[1]));
    },
    confidence: 0.8,
  },
  // Mon DD, YYYY
  {
    pattern:
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,\s*(\d{4})/i,
    format: (m: RegExpMatchArray) => {
      const months = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };
      const monthKey = m[1].toLowerCase().substring(0, 3) as keyof typeof months;
      return new Date(parseInt(m[3]), months[monthKey], parseInt(m[2]));
    },
    confidence: 0.9,
  },
  // YYYY-MM-DD
  {
    pattern: /(\d{4})-(\d{1,2})-(\d{1,2})/,
    format: (m: RegExpMatchArray) => new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])),
    confidence: 0.95,
  },
  // DD Month YYYY
  {
    pattern:
      /(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
    format: (m: RegExpMatchArray) => {
      const months = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };
      const monthKey = m[2].toLowerCase().substring(0, 3) as keyof typeof months;
      return new Date(parseInt(m[3]), months[monthKey], parseInt(m[1]));
    },
    confidence: 0.9,
  },
  // Month DD YYYY
  {
    pattern:
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})/i,
    format: (m: RegExpMatchArray) => {
      const months = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };
      const monthKey = m[1].toLowerCase().substring(0, 3) as keyof typeof months;
      return new Date(parseInt(m[3]), months[monthKey], parseInt(m[2]));
    },
    confidence: 0.9,
  },
  // Month DD
  {
    pattern: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?/i,
    format: (m: RegExpMatchArray) => {
      const months = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };
      const monthKey = m[1].toLowerCase().substring(0, 3) as keyof typeof months;
      const currentYear = new Date().getFullYear();
      return new Date(currentYear, months[monthKey], parseInt(m[2]));
    },
    confidence: 0.75,
  },
];

/**
 * Relative date patterns
 */
const RELATIVE_DATE_PATTERNS = [
  // "in X days"
  {
    pattern: /in\s+(\d+)\s+days?/i,
    format: (m: RegExpMatchArray) => {
      const days = parseInt(m[1]);
      const date = new Date();
      date.setDate(date.getDate() + days);
      return { date, isRelative: true };
    },
  },
  // "in X weeks"
  {
    pattern: /in\s+(\d+)\s+weeks?/i,
    format: (m: RegExpMatchArray) => {
      const weeks = parseInt(m[1]);
      const date = new Date();
      date.setDate(date.getDate() + weeks * 7);
      return { date, isRelative: true };
    },
  },
  // "in X months"
  {
    pattern: /in\s+(\d+)\s+months?/i,
    format: (m: RegExpMatchArray) => {
      const months = parseInt(m[1]);
      const date = new Date();
      date.setMonth(date.getMonth() + months);
      return { date, isRelative: true };
    },
  },
  // "tomorrow"
  {
    pattern: /tomorrow/i,
    format: () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return { date, isRelative: true };
    },
  },
  // "next week"
  {
    pattern: /next\s+week/i,
    format: () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return { date, isRelative: true };
    },
  },
  // "next month"
  {
    pattern: /next\s+month/i,
    format: () => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return { date, isRelative: true };
    },
  },
  // "next year"
  {
    pattern: /next\s+year/i,
    format: () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      return { date, isRelative: true };
    },
  },
  // "X days from now"
  {
    pattern: /(\d+)\s+days?\s+from\s+now/i,
    format: (m: RegExpMatchArray) => {
      const days = parseInt(m[1]);
      const date = new Date();
      date.setDate(date.getDate() + days);
      return { date, isRelative: true };
    },
  },
];

/**
 * Extracts and normalizes currency amount from text
 *
 * @param text The text to extract amount from
 * @returns Normalized amount with currency or null if not found
 */
export function extractAmount(text: string): NormalizedAmount | null {
  if (!text) return null;

  // Currency detection patterns with explicit symbols
  const explicitPatterns = [
    // $XX.XX or $XX
    {
      pattern: /(?:^|\s)([$€£¥₹₩₽₺₴₱₦฿])\s*(\d+(?:[.,]\d{1,2})?)/i,
      confidence: 0.9,
      symbolIndex: 1,
      valueIndex: 2,
    },

    // XX.XX$ or XX€ (symbol after number)
    {
      pattern: /(?:^|\s)(\d+(?:[.,]\d{1,2})?)\s*([$€£¥₹₩₽₺₴₱₦฿])(?:\s|$)/i,
      confidence: 0.85,
      symbolIndex: 2,
      valueIndex: 1,
    },

    // Multi-character currency symbols (R$, C$, etc.)
    {
      pattern: /(?:^|\s)(R\$|C\$|A\$|NZ\$|HK\$|S\$|ر\.س|د\.إ|kr|Kč|zł|RM)\s*(\d+(?:[.,]\d{1,2})?)/i,
      confidence: 0.85,
      symbolIndex: 1,
      valueIndex: 2,
    },

    // XX.XX USD or XX USD (code after)
    {
      pattern:
        /(?:^|\s)(\d+(?:[.,]\d{1,2})?)\s*(USD|EUR|GBP|JPY|INR|KRW|BRL|SEK|CAD|AUD|CHF|NZD|RUB|THB|TRY|SAR|AED|UAH|PLN|CZK|MYR|PHP|NGN)(?:\s|$)/i,
      confidence: 0.85,
      symbolIndex: 2,
      valueIndex: 1,
      isCode: true,
    },

    // USD XX.XX or USD XX (code before)
    {
      pattern:
        /(?:^|\s)(USD|EUR|GBP|JPY|INR|KRW|BRL|SEK|CAD|AUD|CHF|NZD|RUB|THB|TRY|SAR|AED|UAH|PLN|CZK|MYR|PHP|NGN)\s*(\d+(?:[.,]\d{1,2})?)(?:\s|$)/i,
      confidence: 0.85,
      symbolIndex: 1,
      valueIndex: 2,
      isCode: true,
    },
  ];

  // Currency with prepositions or labels
  const contextualPatterns = [
    // "for $XX.XX" or "of $XX.XX"
    {
      pattern: /(?:for|of)\s+([$€£¥₹₩₽₺₴₱₦฿])\s*(\d+(?:[.,]\d{1,2})?)/i,
      confidence: 0.85,
      symbolIndex: 1,
      valueIndex: 2,
    },

    // "for XX.XX USD" or "of XX.XX USD"
    {
      pattern:
        /(?:for|of)\s+(\d+(?:[.,]\d{1,2})?)\s*(USD|EUR|GBP|JPY|INR|KRW|BRL|SEK|CAD|AUD|CHF|NZD|RUB|THB|TRY|SAR|AED|UAH|PLN|CZK|MYR|PHP|NGN)/i,
      confidence: 0.85,
      symbolIndex: 2,
      valueIndex: 1,
      isCode: true,
    },

    // "amount: $XX.XX" or "price: $XX.XX"
    {
      pattern:
        /(?:amount|price|cost|fee|charge|payment):\s*([$€£¥₹₩₽₺₴₱₦฿])\s*(\d+(?:[.,]\d{1,2})?)/i,
      confidence: 0.9,
      symbolIndex: 1,
      valueIndex: 2,
    },

    // "amount: XX.XX USD" or "price: XX.XX USD"
    {
      pattern:
        /(?:amount|price|cost|fee|charge|payment):\s*(\d+(?:[.,]\d{1,2})?)\s*(USD|EUR|GBP|JPY|INR|KRW|BRL|SEK|CAD|AUD|CHF|NZD|RUB|THB|TRY|SAR|AED|UAH|PLN|CZK|MYR|PHP|NGN)/i,
      confidence: 0.9,
      symbolIndex: 2,
      valueIndex: 1,
      isCode: true,
    },

    // "payment/charge of $XX.XX"
    {
      pattern:
        /(?:payment|charge|fee|subscription|bill)[^\n]*?(?:of|for)\s+([$€£¥₹₩₽₺₴₱₦฿])\s*(\d+(?:[.,]\d{1,2})?)/i,
      confidence: 0.9,
      symbolIndex: 1,
      valueIndex: 2,
    },

    // "payment/charge of XX.XX USD"
    {
      pattern:
        /(?:payment|charge|fee|subscription|bill)[^\n]*?(?:of|for)\s+(\d+(?:[.,]\d{1,2})?)\s*(USD|EUR|GBP|JPY|INR|KRW|BRL|SEK|CAD|AUD|CHF|NZD|RUB|THB|TRY|SAR|AED|UAH|PLN|CZK|MYR|PHP|NGN)/i,
      confidence: 0.9,
      symbolIndex: 2,
      valueIndex: 1,
      isCode: true,
    },
  ];

  // Currency with natural language names
  const naturalLanguagePatterns = [
    // "XX.XX dollars" or "XX dollars"
    {
      pattern:
        /(\d+(?:[.,]\d{1,2})?)\s+(dollars|euros|pounds|yen|rupees|won|reais|kronor|francs|baht|lira|riyal|dirhams|hryvnia|zloty|koruna|ringgit|peso|naira)(?:\s|$)/i,
      confidence: 0.8,
      nameIndex: 2,
      valueIndex: 1,
    },

    // "XX.XX US dollars" or "XX US dollars"
    {
      pattern:
        /(\d+(?:[.,]\d{1,2})?)\s+(?:US|canadian|australian|new zealand)\s+(dollars|euros|pounds)(?:\s|$)/i,
      confidence: 0.85,
      complexName: true,
      valueIndex: 1,
    },
  ];

  // Billing cycle with amount patterns
  const billingPatterns = [
    // "XX.XX/month" or "XX.XX per month"
    {
      pattern: /(\d+(?:[.,]\d{1,2})?)\s*(?:\/|\s+per\s+)(month|mo|year|yr|week|wk|day)(?:\s|$)/i,
      confidence: 0.8,
      cycleIndex: 2,
      valueIndex: 1,
    },

    // "$XX.XX/month" or "$XX.XX per month"
    {
      pattern:
        /([$€£¥₹₩₽₺₴₱₦฿])\s*(\d+(?:[.,]\d{1,2})?)\s*(?:\/|\s+per\s+)(month|mo|year|yr|week|wk|day)(?:\s|$)/i,
      confidence: 0.85,
      symbolIndex: 1,
      valueIndex: 2,
      cycleIndex: 3,
    },
  ];

  // Try explicit patterns first (highest confidence)
  for (const pattern of explicitPatterns) {
    const match = text.match(pattern.pattern);
    if (match && match[pattern.valueIndex]) {
      const value = parseFloat(match[pattern.valueIndex].replace(/,/g, '.'));

      if (!isNaN(value)) {
        let currency = 'USD'; // Default

        if (pattern.isCode) {
          // Use the currency code directly
          currency = match[pattern.symbolIndex].toUpperCase();
        } else {
          // Use the symbol to find the currency
          const symbol = match[pattern.symbolIndex];
          if (CURRENCY_SYMBOLS[symbol]) {
            currency = CURRENCY_SYMBOLS[symbol];
          } else {
            // Try to detect currency from context if symbol not recognized
            const contextCurrency = detectCurrencyFromContext(text);
            if (contextCurrency) currency = contextCurrency;
          }
        }

        return {
          value,
          currency,
          originalText: match[0].trim(),
          confidence: pattern.confidence,
        };
      }
    }
  }

  // Try contextual patterns (good confidence)
  for (const pattern of contextualPatterns) {
    const match = text.match(pattern.pattern);
    if (match && match[pattern.valueIndex]) {
      const value = parseFloat(match[pattern.valueIndex].replace(/,/g, '.'));

      if (!isNaN(value)) {
        let currency = 'USD'; // Default

        if (pattern.isCode) {
          // Use the currency code directly
          currency = match[pattern.symbolIndex].toUpperCase();
        } else {
          // Use the symbol to find the currency
          const symbol = match[pattern.symbolIndex];
          if (CURRENCY_SYMBOLS[symbol]) {
            currency = CURRENCY_SYMBOLS[symbol];
          } else {
            // Try to detect currency from context if symbol not recognized
            const contextCurrency = detectCurrencyFromContext(text);
            if (contextCurrency) currency = contextCurrency;
          }
        }

        return {
          value,
          currency,
          originalText: match[0].trim(),
          confidence: pattern.confidence,
        };
      }
    }
  }

  // Try natural language patterns (medium confidence)
  for (const pattern of naturalLanguagePatterns) {
    const match = text.match(pattern.pattern);
    if (match && match[pattern.valueIndex]) {
      const value = parseFloat(match[pattern.valueIndex].replace(/,/g, '.'));

      if (!isNaN(value)) {
        let currency = 'USD'; // Default

        if (pattern.complexName) {
          // Handle complex names like "US dollars"
          const fullText = match[0].toLowerCase();
          if (fullText.includes('us dollars')) currency = 'USD';
          else if (fullText.includes('canadian')) currency = 'CAD';
          else if (fullText.includes('australian')) currency = 'AUD';
          else if (fullText.includes('new zealand')) currency = 'NZD';
        } else {
          // Use the currency name to find the code
          const currencyName = match[pattern.nameIndex].toLowerCase();
          if (CURRENCY_NAMES[currencyName]) {
            currency = CURRENCY_NAMES[currencyName];
          }
        }

        return {
          value,
          currency,
          originalText: match[0].trim(),
          confidence: pattern.confidence,
        };
      }
    }
  }

  // Try billing cycle patterns (lower confidence)
  for (const pattern of billingPatterns) {
    const match = text.match(pattern.pattern);
    if (match && match[pattern.valueIndex]) {
      const value = parseFloat(match[pattern.valueIndex].replace(/,/g, '.'));

      if (!isNaN(value)) {
        let currency = 'USD'; // Default

        // If we have a symbol present, use it
        if (pattern.symbolIndex && match[pattern.symbolIndex]) {
          const symbol = match[pattern.symbolIndex];
          if (CURRENCY_SYMBOLS[symbol]) {
            currency = CURRENCY_SYMBOLS[symbol];
          }
        } else {
          // Try to detect currency from context
          const contextCurrency = detectCurrencyFromContext(text);
          if (contextCurrency) currency = contextCurrency;
        }

        return {
          value,
          currency,
          originalText: match[0].trim(),
          confidence: pattern.confidence,
        };
      }
    }
  }

  // Last resort: look for just decimal amounts in subscription-related texts (lowest confidence)
  if (
    text.toLowerCase().includes('subscription') ||
    text.toLowerCase().includes('payment') ||
    text.toLowerCase().includes('charge')
  ) {
    const match = text.match(/(\d+\.\d{2})(?!\d)/);
    if (match && match[1]) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        // Try to detect currency from context
        const contextCurrency = detectCurrencyFromContext(text);

        return {
          value,
          currency: contextCurrency || 'USD',
          originalText: match[0],
          confidence: 0.6, // Lower confidence for this fallback
        };
      }
    }
  }

  return null;
}

/**
 * Extracts and normalizes service name from text and sender information
 *
 * @param text The text to extract service name from
 * @param sender Optional sender information to use as additional context
 * @returns Extracted service information or null if not found
 */
export function extractServiceName(text: string, sender?: string): ExtractedService | null {
  if (!text && !sender) return null;

  // Normalize input
  const normalizedText = text ? text.toLowerCase() : '';
  const normalizedSender = sender ? sender.toLowerCase() : '';

  // Service name extraction strategies in order of confidence

  // Strategy 1: Try to find direct mention of a known service in text (highest confidence)
  for (const [alias, normalized] of Object.entries(SERVICE_ALIASES)) {
    // Look for exact matches (surrounded by word boundaries)
    const pattern = new RegExp(`\\b${alias.replace(/\+/g, '\\+')}\\b`, 'i');
    if (normalizedText && pattern.test(normalizedText)) {
      return {
        name: alias,
        normalizedName: normalized,
        confidence: 0.95,
      };
    }
  }

  // Strategy 2: Check the sender for known services (high confidence)
  if (sender) {
    // First check email domains
    if (sender.includes('@')) {
      const emailDomain = sender.split('@')[1].toLowerCase();

      // Check for service name in domain
      for (const [alias, normalized] of Object.entries(SERVICE_ALIASES)) {
        const cleanAlias = alias.replace(/\s+/g, '').replace(/\+/g, '');
        if (emailDomain.includes(cleanAlias)) {
          return {
            name: emailDomain,
            normalizedName: normalized,
            confidence: 0.9,
          };
        }
      }

      // Extract company name from email domain
      const domainParts = emailDomain.split('.');
      if (domainParts.length >= 2) {
        const companyName = domainParts[0];

        // Check if this domain part matches any known alias
        for (const [alias, normalized] of Object.entries(SERVICE_ALIASES)) {
          const cleanAlias = alias.replace(/\s+/g, '').replace(/\+/g, '');
          if (cleanAlias === companyName) {
            return {
              name: companyName,
              normalizedName: normalized,
              confidence: 0.9,
            };
          }
        }

        // If we still haven't found a match, use the domain as is
        // Capitalize first letter of each part
        const capitalizedName = companyName
          .split(/[_\-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

        if (capitalizedName.length > 2) {
          // Avoid single-letter names
          return {
            name: companyName,
            normalizedName: capitalizedName,
            confidence: 0.85,
          };
        }
      }
    } else {
      // For non-email senders (e.g., SMS short codes or names)
      for (const [alias, normalized] of Object.entries(SERVICE_ALIASES)) {
        const cleanAlias = alias.replace(/\s+/g, '').replace(/\+/g, '');
        if (normalizedSender.includes(cleanAlias)) {
          return {
            name: sender,
            normalizedName: normalized,
            confidence: 0.9,
          };
        }
      }

      // If no match found, try to clean up and use the sender as is
      if (normalizedSender.length > 2) {
        // Remove common SMS sender prefixes
        const cleanedSender = normalizedSender
          .replace(/^sms-/, '')
          .replace(/^txt-/, '')
          .replace(/^info-/, '')
          .replace(/^alert-/, '');

        // Capitalize first letter of each word
        const capitalizedName = cleanedSender
          .split(/[\s_\-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

        return {
          name: normalizedSender,
          normalizedName: capitalizedName,
          confidence: 0.8,
        };
      }
    }
  }

  // Strategy 3: Try to extract service name from common text patterns (medium confidence)
  const servicePatterns = [
    // "from Company" or "by Company"
    {
      pattern: /(?:from|by)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})(?:\s|:|,|\.|$)/i,
      confidence: 0.85,
    },

    // "Company subscription" or "Company membership"
    {
      pattern:
        /([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})\s+(?:subscription|membership|plan|service)(?:\s|:|,|\.|$)/i,
      confidence: 0.85,
    },

    // "subscription to Company" or "membership to Company"
    {
      pattern:
        /(?:subscription|membership|payment)\s+(?:to|for|from)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})(?:\s|:|,|\.|$)/i,
      confidence: 0.85,
    },

    // "your Company plan" or "your Company account"
    {
      pattern:
        /your\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})\s+(?:plan|account|subscription|membership|service)(?:\s|:|,|\.|$)/i,
      confidence: 0.85,
    },

    // "Company charges"
    {
      pattern:
        /([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})\s+(?:charges|fees|billing)(?:\s|:|,|\.|$)/i,
      confidence: 0.8,
    },

    // "thank you for subscribing to Company"
    {
      pattern:
        /thank\s+you\s+for\s+(?:subscribe|subscribing|your\s+subscription)\s+(?:to|with)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})(?:\s|:|,|\.|$)/i,
      confidence: 0.9,
    },

    // "welcome to Company"
    {
      pattern: /welcome\s+to\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,2})(?:\s|:|,|\.|$)/i,
      confidence: 0.85,
    },
  ];

  for (const { pattern, confidence } of servicePatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const extractedName = match[1].trim();

      // Check if it matches any known aliases
      for (const [alias, normalized] of Object.entries(SERVICE_ALIASES)) {
        if (
          extractedName.toLowerCase() === alias.toLowerCase() ||
          normalized.toLowerCase() === extractedName.toLowerCase()
        ) {
          return {
            name: extractedName,
            normalizedName: normalized,
            confidence,
          };
        }
      }

      // If no alias match, return the extracted name
      return {
        name: extractedName,
        normalizedName: extractedName,
        confidence,
      };
    }
  }

  // Strategy 4: Look for company or brand indicators in text (lower confidence)

  // Check for capitalized words that might be a company name
  // This is lower confidence because it can produce false positives
  const capitalizedWordMatch = normalizedText.match(/\b([A-Z][A-Za-z0-9]{2,})(?:\s|$)/);
  if (capitalizedWordMatch && capitalizedWordMatch[1]) {
    const potentialName = capitalizedWordMatch[1];

    // Only accept if it's not a common word
    const commonWords = [
      'This',
      'Your',
      'Please',
      'Thank',
      'Information',
      'Message',
      'Subscription',
      'Payment',
    ];
    if (!commonWords.some(word => word.toLowerCase() === potentialName.toLowerCase())) {
      return {
        name: potentialName,
        normalizedName: potentialName,
        confidence: 0.7,
      };
    }
  }

  // Strategy 5: Fallback to sender if nothing else found
  if (sender && sender.length > 2) {
    // Clean up sender (remove common prefixes, email formatting)
    const cleanName = sender
      .replace(/@.*$/, '') // Remove email domain
      .replace(/^[0-9]+$/, '') // Remove pure numeric senders
      .replace(
        /^(sms|txt|info|alert|noreply|no-reply|billing|support|service|notification)[\s\-_:]+/i,
        ''
      )
      .trim();

    if (cleanName.length > 2) {
      // Capitalize first letter of each word
      const capitalizedName = cleanName
        .split(/[\s_\-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      return {
        name: sender,
        normalizedName: capitalizedName,
        confidence: 0.6,
      };
    }
  }

  return null;
}

/**
 * Extracts and normalizes date information from text
 *
 * @param text The text to extract date from
 * @returns Extracted date information or null if not found
 */
export function extractDate(text: string): ExtractedDate | null {
  if (!text) return null;

  // Try to extract absolute dates first (highest confidence)
  for (const { pattern, format, confidence } of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = format(match);

        // Verify the date is valid and not too far in the past/future
        const now = new Date();
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(now.getFullYear() - 5);

        const fiveYearsFromNow = new Date();
        fiveYearsFromNow.setFullYear(now.getFullYear() + 5);

        if (date >= fiveYearsAgo && date <= fiveYearsFromNow) {
          return {
            date,
            originalText: match[0],
            isRelative: false,
            confidence,
          };
        }
      } catch (error) {
        // Skip invalid dates
        continue;
      }
    }
  }

  // Now try to extract relative dates (context-dependent)
  const lowerText = text.toLowerCase();
  const now = new Date();

  // Relative date patterns with extraction functions
  const relativePatterns = [
    // Tomorrow
    {
      pattern: /\b(?:tomorrow)\b/i,
      extract: () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date;
      },
      confidence: 0.9,
    },
    // Next week
    {
      pattern: /\b(?:next\s+week)\b/i,
      extract: () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
      },
      confidence: 0.85,
    },
    // Next month
    {
      pattern: /\b(?:next\s+month)\b/i,
      extract: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date;
      },
      confidence: 0.85,
    },
    // Next [day of week]
    {
      pattern: /\b(?:next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
      extract: (match: RegExpMatchArray) => {
        const daysOfWeek = {
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
          sunday: 0,
        };
        const targetDay = daysOfWeek[match[1].toLowerCase() as keyof typeof daysOfWeek];
        const date = new Date();

        const currentDay = date.getDay();
        const daysToAdd = (targetDay + 7 - currentDay) % 7;
        date.setDate(date.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));

        return date;
      },
      confidence: 0.85,
    },
    // In X days
    {
      pattern: /\bin\s+(\d+)\s+days?\b/i,
      extract: (match: RegExpMatchArray) => {
        const days = parseInt(match[1]);
        if (isNaN(days) || days > 365) return null;

        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
      },
      confidence: 0.9,
    },
    // In X weeks
    {
      pattern: /\bin\s+(\d+)\s+weeks?\b/i,
      extract: (match: RegExpMatchArray) => {
        const weeks = parseInt(match[1]);
        if (isNaN(weeks) || weeks > 52) return null;

        const date = new Date();
        date.setDate(date.getDate() + weeks * 7);
        return date;
      },
      confidence: 0.85,
    },
    // In X months
    {
      pattern: /\bin\s+(\d+)\s+months?\b/i,
      extract: (match: RegExpMatchArray) => {
        const months = parseInt(match[1]);
        if (isNaN(months) || months > 24) return null;

        const date = new Date();
        date.setMonth(date.getMonth() + months);
        return date;
      },
      confidence: 0.85,
    },
    // On [day of week]
    {
      pattern: /\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      extract: (match: RegExpMatchArray) => {
        const daysOfWeek = {
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
          sunday: 0,
        };
        const targetDay = daysOfWeek[match[1].toLowerCase() as keyof typeof daysOfWeek];
        const date = new Date();

        const currentDay = date.getDay();
        const daysToAdd = (targetDay - currentDay + 7) % 7;
        date.setDate(date.getDate() + daysToAdd);

        return date;
      },
      confidence: 0.8,
    },
  ];

  for (const { pattern, extract, confidence } of relativePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = extract(match);
        if (date) {
          return {
            date,
            originalText: match[0],
            isRelative: true,
            confidence,
          };
        }
      } catch (error) {
        // Skip invalid dates
        continue;
      }
    }
  }

  // Context-based date extraction for common phrases
  const contextPatterns = [
    // Ends on, renews on, expires on
    {
      pattern:
        /(?:ends|renews|expires|starts|begins|processes|renews|scheduled)(?:\s+on)?\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
      confidence: 0.85,
    },
    // On date
    {
      pattern:
        /on\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
      confidence: 0.8,
    },
    // Date at beginning of sentence with context
    {
      pattern:
        /(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})(?:\s+is|,\s+your|\s+we)/i,
      confidence: 0.75,
    },
  ];

  for (const { pattern, confidence } of contextPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // The extracted date string should now be in match[1]
      // Try all date patterns again on this substring
      for (const { pattern: datePattern, format } of DATE_PATTERNS) {
        const dateMatch = match[1].match(datePattern);
        if (dateMatch) {
          try {
            const date = format(dateMatch);

            // Verify the date is valid
            const now = new Date();
            const fiveYearsAgo = new Date();
            fiveYearsAgo.setFullYear(now.getFullYear() - 5);

            const fiveYearsFromNow = new Date();
            fiveYearsFromNow.setFullYear(now.getFullYear() + 5);

            if (date >= fiveYearsAgo && date <= fiveYearsFromNow) {
              return {
                date,
                originalText: match[0],
                isRelative: false,
                confidence, // Use the context pattern confidence
              };
            }
          } catch (error) {
            // Skip invalid dates
            continue;
          }
        }
      }

      // If we've made it here, we found a context pattern but couldn't parse the date
      // Try to use natural language parsing as a last resort
      try {
        // Simple month name extraction (not full NLP but better than nothing)
        const monthMatch = match[1].match(
          /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i
        );
        if (monthMatch) {
          const dayMatch = match[1].match(/\d{1,2}/);
          if (dayMatch) {
            const months = {
              jan: 0,
              feb: 1,
              mar: 2,
              apr: 3,
              may: 4,
              jun: 5,
              jul: 6,
              aug: 7,
              sep: 8,
              oct: 9,
              nov: 10,
              dec: 11,
            };
            const monthKey = monthMatch[0].toLowerCase().substring(0, 3) as keyof typeof months;
            const day = parseInt(dayMatch[0]);

            const yearMatch = match[1].match(/\d{4}/);
            const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

            try {
              const date = new Date(year, months[monthKey], day);
              return {
                date,
                originalText: match[0],
                isRelative: false,
                confidence: 0.7, // Lower confidence for this fallback
              };
            } catch (error) {
              // Skip invalid dates
              continue;
            }
          }
        }
      } catch (error) {
        // Skip if any error occurs
        continue;
      }
    }
  }

  return null;
}

/**
 * Extracts and normalizes billing cycle information from text
 *
 * @param text The text to extract billing cycle from
 * @returns Extracted billing cycle information or null if not found
 */
export function extractBillingCycle(text: string): ExtractedBillingCycle | null {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  // First, look for exact matches in billing cycle dictionary
  for (const [pattern, cycle] of Object.entries(BILLING_CYCLES)) {
    const regex = new RegExp(`\\b${pattern.replace(/\//g, '\\/')}\\b`, 'i');
    if (regex.test(lowerText)) {
      return {
        cycle,
        confidence: 0.9,
      };
    }
  }

  // Handle custom intervals (X month, X year patterns)
  const customIntervalPatterns = [
    // Every X months
    {
      pattern: /every\s+(\d+)\s+months/i,
      unit: 'month',
      confidence: 0.85,
    },
    // Every X years
    {
      pattern: /every\s+(\d+)\s+years/i,
      unit: 'year',
      confidence: 0.85,
    },
    // X-month or X-year
    {
      pattern: /(\d+)[\s-]month/i,
      unit: 'month',
      confidence: 0.8,
    },
    {
      pattern: /(\d+)[\s-]year/i,
      unit: 'year',
      confidence: 0.8,
    },
    // Billed every X months
    {
      pattern: /billed\s+every\s+(\d+)\s+months/i,
      unit: 'month',
      confidence: 0.9,
    },
    // Charged every X months
    {
      pattern: /charged\s+every\s+(\d+)\s+months/i,
      unit: 'month',
      confidence: 0.9,
    },
  ];

  for (const { pattern, unit, confidence } of customIntervalPatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1]);
      if (!isNaN(count) && count > 0) {
        // Handle special cases
        if (unit === 'month') {
          if (count === 1) return { cycle: 'monthly', confidence };
          else if (count === 3) return { cycle: 'quarterly', confidence };
          else if (count === 6) return { cycle: 'biannual', confidence };
          else if (count === 12) return { cycle: 'yearly', confidence };
          else return { cycle: 'custom', intervalCount: count, confidence: confidence - 0.05 };
        } else if (unit === 'year') {
          if (count === 1) return { cycle: 'yearly', confidence };
          else return { cycle: 'custom', intervalCount: count * 12, confidence: confidence - 0.05 };
        }
      }
    }
  }

  // Check for contextual patterns
  const contextPatterns = [
    // Monthly charge/payment/subscription
    {
      pattern: /(monthly|per month|each month|a month)/i,
      cycle: 'monthly',
      confidence: 0.85,
    },
    // Annual/yearly charge/payment/subscription
    {
      pattern: /(annual|annually|yearly|per year|each year|a year)/i,
      cycle: 'yearly',
      confidence: 0.85,
    },
    // Weekly charge/payment/subscription
    {
      pattern: /(weekly|per week|each week|a week)/i,
      cycle: 'weekly',
      confidence: 0.85,
    },
    // Daily charge/payment/subscription
    {
      pattern: /(daily|per day|each day|a day)/i,
      cycle: 'daily',
      confidence: 0.85,
    },
    // Quarterly
    {
      pattern: /(quarterly|per quarter|each quarter|a quarter|three months|3 months)/i,
      cycle: 'quarterly',
      confidence: 0.85,
    },
    // Biannual
    {
      pattern: /(biannual|semi-annual|semi annual|twice a year|six months|6 months)/i,
      cycle: 'biannual',
      confidence: 0.85,
    },
  ];

  for (const { pattern, cycle, confidence } of contextPatterns) {
    if (pattern.test(lowerText)) {
      return { cycle, confidence };
    }
  }

  // Check for price with interval indicators
  const priceWithIntervalPatterns = [
    // $XX.XX/month, $XX.XX per month, etc.
    {
      pattern: /\d+(?:\.\d{1,2})?(?:\/|\s+per\s+)(month|mo|year|yr|week|wk|day)/i,
      confidence: 0.8,
    },
  ];

  for (const { pattern, confidence } of priceWithIntervalPatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      const intervalUnit = match[1].toLowerCase();

      if (intervalUnit.startsWith('month') || intervalUnit === 'mo') {
        return { cycle: 'monthly', confidence };
      } else if (intervalUnit.startsWith('year') || intervalUnit === 'yr') {
        return { cycle: 'yearly', confidence };
      } else if (intervalUnit.startsWith('week') || intervalUnit === 'wk') {
        return { cycle: 'weekly', confidence };
      } else if (intervalUnit.startsWith('day')) {
        return { cycle: 'daily', confidence };
      }
    }
  }

  // If the message mentions subscription but no specific cycle found,
  // default to monthly if there's enough subscription context
  if (
    (lowerText.includes('subscription') || lowerText.includes('recurring')) &&
    (lowerText.includes('payment') || lowerText.includes('charge') || lowerText.includes('billing'))
  ) {
    return {
      cycle: 'monthly',
      confidence: 0.6, // Lower confidence for this fallback
    };
  }

  return null;
}

/**
 * Extracts all subscription data from text
 *
 * @param text The text to extract data from
 * @param sender Optional sender information to use as additional context
 * @returns Complete extraction result with confidence scores
 */
export function extractSubscriptionData(text: string, sender?: string): ExtractionResult {
  if (!text) {
    return { overallConfidence: 0 };
  }

  const result: ExtractionResult = {
    overallConfidence: 0,
  };

  // Extract service information
  const serviceInfo = extractServiceName(text, sender);
  if (serviceInfo) {
    result.service = serviceInfo;
  }

  // Extract amount information
  const amountInfo = extractAmount(text);
  if (amountInfo) {
    result.amount = amountInfo;
  }

  // Extract date information
  const dateInfo = extractDate(text);
  if (dateInfo) {
    result.date = dateInfo;
  }

  // Extract billing cycle information
  const billingCycleInfo = extractBillingCycle(text);
  if (billingCycleInfo) {
    result.billingCycle = billingCycleInfo;
  }

  // Calculate overall confidence based on individual extractions
  let confidenceSum = 0;
  let confidenceCount = 0;
  let criticalFieldsPresent = 0;

  // Weight service name and amount more heavily (critical fields)
  if (result.service) {
    confidenceSum += result.service.confidence * 1.5;
    confidenceCount += 1.5;
    criticalFieldsPresent++;
  }

  if (result.amount) {
    confidenceSum += result.amount.confidence * 1.5;
    confidenceCount += 1.5;
    criticalFieldsPresent++;
  }

  if (result.date) {
    confidenceSum += result.date.confidence;
    confidenceCount++;
  }

  if (result.billingCycle) {
    confidenceSum += result.billingCycle.confidence;
    confidenceCount++;
  }

  // Baseline confidence level
  let overallConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0;

  // Apply context-based adjustments

  // Boost confidence when both critical fields are present
  if (criticalFieldsPresent === 2) {
    overallConfidence += 0.1; // Boost for having both service name and amount
  }

  // Boost confidence based on subscription-related keywords
  const lowerText = text.toLowerCase();
  if (
    lowerText.includes('subscription') ||
    lowerText.includes('recurring payment') ||
    lowerText.includes('monthly') ||
    lowerText.includes('yearly') ||
    lowerText.includes('membership')
  ) {
    overallConfidence += 0.05;
  }

  // Boost confidence if we found three or more fields
  let fieldCount = 0;
  if (result.service) fieldCount++;
  if (result.amount) fieldCount++;
  if (result.date) fieldCount++;
  if (result.billingCycle) fieldCount++;

  if (fieldCount >= 3) {
    overallConfidence += 0.1;
  }

  // If the sender matches the service name, that's a good sign
  if (
    result.service &&
    sender &&
    sender.toLowerCase().includes(result.service.name.toLowerCase())
  ) {
    overallConfidence += 0.05;
  }

  // Cap confidence at 1.0
  result.overallConfidence = Math.min(overallConfidence, 1.0);

  return result;
}

/**
 * Attempts to detect currency from context in the message text
 *
 * @param text The text to analyze for currency context
 * @returns Currency code if found, null otherwise
 */
function detectCurrencyFromContext(text: string): string | null {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  // Check for currency code mentions
  const currencyCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'NZD'];
  for (const code of currencyCodes) {
    if (lowerText.includes(code.toLowerCase())) {
      return code;
    }
  }

  // Check for currency name mentions
  const currencyNames = [
    { name: 'dollar', code: 'USD' },
    { name: 'us dollar', code: 'USD' },
    { name: 'euro', code: 'EUR' },
    { name: 'pound', code: 'GBP' },
    { name: 'sterling', code: 'GBP' },
    { name: 'yen', code: 'JPY' },
    { name: 'canadian dollar', code: 'CAD' },
    { name: 'australian dollar', code: 'AUD' },
    { name: 'swiss franc', code: 'CHF' },
    { name: 'yuan', code: 'CNY' },
    { name: 'rupee', code: 'INR' },
    { name: 'new zealand dollar', code: 'NZD' },
    { name: 'kiwi dollar', code: 'NZD' },
  ];

  for (const { name, code } of currencyNames) {
    if (lowerText.includes(name)) {
      return code;
    }
  }

  // Try to infer from known sender patterns
  if (
    lowerText.includes('.uk') ||
    lowerText.includes('london') ||
    lowerText.includes('united kingdom')
  ) {
    return 'GBP';
  }

  if (lowerText.includes('.eu') || lowerText.includes('europe')) {
    return 'EUR';
  }

  if (lowerText.includes('.ca') || lowerText.includes('canada')) {
    return 'CAD';
  }

  if (lowerText.includes('.au') || lowerText.includes('australia')) {
    return 'AUD';
  }

  if (lowerText.includes('.nz') || lowerText.includes('zealand')) {
    return 'NZD';
  }

  if (lowerText.includes('.in') || lowerText.includes('india')) {
    return 'INR';
  }

  if (lowerText.includes('.jp') || lowerText.includes('japan')) {
    return 'JPY';
  }

  // If all else fails, return null
  return null;
}
