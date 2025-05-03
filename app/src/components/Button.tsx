import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacityProps, 
  StyleProp, 
  TextStyle, 
  ViewStyle 
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  textStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
}

/**
 * Button Component
 * 
 * A reusable button component with different variants, sizes, and states.
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  textStyle,
  buttonStyle,
  ...rest
}) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  
  // Get variant specific styles
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
        
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.secondary,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
        
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.primary,
          },
          text: {
            color: colors.primary,
          },
        };
        
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: colors.primary,
          },
        };
      
      default:
        return {
          container: {
            backgroundColor: colors.primary,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
    }
  };
  
  // Get size specific styles
  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingVertical: 8,
            paddingHorizontal: 16,
          },
          text: {
            fontSize: 14,
          },
        };
        
      case 'medium':
        return {
          container: {
            paddingVertical: 12,
            paddingHorizontal: 24,
          },
          text: {
            fontSize: 16,
          },
        };
        
      case 'large':
        return {
          container: {
            paddingVertical: 16,
            paddingHorizontal: 32,
          },
          text: {
            fontSize: 18,
          },
        };
        
      default:
        return {
          container: {
            paddingVertical: 12,
            paddingHorizontal: 24,
          },
          text: {
            fontSize: 16,
          },
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  
  const disabledStyles: { container: ViewStyle; text: TextStyle } = {
    container: {
      opacity: 0.5,
    },
    text: {},
  };
  
  // Spinner color based on variant
  const spinnerColor = variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF';
  
  // Icon size based on button size
  const getIconSize = (): number => {
    switch (size) {
      case 'small': return 16;
      case 'medium': return 18;
      case 'large': return 20;
      default: return 18;
    }
  };
  
  const iconSize = getIconSize();
  const iconColor = variantStyles.text.color;
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyles.container,
        sizeStyles.container,
        disabled || isLoading ? disabledStyles.container : {},
        buttonStyle,
      ]}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={iconSize}
              color={iconColor as string}
              style={styles.leftIcon}
            />
          )}
          
          <Text
            style={[
              styles.text,
              variantStyles.text,
              sizeStyles.text,
              disabled ? disabledStyles.text : {},
              textStyle,
            ]}
          >
            {title}
          </Text>
          
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={iconSize}
              color={iconColor as string}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
}); 