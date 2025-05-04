import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  DimensionValue,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type CardVariant = 'default' | 'outlined' | 'elevated';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * Card component for creating containers with consistent styling
 *
 * @param {string} variant - Style variant ('default', 'outlined', 'elevated')
 * @param {number|string} padding - Custom padding for the card content
 * @param {number} radius - Custom border radius
 * @param {function} onPress - Function to call when card is pressed (makes card touchable)
 * @param {boolean} disabled - Whether the card is disabled (only applies with onPress)
 * @returns {React.ReactElement} A styled card component
 *
 * @example
 * // Basic usage
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 *
 * // With variant and custom styling
 * <Card
 *   variant="elevated"
 *   padding={16}
 *   radius={12}
 *   style={{ marginBottom: 16 }}
 * >
 *   <Text>Elevated Card</Text>
 * </Card>
 *
 * // Touchable card
 * <Card onPress={() => console.log('Card pressed')}>
 *   <Text>Tap me</Text>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 16,
  radius = 8,
  onPress,
  disabled = false,
  style,
  children,
  testID,
  ...rest
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Determine variant-specific styles
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.background.primary,
          borderWidth: 1,
          borderColor: colors.border.light,
          elevation: 0,
          shadowOpacity: 0,
        };
      case 'elevated':
        return {
          backgroundColor: colors.background.primary,
          borderWidth: 0,
          elevation: 4,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        };
      default: // 'default'
        return {
          backgroundColor: colors.background.secondary,
          borderWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        };
    }
  };

  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      padding,
      borderRadius: radius,
      ...getVariantStyle(),
    },
    style,
  ];

  // Render as TouchableOpacity if onPress is provided, otherwise as View
  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        testID={testID}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} testID={testID} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
  },
});

export default Card;
