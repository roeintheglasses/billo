import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FormField } from '../components/molecules/FormField';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Text } from '../components/atoms/Text';
import { useTheme } from '../contexts/ThemeContext';
import { useStorage } from '../contexts/StorageContext';
import { BillingCycle } from '../services/subscriptionService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SubscriptionInsert } from '../types/supabase';
import { validateSubscription } from '../utils/validationUtils';

/**
 * Format a date to a readable string
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Calculate the next billing date based on the start date and billing cycle
 */
const getNextBillingDate = (startDate: Date, billingCycle: BillingCycle): Date => {
  const nextDate = new Date(startDate);
  
  switch (billingCycle) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'biannually':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    default:
      // Default to monthly if unknown
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
};

/**
 * Screen for adding a new subscription
 */
export const AddSubscriptionScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { createSubscription, categories, subscriptions } = useStorage();

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  
  // Date picker state
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Selected category name for display
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available billing cycles from the imported constant
  const BILLING_CYCLES: BillingCycle[] = ['monthly', 'yearly', 'weekly', 'quarterly', 'biannually'];

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Create a mock user ID for testing purposes
    // In a real app, this would come from authentication
    const mockUserId = "test-user-id";

    // Validate form
    const subscription: SubscriptionInsert = {
      name,
      amount: parseFloat(amount),
      billing_cycle: billingCycle,
      start_date: startDate.toISOString(),
      user_id: mockUserId,
      category_id: categoryId,
      notes: notes || null,
      // calculate next billing date based on start date and billing cycle
      next_billing_date: getNextBillingDate(startDate, billingCycle).toISOString(),
    };

    const validationErrors = validateSubscription(subscription);
    
    if (Object.keys(validationErrors.errors).length > 0) {
      setErrors(validationErrors.errors);
      return;
    }

    try {
      await createSubscription(subscription);
      Alert.alert('Success', 'Subscription created successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating subscription:', error);
      Alert.alert('Error', 'Failed to create subscription');
    }
  }, [name, amount, billingCycle, startDate, categoryId, notes, paymentMethod, createSubscription, navigation]);

  // Show date picker
  const showDatePickerHandler = () => {
    setShowDatePicker(true);
  };

  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
    
    // Clear error after selection
    if (errors.start_date) {
      const newErrors = { ...errors };
      delete newErrors.start_date;
      setErrors(newErrors);
    }
  };

  // Show category selection modal
  const showCategorySelection = () => {
    // For now, we'll just simulate category selection
    if (categories && categories.length > 0) {
      const category = categories[0]; // In reality, would show a modal for selection
      setCategoryId(category.id);
      setSelectedCategoryName(category.name);
    } else {
      Alert.alert('No categories', 'Please create a category first');
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleCancel}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text variant="heading1" style={styles.headerTitle}>Add Subscription</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.form}>
        <FormField
          label="Subscription Name"
          error={errors.name}
          required
        >
          <Input
            placeholder="Enter subscription name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                const newErrors = { ...errors };
                delete newErrors.name;
                setErrors(newErrors);
              }
            }}
          />
        </FormField>
        
        <FormField
          label="Amount"
          error={errors.amount}
          required
        >
          <Input
            placeholder="0.00"
            value={amount}
            onChangeText={(text) => {
              // Only allow numbers and decimal point
              const regex = /^[0-9]*\.?[0-9]*$/;
              if (regex.test(text) || text === '') {
                setAmount(text);
                if (errors.amount) {
                  const newErrors = { ...errors };
                  delete newErrors.amount;
                  setErrors(newErrors);
                }
              }
            }}
            keyboardType="numeric"
          />
        </FormField>
        
        <FormField
          label="Billing Cycle"
          error={errors.billing_cycle}
          required
        >
          <View style={styles.pickerContainer}>
            {BILLING_CYCLES.map((cycle) => (
              <TouchableOpacity
                key={cycle}
                style={[
                  styles.cycleButton,
                  { 
                    backgroundColor: billingCycle === cycle ? 
                      colors.primary : colors.background.secondary,
                    borderColor: colors.border.light
                  }
                ]}
                onPress={() => {
                  setBillingCycle(cycle);
                  if (errors.billing_cycle) {
                    const newErrors = { ...errors };
                    delete newErrors.billing_cycle;
                    setErrors(newErrors);
                  }
                }}
              >
                <Text
                  style={[
                    styles.cycleButtonText,
                    { color: billingCycle === cycle ? colors.text.inverted : colors.text.primary }
                  ]}
                >
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        
        <FormField
          label="Start Date"
          error={errors.start_date}
          required
        >
          <TouchableOpacity
            style={[
              styles.dateButton,
              { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.light
              }
            ]}
            onPress={showDatePickerHandler}
          >
            <Text>{formatDate(startDate)}</Text>
            <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          )}
        </FormField>
        
        <FormField
          label="Category"
          error={errors.category_id}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.light
              }
            ]}
            onPress={showCategorySelection}
          >
            <Text>
              {selectedCategoryName || 'Select a category'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </FormField>
        
        <FormField
          label="Payment Method"
        >
          <Input
            placeholder="Credit card, bank account, etc."
            value={paymentMethod}
            onChangeText={setPaymentMethod}
          />
        </FormField>
        
        <FormField
          label="Notes"
        >
          <Input
            placeholder="Add notes about this subscription"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </FormField>
        
        <View style={styles.buttonsContainer}>
          <Button 
            title="Cancel" 
            onPress={handleCancel} 
            variant="secondary"
            style={styles.button}
          />
          <Button 
            title="Save" 
            onPress={handleSubmit} 
            style={styles.button}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // Same width as back button for alignment
  },
  form: {
    gap: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cycleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cycleButtonText: {
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default AddSubscriptionScreen; 