import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SubscriptionConfirmationModal } from './SubscriptionConfirmationModal';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Alert } from 'react-native';

// Mock the necessary dependencies
jest.mock('../../services/subscriptionService', () => ({
  BILLING_CYCLES: ['weekly', 'monthly', 'yearly', 'quarterly', 'biannually'],
  createSubscription: jest.fn(() => Promise.resolve({ id: 'subscription-123' })),
}));

jest.mock('../../services/subscriptionMessageService', () => ({
  linkMessageToSubscription: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ 
        data: { 
          session: { 
            user: { 
              id: 'user-123' 
            } 
          } 
        } 
      }))
    }
  }
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('SubscriptionConfirmationModal', () => {
  const mockSubscription = {
    _id: 123,
    thread_id: 456,
    address: 'Netflix',
    person: 0,
    date: 1635721200000,
    date_sent: 1635721200000,
    protocol: 0,
    read: 1,
    status: 0,
    type: 1,
    body: 'Your Netflix subscription for $9.99 has been renewed.',
    service_center: '',
    serviceName: 'Netflix',
    price: 9.99,
    billingCycle: 'monthly',
    currency: 'USD',
    confidence: 85,
    isSubscription: true
  };

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    subscription: mockSubscription,
    onConfirm: jest.fn(),
  };

  it('renders correctly with subscription data', () => {
    const { getByText, getByDisplayValue } = render(
      <ThemeProvider>
        <SubscriptionConfirmationModal {...defaultProps} />
      </ThemeProvider>
    );

    // Check that the modal title is displayed
    expect(getByText('Confirm Subscription')).toBeTruthy();
    
    // Check that the SMS body is displayed
    expect(getByText(mockSubscription.body)).toBeTruthy();

    // Check that the form fields are populated with correct values
    expect(getByDisplayValue('Netflix')).toBeTruthy();
    expect(getByDisplayValue('9.99')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();
    expect(getByDisplayValue('USD')).toBeTruthy();
  });

  it('handles reject button press', () => {
    const { getByText } = render(
      <ThemeProvider>
        <SubscriptionConfirmationModal {...defaultProps} />
      </ThemeProvider>
    );

    // Press the reject button
    fireEvent.press(getByText('Reject'));

    // Alert should be shown for confirmation
    expect(Alert.alert).toHaveBeenCalledWith(
      'Reject Subscription',
      'Are you sure you want to ignore this subscription?',
      expect.any(Array)
    );
  });

  // More tests would typically include:
  // - Testing form validation (invalid inputs)
  // - Testing form submission success/failure paths
  // - Testing with different confidence levels
  // - Testing with partial subscription data
}); 