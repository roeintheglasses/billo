import React from 'react';
import { TouchableOpacity, View, StyleSheet, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';

export interface CheckboxProps extends TouchableOpacityProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  error?: string;
  disabled?: boolean;
}

/**
 * Checkbox component for boolean selection
 *
 * @param {boolean} checked - Whether the checkbox is checked
 * @param {function} onChange - Callback function when checkbox state changes
 * @param {string} label - Optional label text to display next to checkbox
 * @param {string} size - Size variant of the checkbox ('small', 'medium', 'large')
 * @param {string} error - Error message to display below the checkbox
 * @param {boolean} disabled - Whether the checkbox is disabled
 * @returns {React.ReactElement} A styled checkbox component
 *
 * @example
 * // Basic usage
 * <Checkbox
 *   checked={isAccepted}
 *   onChange={setIsAccepted}
 *   label="I accept the terms and conditions"
 * />
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  size = 'medium',
  error,
  disabled = false,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Determine sizes based on the size prop
  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          box: 16,
          icon: 12,
          padding: 2,
        };
      case 'large':
        return {
          box: 24,
          icon: 18,
          padding: 4,
        };
      default: // medium
        return {
          box: 20,
          icon: 16,
          padding: 3,
        };
    }
  };

  const sizeValues = getSize();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !disabled && onChange(!checked)}
        style={[styles.row, disabled && styles.disabled, style]}
        disabled={disabled}
        {...rest}
      >
        <View
          style={[
            styles.checkboxContainer,
            {
              width: sizeValues.box,
              height: sizeValues.box,
              borderColor: error ? colors.error : checked ? colors.primary : colors.border.light,
              backgroundColor: checked ? colors.primary : 'transparent',
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          {checked && (
            <Ionicons name="checkmark" size={sizeValues.icon} color={colors.background.primary} />
          )}
        </View>

        {label && (
          <Text
            variant="body"
            style={[
              styles.label,
              {
                marginLeft: sizeValues.padding * 3,
                color: disabled ? colors.text.tertiary : colors.text.primary,
              },
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>

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
  },
  checkboxContainer: {
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    marginTop: 4,
    marginLeft: 28,
  },
});

export default Checkbox;
