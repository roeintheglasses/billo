import React from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextStyle,
  Text,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type SpinnerSize = 'small' | 'medium' | 'large';

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  text?: string;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  fullScreen?: boolean;
  overlay?: boolean;
  testID?: string;
}

/**
 * Spinner component for showing loading states
 *
 * @param {string} size - Size of the spinner ('small', 'medium', 'large')
 * @param {string} color - Custom color for the spinner
 * @param {string} text - Optional text to display below the spinner
 * @param {object} textStyle - Custom styles for the text
 * @param {object} style - Custom styles for the container
 * @param {boolean} fullScreen - Whether to display the spinner in full screen
 * @param {boolean} overlay - Whether to display the spinner as an overlay
 * @returns {React.ReactElement} A loading spinner component
 *
 * @example
 * // Basic usage
 * <Spinner />
 *
 * // With custom size and text
 * <Spinner size="large" text="Loading data..." />
 *
 * // Full screen overlay
 * <Spinner fullScreen overlay />
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color,
  text,
  textStyle,
  style,
  fullScreen = false,
  overlay = false,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Map component size to ActivityIndicator size
  const getActivityIndicatorSize = (): 'small' | 'large' | number => {
    switch (size) {
      case 'small':
        return 'small'; // Default small size
      case 'medium':
        return 'large'; // Default large size
      case 'large':
        return 48; // Custom size
      default:
        return 'large';
    }
  };

  // Container styles
  const containerStyles: StyleProp<ViewStyle> = [
    styles.container,
    fullScreen && styles.fullScreen,
    overlay && styles.overlay,
    style,
  ];

  return (
    <View style={containerStyles} testID={testID}>
      <ActivityIndicator size={getActivityIndicatorSize()} color={color || colors.primary} />
      {text ? (
        <Text style={[styles.text, { color: colors.text.secondary }, textStyle]}>{text}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  fullScreen: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  text: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default Spinner;
