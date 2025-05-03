import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FormContainer, FormInput, Button } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { AuthStackParamList } from '../navigation/navigationTypes';

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

/**
 * LoginScreen Component
 * 
 * Allows users to sign in to their account using email and password.
 */
export const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { login } = useAuth();
  const { colors, spacing } = theme;
  
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [savedEmail, setSavedEmail] = useState<string>('');
  
  // Load saved email if "Remember me" was checked previously
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        if (email) {
          setSavedEmail(email);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved email:', error);
      }
    };
    
    loadSavedEmail();
  }, []);
  
  // Handle form submission
  const handleLogin = async (values: LoginFormValues) => {
    try {
      setLoginError(null);
      const success = await login(values.email, values.password);
      
      if (success) {
        // Save email if "Remember me" is checked
        if (rememberMe) {
          await AsyncStorage.setItem('userEmail', values.email);
        } else {
          await AsyncStorage.removeItem('userEmail');
        }
        
        // Login successful, navigation will be handled by the auth context
      } else {
        // Login failed
        setLoginError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      setLoginError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    }
  };
  
  // Toggle remember me state
  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };
  
  return (
    <FormContainer
      title="Welcome Back"
      subtitle="Sign in to your account"
    >
      <Formik
        initialValues={{ email: savedEmail, password: '', rememberMe }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
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
            
            <FormInput
              label="Password"
              placeholder="Enter your password"
              leftIcon="lock-closed-outline"
              secureTextEntry
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              error={errors.password}
              touched={touched.password}
            />
            
            <TouchableOpacity 
              style={styles.rememberMeContainer}
              onPress={toggleRememberMe}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: colors.text.secondary },
                rememberMe && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}>
                {rememberMe && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={[styles.rememberMeText, { color: colors.text.secondary }]}>
                Remember me
              </Text>
            </TouchableOpacity>
            
            {loginError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {loginError}
              </Text>
            )}
            
            <Button
              title="Sign In"
              onPress={() => handleSubmit()}
              isLoading={isSubmitting}
              style={{ marginTop: spacing.md }}
            />
            
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword' as any)}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.text.secondary }]}>
                Forgot your password?
              </Text>
            </TouchableOpacity>
            
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  {' Sign Up'}
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
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
  },
  rememberMeText: {
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 8,
  },
  forgotPassword: {
    marginTop: 16,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
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