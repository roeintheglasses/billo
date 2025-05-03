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
import { updatePassword } from '../services/auth';

// Password validation schema
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

// Validation schema
const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

/**
 * ResetPasswordScreen Component
 * 
 * Allows users to set a new password after clicking a reset link.
 */
export const ResetPasswordScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (values: ResetPasswordFormValues) => {
    try {
      setIsSubmitting(true);
      const success = await updatePassword(values.password);
      
      if (success) {
        setResetComplete(true);
      } else {
        // If the password update failed, show an error
        Alert.alert(
          'Error',
          'Unable to update your password. Please try again or request a new reset link.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <FormContainer
      title="Create New Password"
      subtitle="Set a new secure password for your account"
    >
      {!resetComplete ? (
        <Formik
          initialValues={{ password: '', confirmPassword: '' }}
          validationSchema={ResetPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View>
              <FormInput
                label="New Password"
                placeholder="Enter new password"
                leftIcon="lock-closed-outline"
                secureTextEntry
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={errors.password}
                touched={touched.password}
                autoCapitalize="none"
              />
              
              <FormInput
                label="Confirm Password"
                placeholder="Confirm new password"
                leftIcon="lock-closed-outline"
                secureTextEntry
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={errors.confirmPassword}
                touched={touched.confirmPassword}
                autoCapitalize="none"
              />
              
              <Text style={[styles.passwordRequirements, { color: colors.text.secondary }]}>
                Password must contain at least 8 characters, including uppercase letter, 
                lowercase letter, number, and special character.
              </Text>
              
              <Button
                title="Set New Password"
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
        // Display success message after password is reset
        <View style={styles.successContainer}>
          <Text style={[styles.successText, { color: colors.text.primary }]}>
            Password Reset Successful!
          </Text>
          <Text style={[styles.successSubtext, { color: colors.text.secondary }]}>
            Your password has been updated. You can now log in with your new password.
          </Text>
          <Button
            title="Go to Login"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: spacing.lg }}
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
  passwordRequirements: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
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