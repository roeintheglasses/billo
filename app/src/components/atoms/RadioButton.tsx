import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  TouchableOpacityProps 
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';

export interface RadioButtonProps extends TouchableOpacityProps {
  selected: boolean;
  onSelect: () => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  error?: string;
}

/**
 * RadioButton component for single selection from a group
 * 
 * @param {boolean} selected - Whether the radio button is selected
 * @param {function} onSelect - Callback function when radio button is selected
 * @param {string} label - Optional label text to display next to radio button
 * @param {string} size - Size variant of the radio button ('small', 'medium', 'large')
 * @param {boolean} disabled - Whether the radio button is disabled
 * @param {string} error - Error message to display below the radio button
 * @returns {React.ReactElement} A styled radio button component
 * 
 * @example
 * // Basic usage in a group
 * const [selected, setSelected] = useState('option1');
 * 
 * <RadioButton
 *   selected={selected === 'option1'}
 *   onSelect={() => setSelected('option1')}
 *   label="Option 1"
 * />
 * <RadioButton
 *   selected={selected === 'option2'}
 *   onSelect={() => setSelected('option2')}
 *   label="Option 2"
 * />
 */
export const RadioButton: React.FC<RadioButtonProps> = ({
  selected,
  onSelect,
  label,
  size = 'medium',
  disabled = false,
  error,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  
  // Get size dimensions based on the size prop
  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          outer: 16,
          inner: 6,
        };
      case 'large':
        return {
          outer: 24,
          inner: 10,
        };
      default: // medium
        return {
          outer: 20,
          inner: 8,
        };
    }
  };
  
  const dimensions = getSize();
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onSelect}
        disabled={disabled}
        style={[
          styles.row,
          style,
        ]}
        {...rest}
      >
        <View
          style={[
            styles.outerCircle,
            {
              width: dimensions.outer,
              height: dimensions.outer,
              borderColor: error 
                ? colors.error 
                : selected 
                  ? colors.primary 
                  : colors.border.light,
              borderWidth: 2,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          {selected && (
            <View
              style={[
                styles.innerCircle,
                {
                  width: dimensions.inner,
                  height: dimensions.inner,
                  backgroundColor: error ? colors.error : colors.primary,
                },
              ]}
            />
          )}
        </View>
        
        {label && (
          <Text
            variant="body"
            style={[
              styles.label,
              { color: disabled ? colors.text.tertiary : colors.text.primary }
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
  outerCircle: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    borderRadius: 100,
  },
  label: {
    marginLeft: 10,
    flexShrink: 1,
  },
  error: {
    marginTop: 4,
    marginLeft: 30,
  },
});

export default RadioButton; 