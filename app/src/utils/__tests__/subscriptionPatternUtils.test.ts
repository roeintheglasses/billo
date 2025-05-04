import {
  containsSubscriptionPattern,
  extractPrice,
  extractServiceName,
  analyzeSubscriptionText,
  detectBillingCycle,
  PatternType,
  registerPattern,
} from '../subscriptionPatternUtils';

describe('Subscription Pattern Utils', () => {
  // Sample messages for different pattern types
  const sampleMessages = {
    paymentConfirmation: [
      'Your payment of $9.99 to Netflix has been processed. Thank you for your subscription.',
      "We've charged your card $14.99 for your monthly HBO Max subscription.",
      'Apple: Payment of $4.99 for Apple Music was successful.',
      'Payment of £7.99 to Spotify processed on 05/23/2023. See your receipt at spotify.com/account',
      'Disney+: Your payment of $7.99 was successful. Your subscription is active until 06/15/2023.',
    ],
    subscriptionConfirmation: [
      'Welcome to your Netflix subscription! Start streaming today at netflix.com',
      'Your subscription to Audible has been activated. Enjoy your first audiobook!',
      "You're now subscribed to YouTube Premium. Enjoy ad-free videos and background play.",
      'Thanks for subscribing to Dropbox Plus. Your storage has been upgraded to 2TB.',
      'Confirmation: Your Amazon Prime membership has started. Enjoy free shipping and Prime Video!',
    ],
    trialEnding: [
      'Your free trial of Adobe Creative Cloud will end on 05/30/2023. You will be charged $52.99/month unless you cancel.',
      "Reminder: Your trial of Microsoft Office 365 is ending soon. To continue, we'll charge $9.99/month to your payment method on file.",
      "LinkedIn: Your Premium trial ends in 3 days. After that, you'll be charged $29.99/month. Cancel anytime at linkedin.com/premium",
      'Your Hulu trial period ends tomorrow. To avoid charges of $7.99/month, cancel before 11:59 PM on 05/15/2023.',
      "Canva Pro trial ending: Your free trial ends on Monday. After that, we'll bill you $12.99 monthly.",
    ],
    renewalNotice: [
      'Your subscription to Spotify will automatically renew on 06/15/2023 at the price of $9.99.',
      'Apple: Your iCloud subscription (50GB) will renew automatically on 05/28 for $0.99.',
      'Your annual subscription to Amazon Prime will renew on 07/12/2023. You will be charged $119.',
      "PlayStation Plus: Your membership will auto-renew on 06/03/2023. We'll charge $59.99 for 12 months of service.",
      "Xbox Game Pass subscription renewal: We'll automatically bill you $14.99 on 06/02/2023.",
    ],
    priceChange: [
      'Important: Netflix price update. Starting with your next billing period, your subscription price will change from $14.99 to $16.49.',
      "Spotify: We're updating the price of your Premium subscription from $9.99 to $10.99 per month starting on your next billing date, 06/15/2023.",
      'Price change for your YouTube Premium subscription: Effective 06/01, your monthly price will increase to $13.99.',
      'Adobe: Your Creative Cloud subscription price will be adjusted from $52.99 to $54.99 on your next billing date.',
      'Disney+ price update: Your subscription will change from $7.99 to $8.99 monthly on your next billing cycle.',
    ],
    cancellation: [
      "Your subscription to HBO Max has been canceled. You'll have access until the end of your billing period on 05/31/2023.",
      "Cancellation confirmation: Netflix. We've processed your cancellation request. Your subscription will end on 06/14/2023.",
      "Hulu: We've received your request to cancel your subscription. You'll have access until 05/30/2023.",
      'Your Audible membership has been canceled as requested. Your benefits will continue through 06/07/2023.',
      "Cancellation confirmed: Your Amazon Prime membership will end on 07/15/2023. You won't be charged again.",
    ],
  };

  describe('analyzeSubscriptionText', () => {
    it('should detect payment confirmation patterns with high confidence', () => {
      const results = sampleMessages.paymentConfirmation.map(msg =>
        analyzeSubscriptionText(msg, 'service@example.com')
      );

      results.forEach(result => {
        expect(result.matched).toBe(true);
        expect(result.patternType).toBe(PatternType.PAYMENT_CONFIRMATION);
        expect(result.confidence).toBeGreaterThanOrEqual(75);

        // Most payment confirmations should extract a price
        if (result.extractedData.price) {
          expect(result.extractedData.price).toBeGreaterThan(0);
        }
      });
    });

    it('should detect subscription confirmation patterns', () => {
      const results = sampleMessages.subscriptionConfirmation.map(msg =>
        analyzeSubscriptionText(msg, 'service@example.com')
      );

      results.forEach(result => {
        expect(result.matched).toBe(true);
        expect(result.patternType).toBe(PatternType.SUBSCRIPTION_CONFIRMATION);
        expect(result.confidence).toBeGreaterThanOrEqual(80);

        // Most subscription confirmations should extract a service name
        if (result.extractedData.serviceName) {
          expect(result.extractedData.serviceName.length).toBeGreaterThan(0);
        }
      });
    });

    it('should detect trial ending notices', () => {
      const results = sampleMessages.trialEnding.map(msg =>
        analyzeSubscriptionText(msg, 'service@example.com')
      );

      results.forEach(result => {
        expect(result.matched).toBe(true);
        expect(result.patternType).toBe(PatternType.TRIAL_ENDING);
        expect(result.confidence).toBeGreaterThanOrEqual(85);
      });
    });

    it('should detect renewal notices', () => {
      const results = sampleMessages.renewalNotice.map(msg =>
        analyzeSubscriptionText(msg, 'service@example.com')
      );

      results.forEach(result => {
        expect(result.matched).toBe(true);
        expect(result.patternType).toBe(PatternType.RENEWAL_NOTICE);
        expect(result.confidence).toBeGreaterThanOrEqual(85);
      });
    });

    it('should detect price changes', () => {
      const results = sampleMessages.priceChange.map(msg =>
        analyzeSubscriptionText(msg, 'service@example.com')
      );

      results.forEach(result => {
        expect(result.matched).toBe(true);
        expect(result.patternType).toBe(PatternType.PRICE_CHANGE);
        expect(result.confidence).toBeGreaterThanOrEqual(85);
      });
    });

    it('should detect cancellation notices', () => {
      const results = sampleMessages.cancellation.map(msg =>
        analyzeSubscriptionText(msg, 'service@example.com')
      );

      results.forEach(result => {
        expect(result.matched).toBe(true);
        expect(result.patternType).toBe(PatternType.CANCELLATION);
        expect(result.confidence).toBeGreaterThanOrEqual(85);
      });
    });

    it('should handle messages with mixed pattern types and prioritize by confidence', () => {
      // This message contains both subscription confirmation and payment elements
      const mixedMessage =
        'Welcome to Netflix! Your payment of $9.99 has been processed. Your subscription is now active.';

      const result = analyzeSubscriptionText(mixedMessage, 'netflix@example.com');

      expect(result.matched).toBe(true);
      // The highest confidence pattern should be chosen
      expect(result.confidence).toBeGreaterThanOrEqual(85);
      expect(result.extractedData.serviceName).toBe('Netflix');
      expect(result.extractedData.price).toBe(9.99);
    });

    it('should handle non-subscription messages', () => {
      const nonSubscriptionMessages = [
        'Your pizza delivery is on the way!',
        'Meeting scheduled for tomorrow at 2pm',
        'Your verification code is 123456',
        'Thank you for your feedback',
      ];

      nonSubscriptionMessages.forEach(msg => {
        const result = analyzeSubscriptionText(msg, 'random@example.com');
        expect(result.matched).toBe(false);
        expect(result.confidence).toBe(0);
      });
    });
  });

  describe('extractPrice', () => {
    it('should extract price in different formats', () => {
      expect(extractPrice('Your bill is $9.99')).toBe(9.99);
      expect(extractPrice('Payment of £7.99 processed')).toBe(7.99);
      expect(extractPrice('You will be charged €12.49')).toBe(12.49);
      expect(extractPrice('Amount: 15.99 USD')).toBe(15.99);
      expect(extractPrice('Monthly fee of 8.99/month')).toBe(8.99);
    });

    it('should return null when no price found', () => {
      expect(extractPrice('Your subscription is active')).toBeNull();
      expect(extractPrice('Thanks for subscribing')).toBeNull();
    });
  });

  describe('detectBillingCycle', () => {
    it('should detect different billing cycles', () => {
      expect(detectBillingCycle('Your monthly subscription')).toBe('monthly');
      expect(detectBillingCycle('Billed yearly at $99')).toBe('yearly');
      expect(detectBillingCycle('Weekly payment of $4.99')).toBe('weekly');
      expect(detectBillingCycle('Quarterly billing of $29.99')).toBe('quarterly');
      expect(detectBillingCycle('Biannual payment')).toBe('biannual');
      expect(detectBillingCycle('$9.99/month')).toBe('monthly');
      expect(detectBillingCycle('$99/year')).toBe('yearly');
    });

    it('should return null when no billing cycle detected', () => {
      expect(detectBillingCycle('Your subscription is active')).toBeNull();
      expect(detectBillingCycle('Thanks for subscribing')).toBeNull();
    });
  });

  describe('extractServiceName', () => {
    it('should extract service name from sender and text', () => {
      expect(extractServiceName('Your Netflix subscription is active', 'updates@netflix.com')).toBe(
        'Netflix'
      );
      expect(extractServiceName('Payment to Spotify processed', 'random@example.com')).toBe(
        'Spotify'
      );
      expect(
        extractServiceName('Your Disney+ subscription renews tomorrow', 'billing@mail.com')
      ).toBe('Disney+');
    });

    it('should extract service name using patterns', () => {
      expect(extractServiceName('Subscription to Paramount+ renewed', 'billing@mail.com')).toBe(
        'Paramount+'
      );
      expect(extractServiceName('Your Hulu plan will renew', 'billing@mail.com')).toBe('Hulu');
      expect(extractServiceName('Payment from Adobe received', 'notify@bank.com')).toBe('Adobe');
    });
  });

  describe('registerPattern', () => {
    it('should allow registering custom patterns', () => {
      // Register a custom pattern for a specific service
      registerPattern(
        /thank\s+you\s+for\s+using\s+custom\s+service/i,
        PatternType.SUBSCRIPTION_CONFIRMATION,
        95,
        { serviceName: true }
      );

      const result = analyzeSubscriptionText(
        'Thank you for using Custom Service! Your subscription is now active.',
        'info@customservice.com'
      );

      expect(result.matched).toBe(true);
      expect(result.confidence).toBe(95);
      expect(result.patternType).toBe(PatternType.SUBSCRIPTION_CONFIRMATION);
    });
  });
});
