import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { FormContainer, FormInput, Button } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { updatePassword } from '../services/auth';

// Password validation schema
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

// Validation schema
const ChangePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .notOneOf([Yup.ref('currentPassword')], 'New password must be different from current password'),
  confirmNewPassword: Yup.string()
    .required('Please confirm your new password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

/**
 * ChangePasswordScreen Component
 * 
 * Allows logged-in users to change their password from the settings.
 */
export const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (values: ChangePasswordFormValues, { resetForm }: any) => {
    try {
      setIsSubmitting(true);
      
      // TODO: Add verification of current password before changing to new password
      // This would require a separate auth method in Supabase
      
      const success = await updatePassword(values.newPassword);
      
      if (success) {
        Alert.alert(
          'Success',
          'Your password has been updated successfully.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                resetForm();
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Unable to update your password. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Password change error:', error);
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
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Change Password
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <FormContainer
        subtitle="Update your password to keep your account secure"
        showTitle={false}
      >
        <Formik
          initialValues={{ 
            currentPassword: '', 
            newPassword: '', 
            confirmNewPassword: '' 
          }}
          validationSchema={ChangePasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View>
              <FormInput
                label="Current Password"
                placeholder="Enter current password"
                leftIcon="lock-closed-outline"
                secureTextEntry
                value={values.currentPassword}
                onChangeText={handleChange('currentPassword')}
                onBlur={handleBlur('currentPassword')}
                error={errors.currentPassword}
                touched={touched.currentPassword}
                autoCapitalize="none"
              />
              
              <FormInput
                label="New Password"
                placeholder="Enter new password"
                leftIcon="lock-closed-outline"
                secureTextEntry
                value={values.newPassword}
                onChangeText={handleChange('newPassword')}
                onBlur={handleBlur('newPassword')}
                error={errors.newPassword}
                touched={touched.newPassword}
                autoCapitalize="none"
              />
              
              <FormInput
                label="Confirm New Password"
                placeholder="Confirm new password"
                leftIcon="lock-closed-outline"
                secureTextEntry
                value={values.confirmNewPassword}
                onChangeText={handleChange('confirmNewPassword')}
                onBlur={handleBlur('confirmNewPassword')}
                error={errors.confirmNewPassword}
                touched={touched.confirmNewPassword}
                autoCapitalize="none"
              />
              
              <Text style={[styles.passwordRequirements, { color: colors.text.secondary }]}>
                Password must contain at least 8 characters, including uppercase letter, 
                lowercase letter, number, and special character.
              </Text>
              
              <Button
                title="Update Password"
                onPress={() => handleSubmit()}
                isLoading={isSubmitting}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}
        </Formik>
      </FormContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
  },
  placeholder: {
    width: 40, // Match the width of the back button for centering
  },
  passwordRequirements: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
  },
}); 