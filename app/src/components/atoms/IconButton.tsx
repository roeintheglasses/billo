import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export type IconButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type IconButtonSize = 'small' | 'medium' | 'large';

export interface IconButtonProps extends TouchableOpacityProps {
  name: keyof typeof Ionicons.glyphMap;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

/**
 * IconButton component for displaying clickable icons
 *
 * @param {string} name - Icon name from Ionicons set
 * @param {string} variant - Button style variant
 * @param {string} size - Button size
 * @param {boolean} isLoading - Shows loading indicator when true
 * @param {string} accessibilityLabel - Accessibility label for screen readers
 * @returns {React.ReactElement} A styled icon button component
 *
 * @example
 * // Basic usage
 * <IconButton
 *   name="heart"
 *   onPress={() => handleLike()}
 *   accessibilityLabel="Like"
 * />
 *
 * // With variant and size
 * <IconButton
 *   name="trash"
 *   variant="outline"
 *   size="large"
 *   onPress={handleDelete}
 *   accessibilityLabel="Delete item"
 * />
 */
export const IconButton: React.FC<IconButtonProps> = ({
  name,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  accessibilityLabel,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Get icon and container size based on the size prop
  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          container: 32,
          icon: 16,
        };
      case 'large':
        return {
          container: 48,
          icon: 24,
        };
      default: // medium
        return {
          container: 40,
          icon: 20,
        };
    }
  };

  // Get variant specific styles
  const getVariantStyles = (): { container: ViewStyle; iconColor: string } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary,
            borderWidth: 0,
          },
          iconColor: '#FFFFFF',
        };

      case 'secondary':
        return {
          container: {
            backgroundColor: colors.secondary,
            borderWidth: 0,
          },
          iconColor: '#FFFFFF',
        };

      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.primary,
          },
          iconColor: colors.primary,
        };

      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          iconColor: colors.primary,
        };

      default:
        return {
          container: {
            backgroundColor: colors.primary,
            borderWidth: 0,
          },
          iconColor: '#FFFFFF',
        };
    }
  };

  const dimensions = getSize();
  const variantStyles = getVariantStyles();

  // Spinner color based on variant
  const spinnerColor = variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || isLoading}
      accessibilityLabel={accessibilityLabel || `Icon button: ${name}`}
      accessibilityRole="button"
      style={[
        styles.container,
        variantStyles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Ionicons name={name} size={dimensions.icon} color={variantStyles.iconColor} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100, // fully rounded
  },
});

export default IconButton;
