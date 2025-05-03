import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

export interface ChartContainerProps {
  /**
   * The title displayed above the chart
   */
  title?: string;
  
  /**
   * Optional subtitle for additional context
   */
  subtitle?: string;
  
  /**
   * The chart component to render
   */
  children: React.ReactNode;
  
  /**
   * Whether the chart is in a loading state
   */
  loading?: boolean;
  
  /**
   * Error message to display when chart data fails to load
   */
  error?: string;
  
  /**
   * Height of the chart container
   */
  height?: number;
  
  /**
   * Width of the chart container
   */
  width?: DimensionValue;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * ChartContainer component
 * 
 * A container for data visualization components with support for titles,
 * loading states, and error handling. Applies consistent styling and theme support.
 * 
 * @example
 * <ChartContainer 
 *   title="Monthly Expenses"
 *   subtitle="Last 6 months"
 *   height={300}
 * >
 *   <LineChart data={data} />
 * </ChartContainer>
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  loading = false,
  error,
  height = 300,
  width = '100%',
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Define styles based on theme
  const containerStyle = {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.light,
  };

  const textStyle = {
    color: colors.text.primary,
  };

  const subtitleStyle = {
    color: colors.text.secondary,
  };

  const errorStyle = {
    color: colors.error,
  };

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator 
            size="large" 
            color={colors.primary} 
            accessibilityLabel="Loading chart data"
          />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={[styles.error, errorStyle]} accessibilityLabel={`Chart error: ${error}`}>
            {error}
          </Text>
        </View>
      );
    }

    return <View style={styles.chartContent}>{children}</View>;
  };

  return (
    <View 
      style={[
        styles.container, 
        containerStyle,
        { height, width },
        style
      ]}
      accessibilityLabel={title ? `Chart: ${title}` : 'Chart'}
    >
      <View style={styles.header}>
        {title && (
          <Text style={[styles.title, textStyle]} accessibilityRole="header">
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]}>
            {subtitle}
          </Text>
        )}
      </View>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  chartContent: {
    flex: 1,
    width: '100%',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 