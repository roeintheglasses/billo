import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { useFadeScaleAnimation, useSpringAnimation } from '../../utils/animationUtils';
import { getButtonAccessibilityProps } from '../../utils/accessibilityUtils';

// Create an animated version of Pressable
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  accessibilityHint?: string;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  showFeedback?: boolean;
}

/**
 * Animated Button component with proper animation and accessibility support
 */
const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  accessibilityHint,
  labelStyle,
  containerStyle,
  disabled = false,
  showFeedback = true,
  onPress,
  ...pressableProps
}) => {
  const { theme, isReducedMotionEnabled } = useTheme();

  // Scale animation for press feedback
  const { animatedValue: scale, reset: resetScale } = useSpringAnimation(false, 1, 0.95, {
    damping: 8,
    stiffness: 150,
  });

  // Fade animation for disabled state
  const fadeStyle = useFadeScaleAnimation(!disabled, 0.95, {
    duration: theme.animations.duration.fast,
    easing: theme.animations.easing.easeOut,
  });

  // Combined animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : 1,
    };
  });

  // Handle press in (scale down)
  const handlePressIn = useCallback(() => {
    if (!disabled && showFeedback) {
      scale.value = 0.95;
    }
  }, [disabled, scale, showFeedback]);

  // Handle press out (scale back up)
  const handlePressOut = useCallback(() => {
    if (!disabled && showFeedback) {
      scale.value = 1;
    }
  }, [disabled, scale, showFeedback]);

  // Get button style based on variant
  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          borderColor: theme.colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.primary,
          borderWidth: 2,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        };
    }
  };

  // Get text style based on variant
  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return {
          color: theme.colors.text.inverted,
        };
      case 'outline':
      case 'ghost':
        return {
          color: theme.colors.primary,
        };
      default:
        return {
          color: theme.colors.text.inverted,
        };
    }
  };

  // Get size style
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.spacing.xs,
        };
      case 'large':
        return {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.spacing.sm,
        };
      default:
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.spacing.xs,
        };
    }
  };

  // Get text size style
  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium as TextStyle['fontWeight'],
          lineHeight: theme.typography.lineHeight.tight,
        };
      case 'large':
        return {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.medium as TextStyle['fontWeight'],
          lineHeight: theme.typography.lineHeight.tight,
        };
      default:
        return theme.typography.variants.button as TextStyle;
    }
  };

  // Generate accessibility props
  const accessibilityProps = getButtonAccessibilityProps(label, accessibilityHint, disabled);

  return (
    <AnimatedPressable
      style={[styles.button, getButtonStyle(), getSizeStyle(), animatedStyle, containerStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      {...accessibilityProps}
      {...pressableProps}
    >
      <Text style={[styles.label, getTextStyle(), getTextSizeStyle(), labelStyle]}>{label}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 0,
    minWidth: 80,
  },
  label: {
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default AnimatedButton;
