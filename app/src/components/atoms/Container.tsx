import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  ScrollView,
  StyleProp,
  ViewStyle,
  SafeAreaView,
  DimensionValue,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export interface ContainerProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: DimensionValue;
  center?: boolean;
  fullWidth?: boolean;
  useSafeArea?: boolean;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Container component for consistent page layouts with proper spacing and sizing
 *
 * @param {boolean} scrollable - Whether the container should be scrollable
 * @param {number|string} padding - Custom padding around content
 * @param {boolean} center - Center the content vertically and horizontally
 * @param {boolean} fullWidth - Use full width without horizontal padding
 * @param {boolean} useSafeArea - Wrap in SafeAreaView for notch/home bar protection
 * @param {string} backgroundColor - Custom background color (overrides theme)
 * @param {object} style - Additional styles for the container
 * @param {object} contentContainerStyle - Styles for ScrollView's content container
 * @returns {React.ReactElement} A styled container component
 *
 * @example
 * // Basic usage
 * <Container>
 *   <Text>Content</Text>
 * </Container>
 *
 * // Scrollable with custom padding
 * <Container scrollable padding={24}>
 *   <Text>Scrollable content</Text>
 * </Container>
 *
 * // Centered content
 * <Container center>
 *   <Text>Centered content</Text>
 * </Container>
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  scrollable = false,
  padding = 16,
  center = false,
  fullWidth = false,
  useSafeArea = true,
  backgroundColor,
  style,
  contentContainerStyle,
  ...rest
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const containerStyles: StyleProp<ViewStyle> = [
    styles.container,
    {
      backgroundColor: backgroundColor || colors.background.primary,
      padding: fullWidth ? 0 : padding,
    },
    center && styles.centered,
    style,
  ];

  const scrollContentContainerStyle: StyleProp<ViewStyle> = [
    center && styles.centered,
    contentContainerStyle,
  ];

  // Determine the content based on scrollable prop
  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={scrollContentContainerStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  // Wrap in SafeAreaView if requested
  if (useSafeArea) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: backgroundColor || colors.background.primary }]}
      >
        <View style={containerStyles} {...rest}>
          {content}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={containerStyles} {...rest}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Container;
