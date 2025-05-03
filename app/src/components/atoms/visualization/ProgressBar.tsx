import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

export interface ProgressBarProps {
  /**
   * Progress value from 0 to 100
   */
  value: number;
  
  /**
   * Height of the progress bar
   */
  height?: number;
  
  /**
   * Width of the progress bar
   */
  width?: number | string;
  
  /**
   * Label to display above the progress bar
   */
  label?: string;
  
  /**
   * Color of the unfilled track
   */
  trackColor?: string;
  
  /**
   * Color of the progress fill
   */
  fillColor?: string;
  
  /**
   * Border radius of the progress bar
   */
  borderRadius?: number;
  
  /**
   * Show percentage text next to the progress bar
   */
  showValue?: boolean;
  
  /**
   * Format for the value display
   */
  valuePrefix?: string;
  
  /**
   * Format for the value display
   */
  valueSuffix?: string;
  
  /**
   * Custom style for the container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Custom style for the label text
   */
  labelStyle?: StyleProp<TextStyle>;
  
  /**
   * Custom style for the value text
   */
  valueStyle?: StyleProp<TextStyle>;
  
  /**
   * Custom format function for the value display
   */
  formatValue?: (value: number) => string;
}

/**
 * ProgressBar component
 * 
 * A horizontal progress bar with customizable appearance.
 * Can display a label above the bar and percentage value.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  height = 10,
  width = '100%',
  label,
  trackColor,
  fillColor,
  borderRadius = 5,
  showValue = true,
  valuePrefix = '',
  valueSuffix = '%',
  style,
  labelStyle,
  valueStyle,
  formatValue,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  // Colors based on theme
  const trackColorWithDefault = trackColor || colors.border.light;
  const fillColorWithDefault = fillColor || colors.primary;
  
  // Format the display value
  const displayValue = formatValue 
    ? formatValue(clampedValue)
    : `${valuePrefix}${Math.round(clampedValue)}${valueSuffix}`;

  return (
    <View style={[styles.container, style]}>
      {/* Top row with label and value */}
      {(label || showValue) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={[styles.label, { color: colors.text.primary }, labelStyle]}>
              {label}
            </Text>
          )}
          {showValue && (
            <Text style={[styles.valueText, { color: colors.text.secondary }, valueStyle]}>
              {displayValue}
            </Text>
          )}
        </View>
      )}
      
      {/* Progress bar */}
      <View 
        style={[
          styles.track, 
          { 
            height, 
            width, 
            backgroundColor: trackColorWithDefault,
            borderRadius 
          }
        ]}
      >
        <View 
          style={[
            styles.fill, 
            {
              width: `${clampedValue}%`,
              height: '100%',
              backgroundColor: fillColorWithDefault,
              borderRadius
            }
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 12,
  },
  track: {
    overflow: 'hidden',
  },
  fill: {},
}); 