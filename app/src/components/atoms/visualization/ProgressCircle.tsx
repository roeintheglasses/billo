import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import Svg, { Circle, G } from 'react-native-svg';

export interface ProgressCircleProps {
  /**
   * Progress value from 0 to 100
   */
  value: number;
  
  /**
   * Circle size (diameter) in pixels
   */
  size?: number;
  
  /**
   * Thickness of the progress circle
   */
  thickness?: number;
  
  /**
   * Color of the unfilled track
   */
  trackColor?: string;
  
  /**
   * Color of the progress fill
   */
  fillColor?: string;
  
  /**
   * Show percentage text in the center
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
   * Custom style for the text
   */
  textStyle?: StyleProp<TextStyle>;
  
  /**
   * Custom format function for the value display
   */
  formatValue?: (value: number) => string;
  
  /**
   * Custom component to render in the center
   */
  centerComponent?: React.ReactNode;
}

/**
 * ProgressCircle component
 * 
 * A circular progress indicator with customizable appearance.
 * Can display percentage value in the center or a custom component.
 */
export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 100,
  thickness = 10,
  trackColor,
  fillColor,
  showValue = true,
  valuePrefix = '',
  valueSuffix = '%',
  style,
  textStyle,
  formatValue,
  centerComponent,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  // Calculate SVG parameters
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  
  // Colors based on theme
  const trackColorWithDefault = trackColor || colors.border.light;
  const fillColorWithDefault = fillColor || colors.primary;
  
  // Format the display value
  const displayValue = formatValue 
    ? formatValue(clampedValue)
    : `${valuePrefix}${Math.round(clampedValue)}${valueSuffix}`;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColorWithDefault}
            strokeWidth={thickness}
            fill="transparent"
          />
          
          {/* Progress Fill */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={fillColorWithDefault}
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      
      {/* Center Content */}
      <View style={styles.centerContent}>
        {centerComponent || (
          showValue && (
            <Text 
              style={[
                styles.valueText, 
                { color: colors.text.primary }, 
                textStyle
              ]}
            >
              {displayValue}
            </Text>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 