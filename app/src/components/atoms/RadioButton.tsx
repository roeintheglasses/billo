import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface RadioButtonProps {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  selected,
  onSelect,
  disabled = false,
  size = 'medium',
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Determine sizes based on the size prop
  const getSizes = () => {
    switch (size) {
      case 'small':
        return {
          outer: 16,
          inner: 8,
        };
      case 'large':
        return {
          outer: 24,
          inner: 12,
        };
      case 'medium':
      default:
        return {
          outer: 20,
          inner: 10,
        };
    }
  };

  const sizes = getSizes();

  return (
    <TouchableOpacity
      onPress={onSelect}
      disabled={disabled}
      style={[
        styles.container,
        {
          width: sizes.outer,
          height: sizes.outer,
          borderColor: disabled
            ? colors.text.tertiary
            : selected
              ? colors.primary
              : colors.border.light,
          opacity: disabled ? 0.7 : 1,
        },
      ]}
    >
      {selected && (
        <View
          style={[
            styles.inner,
            {
              width: sizes.inner,
              height: sizes.inner,
              backgroundColor: disabled ? colors.text.tertiary : colors.primary,
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 100, // Make it fully rounded
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    borderRadius: 100, // Make it fully rounded
  },
});
