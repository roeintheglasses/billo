import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../../contexts/ThemeContext';
import { ChartContainer, ChartContainerProps } from './ChartContainer';

export interface GaugeChartProps extends Omit<ChartContainerProps, 'children'> {
  /**
   * Current value to display on the gauge
   */
  value: number;
  
  /**
   * Minimum value of the gauge
   */
  minValue?: number;
  
  /**
   * Maximum value of the gauge
   */
  maxValue?: number;
  
  /**
   * Size of the gauge (diameter)
   */
  size?: number;
  
  /**
   * Thickness of the gauge arc
   */
  thickness?: number;
  
  /**
   * Background color of the unfilled part of gauge
   */
  trackColor?: string;
  
  /**
   * Color of the filled part of gauge
   */
  fillColor?: string;
  
  /**
   * Angle of the gauge arc (180 = semi-circle)
   */
  arcAngle?: number;
  
  /**
   * Whether to show the value as text in center
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
   * Custom style for the value text
   */
  valueTextStyle?: StyleProp<TextStyle>;
  
  /**
   * Whether to show min and max labels
   */
  showLabels?: boolean;
  
  /**
   * Custom style for the min/max labels
   */
  labelTextStyle?: StyleProp<TextStyle>;
  
  /**
   * Custom format function for the value display
   */
  formatValue?: (value: number) => string;
  
  /**
   * Array of segments to define multiple color ranges
   * Each segment should have startValue, endValue, and color
   */
  segments?: Array<{
    startValue: number;
    endValue: number;
    color: string;
  }>;
  
  /**
   * Whether to animate the gauge on value change
   * Note: Animation not currently implemented
   */
  animated?: boolean;
  
  /**
   * Animation duration in milliseconds
   * Note: Animation not currently implemented
   */
  animationDuration?: number;
}

/**
 * GaugeChart component
 * 
 * A semi-circular gauge chart for displaying a value within a range.
 * Supports multiple visualization options like segments, labels, and animations.
 * 
 * @example
 * <GaugeChart 
 *   value={75}
 *   maxValue={100}
 *   size={200}
 *   thickness={15}
 *   showValue={true}
 *   valueSuffix="%"
 *   showLabels={true}
 * />
 */
