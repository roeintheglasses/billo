import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, AuthStackParamList } from '../navigation/navigationTypes';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components';

/**
 * Authentication Screen
 *
 * A placeholder screen for the authentication flow.
 */
export const AuthScreen = () => {
  // Using any type for now since we're still setting up the navigation structure
  // This will be properly typed once all navigation files are in place
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  // This would eventually navigate to TabNavigator once authenticated
  const handleLogin = () => {
    // In a real implementation, we would authenticate the user here
    // and then navigate to the main app
    navigation.navigate('Tabs' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.logoContainer}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Welcome to Billo</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Manage your subscriptions effortlessly
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Sign In" onPress={handleLogin} style={{ marginBottom: spacing.md }} />

        <Button
          title="Create Account"
          variant="outline"
          onPress={() => navigation.navigate('Register')}
        />

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword' as any)}
        >
          <Text style={[styles.forgotPasswordText, { color: colors.text.secondary }]}>
            Forgot your password?
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  forgotPassword: {
    marginTop: 20,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
  },
});
