import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen, RegisterScreen } from '../screens';
import { AuthStackParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * AuthNavigator Component
 * 
 * Handles the authentication flow with screens for login, registration, 
 * and password recovery.
 */
export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen name="Login" component={AuthScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      {/* These screens will be implemented later */}
      {/* <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> */}
    </Stack.Navigator>
  );
}; 