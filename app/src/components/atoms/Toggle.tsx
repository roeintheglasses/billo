import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';

export interface ToggleProps extends TouchableOpacityProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  error?: string;
}

/**
 * Toggle component for boolean selection with sliding animation
 *
 * @param {boolean} value - Whether the toggle is on or off
 * @param {function} onValueChange - Callback function when toggle state changes
 * @param {string} label - Optional label text to display next to toggle
 * @param {boolean} disabled - Whether the toggle is disabled
 * @param {string} size - Size variant of the toggle ('small', 'medium', 'large')
 * @param {string} error - Error message to display below the toggle
 * @returns {React.ReactElement} A styled toggle/switch component
 *
 * @example
 * // Basic usage
 * <Toggle
 *   value={isEnabled}
 *   onValueChange={setIsEnabled}
 *   label="Enable notifications"
 * />
 */
export const Toggle: React.FC<ToggleProps> = ({
  value,
  onValueChange,
  label,
  disabled = false,
  size = 'medium',
  error,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Create animated value for the switch position
  const [animatedValue] = React.useState(new Animated.Value(value ? 1 : 0));

  // Get size dimensions based on the size prop
  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          width: 36,
          height: 20,
          thumb: 16,
          margin: 2,
        };
      case 'large':
        return {
          width: 56,
          height: 32,
          thumb: 26,
          margin: 3,
        };
      default: // medium
        return {
          width: 48,
          height: 26,
          thumb: 22,
          margin: 2,
        };
    }
  };

  const dimensions = getSize();

  // Animate switch when value changes
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, animatedValue]);

  // Calculate the position of the switch thumb
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dimensions.width - dimensions.thumb - dimensions.margin * 2],
  });

  // Handle toggle press
  const handleToggle = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {label && (
          <Text
            variant="body"
            style={[styles.label, { color: disabled ? colors.text.tertiary : colors.text.primary }]}
          >
            {label}
          </Text>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggle}
          disabled={disabled}
          style={[style]}
          {...rest}
        >
          <View
            style={[
              styles.track,
              {
                width: dimensions.width,
                height: dimensions.height,
                backgroundColor: value
                  ? disabled
                    ? colors.border.medium // Muted color when disabled but on
                    : colors.primary
                  : disabled
                    ? colors.border.light
                    : colors.border.medium,
                opacity: disabled ? 0.6 : 1,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.thumb,
                {
                  width: dimensions.thumb,
                  height: dimensions.thumb,
                  margin: dimensions.margin,
                  backgroundColor: colors.background.primary,
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>

      {error && (
        <Text variant="caption" style={[styles.error, { color: colors.error }]}>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  track: {
    borderRadius: 34,
    position: 'relative',
  },
  thumb: {
    borderRadius: 50,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    flexShrink: 1,
    marginRight: 12,
  },
  error: {
    marginTop: 4,
  },
});

export default Toggle;
