import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FormField } from '../components/molecules/FormField';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Text } from '../components/atoms/Text';
import { useTheme } from '../contexts/ThemeContext';
import { useStorage } from '../contexts/StorageContext';
import { BillingCycle } from '../services/subscriptionService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Subscription } from '../types/supabase';
import { formatDate } from '../utils/dateUtils';

// Define the route params type
type EditRouteParams = {
  EditSubscription: {
    subscriptionId: string;
  };
};

/**
 * EditSubscriptionScreen Component
 *
 * Allows users to edit an existing subscription with all required fields.
 */
const EditSubscriptionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EditRouteParams, 'EditSubscription'>>();
  const { theme } = useTheme();
  const { colors } = theme;
  const { getSubscriptionById, updateSubscription, deleteSubscription } = useStorage();

  // Get the subscription ID from the route params
  const { subscriptionId } = route.params as { subscriptionId: string };

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('monthly');
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([
    'monthly',
    'yearly',
    'weekly',
    'quarterly',
    'biannually',
  ]);
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Form validation
  const [errors, setErrors] = useState({
    name: '',
    amount: '',
    billingCycle: '',
    startDate: '',
  });

  // Fetch the subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const subscription = await getSubscriptionById(subscriptionId);

        if (subscription) {
          setSubscription(subscription);
          setName(subscription.name);
          setAmount(subscription.amount.toString());
          setSelectedBillingCycle(subscription.billing_cycle as BillingCycle);
          setStartDate(new Date(subscription.start_date));
          setCategory(subscription.category_id || '');
          setPaymentMethod(''); // Set empty as it's not in the subscription type
          setNotes(subscription.notes || '');
        } else {
          setLoadingError('Subscription not found');
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setLoadingError('Error loading subscription data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [subscriptionId, getSubscriptionById]);

  // Handle date picker changes
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  // Show date picker
  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      name: '',
      amount: '',
      billingCycle: '',
      startDate: '',
    };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
      isValid = false;
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
      isValid = false;
    }

    if (!selectedBillingCycle) {
      newErrors.billingCycle = 'Billing cycle is required';
      isValid = false;
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Update the subscription
      const updatedSubscription = {
        ...subscription,
        name,
        amount: parseFloat(amount),
        billing_cycle: selectedBillingCycle,
        start_date: startDate.toISOString().split('T')[0],
        category_id: category || null,
        notes: notes || null,
        // payment_method is not included as it's not in the subscription type
      };

      await updateSubscription(updatedSubscription);
      Alert.alert('Success', 'Subscription updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating subscription:', error);
      Alert.alert('Error', 'Failed to update subscription');
    }
  };

  // Handle delete
  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this subscription?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!subscription) {
                throw new Error('Subscription not found');
              }

              await deleteSubscription(subscription.id);
              Alert.alert('Success', 'Subscription deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting subscription:', error);
              Alert.alert('Error', 'Failed to delete subscription');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="body">Loading subscription data...</Text>
      </View>
    );
  }

  if (loadingError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <Text variant="heading2" style={{ color: colors.error }}>
          Error
        </Text>
        <Text variant="body">{loadingError}</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text variant="heading1" style={styles.title}>
            Edit Subscription
          </Text>
        </View>

        <FormField label="Name" error={errors.name}>
          <Input
            placeholder="Enter subscription name"
            value={name}
            onChangeText={text => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
          />
        </FormField>

        <FormField label="Amount" error={errors.amount}>
          <Input
            placeholder="Enter amount"
            value={amount}
            onChangeText={text => {
              setAmount(text);
              if (errors.amount) setErrors({ ...errors, amount: '' });
            }}
            keyboardType="decimal-pad"
          />
        </FormField>

        <FormField label="Billing Cycle" error={errors.billingCycle}>
          <View style={styles.billingCycleContainer}>
            {billingCycles.map(cycle => (
              <TouchableOpacity
                key={cycle}
                style={[
                  styles.billingCycleButton,
                  {
                    backgroundColor:
                      selectedBillingCycle === cycle ? colors.primary : colors.background.secondary,
                    borderColor: colors.border.light,
                  },
                ]}
                onPress={() => {
                  setSelectedBillingCycle(cycle);
                  if (errors.billingCycle) setErrors({ ...errors, billingCycle: '' });
                }}
              >
                <Text
                  variant="body"
                  style={{
                    color:
                      selectedBillingCycle === cycle ? colors.text.inverted : colors.text.primary,
                  }}
                >
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>

        <FormField label="Start Date" error={errors.startDate}>
          <TouchableOpacity
            style={[
              styles.datePickerButton,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.light,
              },
            ]}
            onPress={showDatePickerModal}
          >
            <Text variant="body">{formatDate(startDate)}</Text>
            <Ionicons name="calendar-outline" size={24} color={colors.text.primary} />
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

        <FormField label="Category (Optional)">
          <Input
            placeholder="Select a category"
            value={category}
            onChangeText={setCategory}
            editable={false}
            onPressIn={() => {
              // This would open a category selection modal in the future
              Alert.alert(
                'Coming Soon',
                'Category selection will be available in a future update.'
              );
            }}
          />
        </FormField>

        <FormField label="Payment Method (Optional)">
          <Input
            placeholder="Enter payment method"
            value={paymentMethod}
            onChangeText={setPaymentMethod}
          />
        </FormField>

        <FormField label="Notes (Optional)">
          <Input
            placeholder="Add notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.notesInput}
          />
        </FormField>

        <View style={styles.buttonContainer}>
          <Button title="Save Changes" onPress={handleSubmit} style={styles.submitButton} />
          <Button
            title="Delete"
            onPress={handleDelete}
            style={styles.deleteButton}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    flex: 1,
  },
  billingCycleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  billingCycleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesInput: {
    height: 100,
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    marginBottom: 10,
  },
  deleteButton: {
    marginBottom: 40,
  },
});

export default EditSubscriptionScreen;
