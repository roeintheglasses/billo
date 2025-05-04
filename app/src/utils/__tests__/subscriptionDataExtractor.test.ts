import {
  extractAmount,
  extractServiceName,
  extractDate,
  extractBillingCycle,
  extractSubscriptionData,
} from '../subscriptionDataExtractor';

describe('Subscription Data Extractor', () => {
  describe('extractAmount', () => {
    it('should extract amounts with various currency symbols', () => {
      expect(extractAmount('Your payment of $9.99 was processed')?.value).toBe(9.99);
      expect(extractAmount('Your payment of $9.99 was processed')?.currency).toBe('USD');

      expect(extractAmount('Charge of £7.99 to your account')?.value).toBe(7.99);
      expect(extractAmount('Charge of £7.99 to your account')?.currency).toBe('GBP');

      expect(extractAmount('Monthly fee of €12.99')?.value).toBe(12.99);
      expect(extractAmount('Monthly fee of €12.99')?.currency).toBe('EUR');

      // Test new symbols
      expect(extractAmount('Subscription fee: ¥980')?.value).toBe(980);
      expect(extractAmount('Subscription fee: ¥980')?.currency).toBe('JPY');

      expect(extractAmount('Your payment of ₹499 was processed')?.value).toBe(499);
      expect(extractAmount('Your payment of ₹499 was processed')?.currency).toBe('INR');

      expect(extractAmount('Charge of ₩12000 to your account')?.value).toBe(12000);
      expect(extractAmount('Charge of ₩12000 to your account')?.currency).toBe('KRW');
    });

    it('should extract amounts with currency codes', () => {
      expect(extractAmount('Your payment of 9.99 USD was processed')?.value).toBe(9.99);
      expect(extractAmount('Your payment of 9.99 USD was processed')?.currency).toBe('USD');

      expect(extractAmount('USD 9.99 will be charged')?.value).toBe(9.99);
      expect(extractAmount('USD 9.99 will be charged')?.currency).toBe('USD');

      // Test new currency codes
      expect(extractAmount('Your payment of 14.99 CAD was processed')?.value).toBe(14.99);
      expect(extractAmount('Your payment of 14.99 CAD was processed')?.currency).toBe('CAD');

      expect(extractAmount('AUD 19.99 will be charged')?.value).toBe(19.99);
      expect(extractAmount('AUD 19.99 will be charged')?.currency).toBe('AUD');

      expect(extractAmount('Charge of 29.90 BRL to your account')?.value).toBe(29.9);
      expect(extractAmount('Charge of 29.90 BRL to your account')?.currency).toBe('BRL');
    });

    it('should extract amounts with currency names', () => {
      expect(extractAmount('Your payment of 9.99 dollars was processed')?.value).toBe(9.99);
      expect(extractAmount('Your payment of 9.99 dollars was processed')?.currency).toBe('USD');

      expect(extractAmount('15.99 euros will be charged')?.value).toBe(15.99);
      expect(extractAmount('15.99 euros will be charged')?.currency).toBe('EUR');

      // Test new currency names
      expect(extractAmount('Your payment of 19.99 pounds was processed')?.value).toBe(19.99);
      expect(extractAmount('Your payment of 19.99 pounds was processed')?.currency).toBe('GBP');

      expect(extractAmount('980 yen will be charged')?.value).toBe(980);
      expect(extractAmount('980 yen will be charged')?.currency).toBe('JPY');

      expect(extractAmount('Your payment of 499 rupees was processed')?.value).toBe(499);
      expect(extractAmount('Your payment of 499 rupees was processed')?.currency).toBe('INR');
    });

    it('should extract amounts with prepositions', () => {
      expect(extractAmount('Payment for $9.99 was processed')?.value).toBe(9.99);
      expect(extractAmount('Charge of $12.99 applied')?.value).toBe(12.99);

      // Test new preposition patterns
      expect(extractAmount('You paid for your subscription with $14.99')?.value).toBe(14.99);
      expect(extractAmount('Amount charged for your service: €9.99')?.value).toBe(9.99);
      expect(extractAmount('Your account was debited with £7.99')?.value).toBe(7.99);
    });

    it('should extract amounts with price labels', () => {
      expect(extractAmount('Price: $9.99')?.value).toBe(9.99);
      expect(extractAmount('Amount: 12.99 USD')?.value).toBe(12.99);
      expect(extractAmount('Fee: $7.99/month')?.value).toBe(7.99);

      // Test new label patterns
      expect(extractAmount('Subscription cost: €14.99')?.value).toBe(14.99);
      expect(extractAmount('Payment: $9.99 monthly')?.value).toBe(9.99);
      expect(extractAmount('Charge: £7.99 for your service')?.value).toBe(7.99);
    });

    it('should handle decimal values without currency symbols', () => {
      expect(extractAmount('Your monthly subscription of 9.99 was processed')?.value).toBe(9.99);
      expect(extractAmount('9.99/month for your subscription')?.value).toBe(9.99);

      // Test new patterns without symbols
      expect(extractAmount('We have charged 14.99 for your monthly service')?.value).toBe(14.99);
      expect(extractAmount('Your account has been billed 19.99 per month')?.value).toBe(19.99);
    });

    it('should provide confidence scores for different patterns', () => {
      expect(
        extractAmount('Your payment of $9.99 was processed')?.confidence
      ).toBeGreaterThanOrEqual(0.8);
      expect(extractAmount('Your subscription costs 9.99')?.confidence).toBeLessThan(0.8);

      // Test confidence for new patterns
      const explicitMatch = extractAmount('Monthly fee: $9.99');
      const implicitMatch = extractAmount('We charged 9.99 for your subscription');

      expect(explicitMatch?.confidence).toBeGreaterThan(implicitMatch?.confidence || 0);
    });

    it('should handle international formatting with commas', () => {
      expect(extractAmount('Your payment of €9,99 was processed')?.value).toBe(9.99);
      expect(extractAmount('Subscription fee of 1.299,00 EUR')?.value).toBe(1299.0);
    });
  });

  describe('extractServiceName', () => {
    it('should extract known service names', () => {
      expect(extractServiceName('Your Netflix subscription was renewed')?.normalizedName).toBe(
        'Netflix'
      );
      expect(extractServiceName('Payment to Spotify processed')?.normalizedName).toBe('Spotify');
      expect(extractServiceName('Your Disney+ subscription is active')?.normalizedName).toBe(
        'Disney+'
      );
    });

    it('should handle service name variations and aliases', () => {
      expect(extractServiceName('Your Prime subscription was renewed')?.normalizedName).toBe(
        'Amazon Prime'
      );
      expect(extractServiceName('Payment to Disney Plus processed')?.normalizedName).toBe(
        'Disney+'
      );
      expect(extractServiceName('Your Apple One subscription is active')?.normalizedName).toBe(
        'Apple One'
      );

      // Test new aliases
      expect(extractServiceName('Your Google One storage has been renewed')?.normalizedName).toBe(
        'Google One'
      );
      expect(extractServiceName('Payment to Audible processed')?.normalizedName).toBe('Audible');
      expect(extractServiceName('Your NordVPN subscription is active')?.normalizedName).toBe(
        'NordVPN'
      );
    });

    it('should extract service names from sender information', () => {
      expect(
        extractServiceName('Your subscription was renewed', 'noreply@netflix.com')?.normalizedName
      ).toBe('Netflix');
      expect(extractServiceName('Payment processed', 'billing@spotify.com')?.normalizedName).toBe(
        'Spotify'
      );

      // Test new sender patterns
      expect(
        extractServiceName('Your subscription has been renewed', 'payments@disneyplus.com')
          ?.normalizedName
      ).toBe('Disney+');
      expect(
        extractServiceName('We charged your account', 'billing@hulu.com')?.normalizedName
      ).toBe('Hulu');
      expect(
        extractServiceName('Payment confirmation', 'no-reply@youtube.com')?.normalizedName
      ).toBe('YouTube Premium');
    });

    it('should extract service names using patterns', () => {
      expect(extractServiceName('Subscription to Paramount+ renewed')?.normalizedName).toBe(
        'Paramount+'
      );
      expect(extractServiceName('Your Hulu plan will renew')?.normalizedName).toBe('Hulu');
      expect(extractServiceName('Payment from Adobe received')?.normalizedName).toBe('Adobe');

      // Test new patterns
      expect(extractServiceName('Thank you for subscribing to Canva Pro')?.normalizedName).toBe(
        'Canva Pro'
      );
      expect(extractServiceName('Welcome to Dropbox Plus')?.normalizedName).toBe('Dropbox Plus');
      expect(extractServiceName('Your ExpressVPN charge has been processed')?.normalizedName).toBe(
        'ExpressVPN'
      );
    });

    it('should clean up sender information when used as fallback', () => {
      const result = extractServiceName(
        'Your subscription was renewed',
        'billing.info@unknown-service.com'
      );
      expect(result?.name).toBeDefined();
      expect(result?.normalizedName).toBeDefined();

      // Test new sender cleanup
      const shortCode = extractServiceName('Your subscription was renewed', 'INFO-87654');
      expect(shortCode?.name).toBeDefined();
      expect(shortCode?.normalizedName).toBeDefined();
      expect(shortCode?.normalizedName).not.toContain('INFO-');

      const nestedSender = extractServiceName(
        'Your subscription was renewed',
        'noreply.billing@myservice.company.co.uk'
      );
      expect(nestedSender?.normalizedName).toBeDefined();
    });

    it('should provide confidence scores for different extraction methods', () => {
      expect(
        extractServiceName('Your Netflix subscription was renewed')?.confidence
      ).toBeGreaterThanOrEqual(0.8);
      expect(
        extractServiceName('Payment for your subscription', 'unknown@example.com')?.confidence
      ).toBeLessThan(0.8);

      // Test confidence for different methods
      const directMatch = extractServiceName('Your Spotify subscription was renewed');
      const senderMatch = extractServiceName(
        'Your subscription was renewed',
        'billing@spotify.com'
      );
      const patternMatch = extractServiceName('Payment to Company X was processed');

      expect(directMatch?.confidence).toBeGreaterThan(patternMatch?.confidence || 0);
    });
  });

  describe('extractDate', () => {
    it('should extract absolute dates in various formats', () => {
      // MM/DD/YYYY
      const result1 = extractDate('Your trial ends on 05/15/2023');
      expect(result1?.date.getFullYear()).toBe(2023);
      expect(result1?.date.getMonth()).toBe(4); // May (0-indexed)
      expect(result1?.date.getDate()).toBe(15);

      // MM/DD/YY
      const result2 = extractDate('Your trial ends on 05/15/23');
      expect(result2?.date.getFullYear()).toBe(2023);
      expect(result2?.date.getMonth()).toBe(4);
      expect(result2?.date.getDate()).toBe(15);

      // DD/MM/YYYY
      const result3 = extractDate('Your trial ends on 15.05.2023');
      expect(result3?.date.getFullYear()).toBe(2023);
      expect(result3?.date.getMonth()).toBe(4);
      expect(result3?.date.getDate()).toBe(15);

      // Mon DD, YYYY
      const result4 = extractDate('Your trial ends on May 15, 2023');
      expect(result4?.date.getFullYear()).toBe(2023);
      expect(result4?.date.getMonth()).toBe(4);
      expect(result4?.date.getDate()).toBe(15);

      // YYYY-MM-DD
      const result5 = extractDate('Your trial ends on 2023-05-15');
      expect(result5?.date.getFullYear()).toBe(2023);
      expect(result5?.date.getMonth()).toBe(4);
      expect(result5?.date.getDate()).toBe(15);

      // DD Month YYYY
      const result6 = extractDate('Your trial ends on 15 May 2023');
      expect(result6?.date.getFullYear()).toBe(2023);
      expect(result6?.date.getMonth()).toBe(4);
      expect(result6?.date.getDate()).toBe(15);

      // Month DD YYYY
      const result7 = extractDate('Your trial ends on May 15 2023');
      expect(result7?.date.getFullYear()).toBe(2023);
      expect(result7?.date.getMonth()).toBe(4);
      expect(result7?.date.getDate()).toBe(15);
    });

    it('should extract relative dates', () => {
      // Mock current date for testing
      const realDate = Date;
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(2023, 4, 1); // May 1, 2023
          } else {
            super(...args);
          }
        }
      } as typeof Date;

      // "in X days"
      const result1 = extractDate('Your trial ends in 7 days');
      expect(result1?.isRelative).toBe(true);
      expect(result1?.date.getFullYear()).toBe(2023);
      expect(result1?.date.getMonth()).toBe(4);
      expect(result1?.date.getDate()).toBe(8); // May 1 + 7 days

      // "tomorrow"
      const result2 = extractDate('Your trial ends tomorrow');
      expect(result2?.isRelative).toBe(true);
      expect(result2?.date.getFullYear()).toBe(2023);
      expect(result2?.date.getMonth()).toBe(4);
      expect(result2?.date.getDate()).toBe(2); // May 1 + 1 day

      // "next month"
      const result3 = extractDate('Your subscription renews next month');
      expect(result3?.isRelative).toBe(true);
      expect(result3?.date.getFullYear()).toBe(2023);
      expect(result3?.date.getMonth()).toBe(5); // June

      // "next week"
      const result4 = extractDate('Your payment is due next week');
      expect(result4?.isRelative).toBe(true);
      expect(result4?.date.getFullYear()).toBe(2023);
      expect(result4?.date.getMonth()).toBe(4);
      expect(result4?.date.getDate()).toBe(8); // May 1 + 7 days

      // "in X weeks"
      const result5 = extractDate('Your subscription renews in 2 weeks');
      expect(result5?.isRelative).toBe(true);
      expect(result5?.date.getFullYear()).toBe(2023);
      expect(result5?.date.getMonth()).toBe(4);
      expect(result5?.date.getDate()).toBe(15); // May 1 + 14 days

      // Restore original Date
      global.Date = realDate;
    });

    it('should extract dates from contextual phrases', () => {
      // Mock current date for testing
      const realDate = Date;
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(2023, 4, 1); // May 1, 2023
          } else {
            super(...args);
          }
        }
      } as typeof Date;

      // "ends on DATE"
      const result1 = extractDate('Your trial ends on June 15, 2023');
      expect(result1?.date.getFullYear()).toBe(2023);
      expect(result1?.date.getMonth()).toBe(5); // June
      expect(result1?.date.getDate()).toBe(15);

      // "renews on DATE"
      const result2 = extractDate('Your subscription renews on 06/01/2023');
      expect(result2?.date.getFullYear()).toBe(2023);
      expect(result2?.date.getMonth()).toBe(5); // June
      expect(result2?.date.getDate()).toBe(1);

      // "DATE is your next billing date"
      const result3 = extractDate('June 1, 2023 is your next billing date');
      expect(result3?.date.getFullYear()).toBe(2023);
      expect(result3?.date.getMonth()).toBe(5); // June
      expect(result3?.date.getDate()).toBe(1);

      // "scheduled for DATE"
      const result4 = extractDate('Your payment is scheduled for 05/15/2023');
      expect(result4?.date.getFullYear()).toBe(2023);
      expect(result4?.date.getMonth()).toBe(4); // May
      expect(result4?.date.getDate()).toBe(15);

      // Restore original Date
      global.Date = realDate;
    });

    it('should provide confidence scores for dates', () => {
      expect(extractDate('Your trial ends tomorrow')?.confidence).toBeGreaterThanOrEqual(0.8);
      expect(extractDate('Your trial ends on 05/15/2023')?.confidence).toBeGreaterThanOrEqual(0.8);

      // Compare different format confidences
      const iso = extractDate('Your subscription renews on 2023-05-15');
      const slashes = extractDate('Your subscription renews on 05/15/2023');
      const wordy = extractDate('Your subscription renews on May 15, 2023');
      const relative = extractDate('Your subscription renews tomorrow');

      // ISO format should have highest confidence
      if (iso && slashes && wordy && relative) {
        expect(iso.confidence).toBeGreaterThanOrEqual(slashes.confidence);
      }
    });
  });

  describe('extractBillingCycle', () => {
    it('should extract standard billing cycles', () => {
      expect(extractBillingCycle('Your monthly subscription')?.cycle).toBe('monthly');
      expect(extractBillingCycle('Billed yearly at $99')?.cycle).toBe('yearly');
      expect(extractBillingCycle('Weekly payment of $4.99')?.cycle).toBe('weekly');
      expect(extractBillingCycle('Quarterly billing of $29.99')?.cycle).toBe('quarterly');
      expect(extractBillingCycle('Biannual payment')?.cycle).toBe('biannual');
    });

    it('should extract billing cycles with variations', () => {
      expect(extractBillingCycle('$9.99/month')?.cycle).toBe('monthly');
      expect(extractBillingCycle('$99/yr')?.cycle).toBe('yearly');
      expect(extractBillingCycle('$4.99 per week')?.cycle).toBe('weekly');
      expect(extractBillingCycle('$29.99 every 3 months')?.cycle).toBe('quarterly');
      expect(extractBillingCycle('$59.99 every 6 months')?.cycle).toBe('biannual');

      // Test new variations
      expect(extractBillingCycle('$9.99 a month')?.cycle).toBe('monthly');
      expect(extractBillingCycle('$99 annually')?.cycle).toBe('yearly');
      expect(extractBillingCycle('$4.99 each week')?.cycle).toBe('weekly');
      expect(extractBillingCycle('$29.99 per quarter')?.cycle).toBe('quarterly');
      expect(extractBillingCycle('$59.99 semi-annual')?.cycle).toBe('biannual');
    });

    it('should handle custom intervals', () => {
      const result = extractBillingCycle('$19.99 every 2 months');
      expect(result?.cycle).toBe('custom');
      expect(result?.intervalCount).toBe(2);

      const result2 = extractBillingCycle('$29.99 every 3 months');
      expect(result2?.cycle).toBe('quarterly');

      // Test new custom intervals
      const result3 = extractBillingCycle('$39.99 billed every 4 months');
      expect(result3?.cycle).toBe('custom');
      expect(result3?.intervalCount).toBe(4);

      const result4 = extractBillingCycle('We charge $49.99 every 5 months');
      expect(result4?.cycle).toBe('custom');
      expect(result4?.intervalCount).toBe(5);
    });

    it('should provide confidence scores for billing cycles', () => {
      expect(extractBillingCycle('Your monthly subscription')?.confidence).toBeGreaterThanOrEqual(
        0.8
      );
      expect(extractBillingCycle('$9.99/mo')?.confidence).toBeGreaterThanOrEqual(0.8);

      // Compare different confidence levels
      const explicit = extractBillingCycle('Your monthly subscription');
      const withPrice = extractBillingCycle('$9.99/month');
      const implied = extractBillingCycle('Subscription payment processed');

      if (explicit && withPrice && implied) {
        expect(explicit.confidence).toBeGreaterThan(implied.confidence);
      }
    });

    it('should detect billing cycles from contextualized text', () => {
      expect(extractBillingCycle('You will be charged on a monthly basis')?.cycle).toBe('monthly');
      expect(extractBillingCycle('This is an annual subscription')?.cycle).toBe('yearly');
      expect(extractBillingCycle('Your quarterly payment was successful')?.cycle).toBe('quarterly');
      expect(extractBillingCycle('You have signed up for weekly payments')?.cycle).toBe('weekly');
    });
  });

  describe('extractSubscriptionData', () => {
    it('should extract all subscription data from text', () => {
      const text = 'Your Netflix monthly subscription payment of $9.99 was processed on 05/15/2023';
      const result = extractSubscriptionData(text);

      expect(result.service?.normalizedName).toBe('Netflix');
      expect(result.amount?.value).toBe(9.99);
      expect(result.amount?.currency).toBe('USD');
      expect(result.billingCycle?.cycle).toBe('monthly');
      expect(result.date?.date.getMonth()).toBe(4); // May (0-indexed)
      expect(result.date?.date.getDate()).toBe(15);
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should calculate higher confidence when multiple fields are extracted', () => {
      const fullText =
        'Your Netflix monthly subscription payment of $9.99 was processed on 05/15/2023';
      const partialText = 'Your subscription payment was processed';

      const fullResult = extractSubscriptionData(fullText);
      const partialResult = extractSubscriptionData(partialText);

      expect(fullResult.overallConfidence).toBeGreaterThan(partialResult.overallConfidence);
    });

    it('should handle texts with minimal subscription information', () => {
      const text = 'Your payment was processed';
      const result = extractSubscriptionData(text);

      expect(result.overallConfidence).toBeLessThan(0.6);
    });

    it('should boost confidence when critical fields are present', () => {
      const withCritical = 'Your Netflix payment of $9.99 was processed';
      const withoutCritical = 'Your payment was processed on 05/15/2023';

      const withCriticalResult = extractSubscriptionData(withCritical);
      const withoutCriticalResult = extractSubscriptionData(withoutCritical);

      expect(withCriticalResult.overallConfidence).toBeGreaterThan(
        withoutCriticalResult.overallConfidence
      );
    });

    it('should extract data from international formats', () => {
      const ukText =
        'Your Spotify monthly subscription payment of £9.99 was processed on 15/05/2023';
      const result = extractSubscriptionData(ukText);

      expect(result.service?.normalizedName).toBe('Spotify');
      expect(result.amount?.value).toBe(9.99);
      expect(result.amount?.currency).toBe('GBP');
      expect(result.billingCycle?.cycle).toBe('monthly');
      expect(result.date?.date.getMonth()).toBe(4); // May (0-indexed)
      expect(result.date?.date.getDate()).toBe(15);
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should extract data from complex real-world messages', () => {
      const complexText =
        'Thank you for your Disney+ subscription! Your payment of $7.99 was successfully processed on May 2, 2023. Your next monthly payment will be charged on June 2, 2023.';
      const result = extractSubscriptionData(complexText);

      expect(result.service?.normalizedName).toBe('Disney+');
      expect(result.amount?.value).toBe(7.99);
      expect(result.amount?.currency).toBe('USD');
      expect(result.billingCycle?.cycle).toBe('monthly');
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should consider sender information when calculating confidence', () => {
      const text = 'Your subscription payment of $9.99 was processed';

      const withMatchingSender = extractSubscriptionData(text, 'billing@netflix.com');
      const withNonMatchingSender = extractSubscriptionData(text, 'notifications@example.com');

      expect(withMatchingSender.service?.normalizedName).toBe('Netflix');
      expect(withMatchingSender.overallConfidence).toBeGreaterThan(
        withNonMatchingSender.overallConfidence
      );
    });
  });
});
