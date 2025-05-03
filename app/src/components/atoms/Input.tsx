import React, { useState } from 'react';
import { 
  TextInput, 
  StyleSheet, 
  View, 
  TextInputProps, 
  TouchableOpacity 
} from 'react-native';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

/**
 * Input component for text entry
 * 
 * @param {string} label - Label text displayed above the input
 * @param {string} error - Error message to display below the input
 * @param {React.ReactNode} leftIcon - Icon component to display on the left side
 * @param {React.ReactNode} rightIcon - Icon component to display on the right side
 * @param {boolean} isPassword - Whether the input is for password entry (adds show/hide toggle)
 * @returns {React.ReactElement} A styled input component
 * 
 * @example
 * // Basic usage
 * <Input 
 *   placeholder="Enter your email" 
 *   value={email} 
 *   onChangeText={setEmail} 
 * />
 * 
 * // With label and error
 * <Input 
 *   label="Email Address"
 *   placeholder="example@email.com"
 *   error={emailError}
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 */
export const Input = ({ 
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  style,
  ...rest
}: InputProps) => {
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" style={styles.label}>{label}</Text>
      )}
      <View style={[
        styles.inputContainer,
        error ? styles.inputError : null,
        style,
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || isPassword) ? styles.inputWithRightIcon : null,
          ]}
          placeholderTextColor="#999"
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity 
            style={styles.iconRight}
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          >
            <Text>{secureTextEntry ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>
      {error && (
        <Text variant="caption" style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#333',
  },
  inputWithLeftIcon: {
    paddingLeft: 4,
  },
  inputWithRightIcon: {
    paddingRight: 4,
  },
  iconLeft: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 4,
  },
}); 