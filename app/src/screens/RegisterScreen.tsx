import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { FormContainer, FormInput, Button } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { AuthStackParamList } from '../navigation/navigationTypes';

// Validation schema
const RegisterSchema = Yup.object().shape({
  fullName: Yup.string().required('Full name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

type RegisterFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/**
 * RegisterScreen Component
 * 
 * Allows users to create a new account using email and password.
 */
export const RegisterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { register } = useAuth();
  const { colors, spacing } = theme;
  
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  
  // Handle form submission
  const handleRegister = async (values: RegisterFormValues) => {
    try {
      setRegistrationError(null);
      const success = await register(values.email, values.password, values.fullName);
      
      if (success) {
        // Registration successful
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully. Please log in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        // Registration failed
        setRegistrationError('Registration failed. Please try again.');
      }
    } catch (error) {
      setRegistrationError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
    }
  };
  
  return (
    <FormContainer
      title="Create an Account"
      subtitle="Sign up to manage your subscriptions"
    >
      <Formik
        initialValues={{ fullName: '', email: '', password: '', confirmPassword: '' }}
        validationSchema={RegisterSchema}
        onSubmit={handleRegister}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
          <View>
            <FormInput
              label="Full Name"
              placeholder="Enter your full name"
              leftIcon="person-outline"
              autoCapitalize="words"
              value={values.fullName}
              onChangeText={handleChange('fullName')}
              onBlur={handleBlur('fullName')}
              error={errors.fullName}
              touched={touched.fullName}
            />
            
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
            
            <FormInput
              label="Password"
              placeholder="Create a password"
              leftIcon="lock-closed-outline"
              secureTextEntry
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              error={errors.password}
              touched={touched.password}
            />
            
            <FormInput
              label="Confirm Password"
              placeholder="Confirm your password"
              leftIcon="lock-closed-outline"
              secureTextEntry
              value={values.confirmPassword}
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
            />
            
            {registrationError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {registrationError}
              </Text>
            )}
            
            <Button
              title="Register"
              onPress={() => handleSubmit()}
              isLoading={isSubmitting}
              style={{ marginTop: spacing.md }}
            />
            
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  {' Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </FormContainer>
  );
};

const styles = StyleSheet.create({
  errorText: {
    textAlign: 'center',
    marginVertical: 8,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 