import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  TouchableOpacityProps, 
  ActivityIndicator 
} from 'react-native';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
}

/**
 * Button component for user interactions
 * 
 * @param {string} title - Text to display inside the button
 * @param {string} variant - Button style variant ('primary', 'secondary', 'outline')
 * @param {string} size - Button size ('small', 'medium', 'large')
 * @param {boolean} isLoading - Shows loading indicator when true
 * @returns {React.ReactElement} A styled button component
 * 
 * @example
 * // Basic usage
 * <Button title="Submit" onPress={() => console.log('Pressed')} />
 * 
 * // With variants and loading state
 * <Button 
 *   title="Save" 
 *   variant="primary" 
 *   size="large" 
 *   isLoading={saving} 
 *   onPress={handleSave} 
 * />
 */
export const Button = ({ 
  title, 
  variant = 'primary', 
  size = 'medium', 
  isLoading = false,
  style, 
  disabled, 
  ...rest 
}: ButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? '#3498db' : '#ffffff'} 
          size="small" 
        />
      ) : (
        <Text 
          style={[
            styles.text, 
            variant === 'outline' && styles.outlineText
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#3498db',
  },
  secondary: {
    backgroundColor: '#2ecc71',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  medium: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  large: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  outlineText: {
    color: '#3498db',
  }
}); 