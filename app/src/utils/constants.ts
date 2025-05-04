/**
 * Application constants
 */

// Billing cycles for subscriptions
export const BILLING_CYCLES = ['monthly', 'yearly', 'weekly', 'quarterly', 'biannually'] as const;
export type BillingCycle = typeof BILLING_CYCLES[number]; 