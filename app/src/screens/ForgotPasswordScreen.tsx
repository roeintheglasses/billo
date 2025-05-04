import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { FormContainer, FormInput, Button } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { AuthStackParamList } from '../navigation/navigationTypes';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

type ForgotPasswordFormValues = {
  email: string;
};

/**
 * ForgotPasswordScreen Component
 *
 * Allows users to request a password reset using their email address.
 */
export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { forgotPassword } = useAuth();
  const { colors, spacing } = theme;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Handle form submission
  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsSubmitting(true);
      const success = await forgotPassword(values.email);

      if (success) {
        setResetSent(true);
      } else {
        // If the reset failed, show an error
        Alert.alert(
          'Error',
          'Unable to send password reset email. Please check your email address and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContainer
      title="Reset Your Password"
      subtitle="Enter your email to receive reset instructions"
    >
      {!resetSent ? (
        <Formik
          initialValues={{ email: '' }}
          validationSchema={ForgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View>
              <FormInput
                label="Email"
                placeholder="Enter your email"
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={errors.email}
                touched={touched.email}
              />

              <Button
                title="Send Reset Link"
                onPress={() => handleSubmit()}
                isLoading={isSubmitting}
                style={{ marginTop: spacing.md }}
              />

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={[styles.backButtonText, { color: colors.text.secondary }]}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      ) : (
        // Display success message after reset email is sent
        <View style={styles.successContainer}>
          <Text style={[styles.successText, { color: colors.text.primary }]}>
            Reset instructions sent!
          </Text>
          <Text style={[styles.successSubtext, { color: colors.text.secondary }]}>
            We've sent the password reset instructions to your email. Please check your inbox and
            follow the link to reset your password.
          </Text>
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: spacing.lg }}
            variant="secondary"
          />
        </View>
      )}
    </FormContainer>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  backButtonText: {
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    padding: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
});