export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  minValue = 0,
  maxValue = 100,
  size = 200,
  thickness = 15,
  trackColor,
  fillColor,
  arcAngle = 180,
  showValue = true,
  valuePrefix = '',
  valueSuffix = '',
  style,
  valueTextStyle,
  showLabels = false,
  labelTextStyle,
  formatValue,
  segments,
  animated = true,
  animationDuration = 1000,
  ...chartContainerProps
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  
  // Clamp value between min and max
  const clampedValue = useMemo(() => {
    return Math.min(Math.max(value, minValue), maxValue);
  }, [value, minValue, maxValue]);
  
  // Calculate the angle for the filled arc based on the value
  const fillAngle = useMemo(() => {
    const valueRange = maxValue - minValue;
    const valuePercent = (clampedValue - minValue) / valueRange;
    return valuePercent * arcAngle;
  }, [clampedValue, minValue, maxValue, arcAngle]);
  
  // Colors based on theme
  const trackColorWithDefault = trackColor || colors.border.light;
  const fillColorWithDefault = fillColor || colors.primary;
  
  // Format the display value
  const displayValue = useMemo(() => {
    if (formatValue) {
      return formatValue(clampedValue);
    } else {
      return `${valuePrefix}${Math.round(clampedValue)}${valueSuffix}`;
    }
  }, [clampedValue, formatValue, valuePrefix, valueSuffix]);
  
  // SVG coordinates and dimensions
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size - thickness) / 2;
  
  // Calculate the path for the gauge arc
  const createArcPath = (startAngle: number, endAngle: number) => {
    // Convert angles to radians and adjust for the starting position
    const startAngleRad = (270 + startAngle - arcAngle / 2) * (Math.PI / 180);
    const endAngleRad = (270 + endAngle - arcAngle / 2) * (Math.PI / 180);
    
    // Calculate start and end points
    const startX = centerX + radius * Math.cos(startAngleRad);
    const startY = centerY + radius * Math.sin(startAngleRad);
    const endX = centerX + radius * Math.cos(endAngleRad);
    const endY = centerY + radius * Math.sin(endAngleRad);
    
    // Create the arc flag (0 for minor arc, 1 for major arc)
    const arcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    // SVG path
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${arcFlag} 1 ${endX} ${endY}`;
  };
  
  // Create the track path (background)
  const trackPath = useMemo(() => createArcPath(0, arcAngle), [arcAngle, radius, centerX, centerY]);
  
  // Create the fill path based on value
  const fillPath = useMemo(() => createArcPath(0, fillAngle), [fillAngle, radius, centerX, centerY]);
  
  // Create segment paths if segments are provided
  const segmentPaths = useMemo(() => {
    if (!segments || segments.length === 0) return [];
    
    return segments.map(segment => {
      const valueRange = maxValue - minValue;
      const startPercent = (segment.startValue - minValue) / valueRange;
      const endPercent = (segment.endValue - minValue) / valueRange;
      const startAngle = startPercent * arcAngle;
      const endAngle = endPercent * arcAngle;
      
      return {
        path: createArcPath(startAngle, endAngle),
        color: segment.color
      };
    });
  }, [segments, minValue, maxValue, arcAngle, radius, centerX, centerY]);
  
  // Calculate positions for min and max labels
  const minLabelPosition = useMemo(() => {
    const angle = (270 - arcAngle / 2) * (Math.PI / 180);
    return {
      x: centerX + (radius + thickness / 2 + 10) * Math.cos(angle),
      y: centerY + (radius + thickness / 2 + 10) * Math.sin(angle),
    };
  }, [radius, centerX, centerY, thickness, arcAngle]);
  
  const maxLabelPosition = useMemo(() => {
    const angle = (270 + arcAngle / 2) * (Math.PI / 180);
    return {
      x: centerX + (radius + thickness / 2 + 10) * Math.cos(angle),
      y: centerY + (radius + thickness / 2 + 10) * Math.sin(angle),
    };
  }, [radius, centerX, centerY, thickness, arcAngle]);
  
  return (
    <ChartContainer {...chartContainerProps}>
      <View style={[styles.container, { width: size, height: size / 2 + 20 }, style]}>
        <Svg width={size} height={size / 2 + 20}>
          {/* Background Track */}
          <Path
            d={trackPath}
            stroke={trackColorWithDefault}
            strokeWidth={thickness}
            fill="transparent"
            strokeLinecap="round"
          />
          
          {/* Segments if provided */}
          {segments && segmentPaths.map((segment, index) => (
            <Path
              key={`segment-${index}`}
              d={segment.path}
              stroke={segment.color}
              strokeWidth={thickness}
              fill="transparent"
              strokeLinecap="round"
            />
          ))}
          
          {/* Value Fill (if not using segments) */}
          {(!segments || segments.length === 0) && (
            <Path
              d={fillPath}
              stroke={fillColorWithDefault}
              strokeWidth={thickness}
              fill="transparent"
              strokeLinecap="round"
            />
          )}
          
          {/* Min/Max Labels */}
          {showLabels && (
            <>
              <SvgText
                x={minLabelPosition.x}
                y={minLabelPosition.y}
                fontSize={12}
                fill={colors.text.secondary}
                textAnchor="middle"
                fontWeight="500"
              >
                {minValue}
              </SvgText>
              <SvgText
                x={maxLabelPosition.x}
                y={maxLabelPosition.y}
                fontSize={12}
                fill={colors.text.secondary}
                textAnchor="middle"
                fontWeight="500"
              >
                {maxValue}
              </SvgText>
            </>
          )}
          
          {/* Center Value Display */}
          {showValue && (
            <SvgText
              x={centerX}
              y={centerY + radius/2}
              fontSize={16}
              fontWeight="bold"
              fill={colors.text.primary}
              textAnchor="middle"
            >
              {displayValue}
            </SvgText>
          )}
        </Svg>
      </View>
    </ChartContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 