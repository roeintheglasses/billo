import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input, InputProps } from '../atoms/Input';
import { Text } from '../atoms/Text';

export interface FormFieldProps extends Partial<InputProps> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children?: React.ReactNode;
}

/**
 * FormField component that combines Input with additional form elements
 *
 * A composable form field that combines the Input component with a label,
 * error message, and helper text in a standardized layout.
 *
 * @param {string} label - Label text displayed above the input
 * @param {string} error - Error message to display below the input
 * @param {string} helperText - Helper text displayed below the input
 * @param {boolean} required - Whether the field is required (adds asterisk to label)
 * @param {React.ReactNode} children - Optional children to render instead of default Input
 * @returns {React.ReactElement} A styled form field component
 *
 * @example
 * // Basic usage
 * <FormField
 *   label="Email Address"
 *   placeholder="example@email.com"
 *   value={email}
 *   onChangeText={setEmail}
 *   required
 * />
 *
 * // With custom child component
 * <FormField label="Custom Input" required>
 *   <CustomInput />
 * </FormField>
 */
export const FormField = ({
  label,
  error,
  helperText,
  required = false,
  children,
  ...rest
}: FormFieldProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text variant="label" weight={required ? 'semibold' : 'normal'}>
          {label}
        </Text>
        {required && (
          <Text color="#e74c3c" style={styles.requiredAsterisk}>
            *
          </Text>
        )}
      </View>

      {children || <Input {...rest} error={error} />}

      {error && !children && (
        <Text variant="caption" style={styles.errorText}>
          {error}
        </Text>
      )}

      {helperText && !error && (
        <Text variant="caption" style={styles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requiredAsterisk: {
    marginLeft: 4,
    fontSize: 16,
  },
  helperText: {
    marginTop: 4,
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 4,
  },
});
