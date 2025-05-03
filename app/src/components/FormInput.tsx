import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  touched?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: object;
}

/**
 * FormInput Component
 * 
 * A reusable input component with validation support, icons, and theming.
 */
export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  touched,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  ...rest
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Determine if we need to show a password toggle icon
  const isPassword = secureTextEntry !== undefined;
  const actualSecureTextEntry = isPassword ? !isPasswordVisible : secureTextEntry;
  
  // Extract typography styles to avoid TypeScript errors
  const labelStyle: TextStyle = {
    ...typography.variants.labelMedium,
    color: colors.text.secondary,
  };
  
  const inputStyle: TextStyle = {
    ...typography.variants.bodyMedium,
    color: colors.text.primary,
  };
  
  const errorStyle: TextStyle = {
    ...typography.variants.caption,
    color: colors.error,
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>
        {label}
      </Text>
      
      <View style={[
        styles.inputContainer,
        { 
          borderColor: error && touched ? colors.error : colors.border.light,
          backgroundColor: colors.background.secondary
        }
      ]}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={20} 
            color={colors.text.tertiary}
            style={styles.leftIcon} 
          />
        )}
        
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={actualSecureTextEntry}
          {...rest}
        />
        
        {isPassword && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.rightIcon}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <TouchableOpacity 
            onPress={onRightIconPress} 
            style={styles.rightIcon}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && touched && (
        <Text style={[styles.errorText, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    marginTop: 4,
  },
}); 