import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../components/templates/Screen';
import { Text } from '../components/atoms/Text';
import { Button } from '../components/atoms/Button';
import { FormField } from '../components/molecules/FormField';

/**
 * Home screen component for testing our atomic design components
 * 
 * @returns {React.ReactElement} The home screen
 */
export const HomeScreen = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    // Basic email validation
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError('');
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert(`Welcome! Email submitted: ${email}`);
    }, 1500);
  };

  return (
    <Screen 
      headerTitle="Billo" 
      scrollable
      safeArea
    >
      <View style={styles.container}>
        <Text 
          variant="heading1" 
          weight="bold" 
          align="center"
          style={styles.title}
        >
          Welcome to Billo
        </Text>
        
        <Text 
          variant="body" 
          align="center"
          style={styles.subtitle}
        >
          Your subscription management app
        </Text>
        
        <View style={styles.formContainer}>
          <FormField
            label="Email Address"
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            helperText="We'll send you updates and notifications"
            required
          />
          
          <Button
            title="Get Started"
            variant="primary"
            size="large"
            onPress={handleSubmit}
            isLoading={loading}
            style={styles.button}
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 40,
    color: '#666',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  button: {
    marginTop: 16,
  },
}); 