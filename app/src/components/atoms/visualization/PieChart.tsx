import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PieChart as GiftedPieChart } from 'react-native-gifted-charts';
import { useTheme } from '../../../contexts/ThemeContext';
import { ChartContainer, ChartContainerProps } from './ChartContainer';

export interface PieChartData {
  value: number;
  color?: string;
  text?: string;
  textColor?: string;
  focused?: boolean;
  gradientCenterColor?: string;
  shiftX?: number;
  shiftY?: number;
  onPress?: () => void;
  textBackgroundColor?: string;
  textSize?: number;
  radius?: number;
}

export interface PieChartProps extends Omit<ChartContainerProps, 'children'> {
  /**
   * Data for pie chart segments
   */
  data: PieChartData[];

  /**
   * Whether to show a donut chart instead of a pie chart
   */
  donut?: boolean;

  /**
   * Inner radius for donut chart
   */
  innerRadius?: number;

  /**
   * Inner circle color for donut chart
   */
  innerCircleColor?: string;

  /**
   * Inner circle border width for donut chart
   */
  innerCircleBorderWidth?: number;

  /**
   * Inner circle border color for donut chart
   */
  innerCircleBorderColor?: string;

  /**
   * Whether to show text labels on segments
   */
  showText?: boolean;

  /**
   * Size of the pie chart
   */
  radius?: number;

  /**
   * Text size for segment labels
   */
  textSize?: number;

  /**
   * Background color for text labels
   */
  textBackgroundColor?: string;

  /**
   * Color for text labels
   */
  textColor?: string;

  /**
   * Whether to show total value in center (for donut)
   */
  showInnerComponent?: boolean;

  /**
   * Custom inner component
   */
  innerComponent?: React.ReactNode;

  /**
   * Label position offset from center
   */
  labelsPosition?: number;

  /**
   * Function called when a segment is pressed
   */
  onPress?: (item: PieChartData, index: number) => void;

  /**
   * Whether to animate the chart
   */
  isAnimated?: boolean;

  /**
   * Animation duration
   */
  animationDuration?: number;
}

/**
 * PieChart component
 *
 * A pie/donut chart component for displaying part-to-whole relationships
 * with customizable segments, labels, and animations.
 */
export const PieChart: React.FC<PieChartProps> = ({
  data,
  donut = false,
  innerRadius = 50,
  innerCircleColor,
  innerCircleBorderWidth,
  innerCircleBorderColor,
  showText = false,
  radius = 120,
  textSize = 12,
  textBackgroundColor,
  textColor,
  showInnerComponent = false,
  innerComponent,
  labelsPosition,
  onPress,
  isAnimated = true,
  animationDuration = 1000,
  ...chartContainerProps
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Generate colors based on theme
  const themeBasedProps = useMemo(() => {
    // Default colors
    const defaultInnerCircleColor = colors.background.primary;
    const defaultInnerCircleBorderColor = colors.border.light;
    const defaultTextBgColor = colors.background.secondary;
    const defaultTextColor = colors.text.primary;

    // Apply theme colors to data segments if not specified
    const coloredData = data.map((item, index) => {
      // Generate colors based on index if not provided
      if (!item.color) {
        // Use a pattern to cycle through available theme colors
        const colorOptions = [
          colors.primary,
          colors.secondary || colors.primary,
          colors.success || colors.primary,
          colors.warning || colors.primary,
          colors.error || colors.primary,
        ];

        return {
          ...item,
          color: colorOptions[index % colorOptions.length],
          textColor: item.textColor || defaultTextColor,
        };
      }

      return item;
    });

    return {
      data: coloredData,
      innerCircleColor: innerCircleColor || defaultInnerCircleColor,
      innerCircleBorderColor: innerCircleBorderColor || defaultInnerCircleBorderColor,
      textBackgroundColor: textBackgroundColor || defaultTextBgColor,
      textColor: textColor || defaultTextColor,
    };
  }, [data, colors, innerCircleColor, innerCircleBorderColor, textBackgroundColor, textColor]);

  return (
    <ChartContainer {...chartContainerProps}>
      <View style={styles.chartWrapper}>
        <GiftedPieChart
          data={themeBasedProps.data}
          donut={donut}
          innerRadius={donut ? innerRadius : undefined}
          innerCircleColor={donut ? themeBasedProps.innerCircleColor : undefined}
          innerCircleBorderWidth={donut ? innerCircleBorderWidth : undefined}
          innerCircleBorderColor={donut ? themeBasedProps.innerCircleBorderColor : undefined}
          showText={showText}
          radius={radius}
          textSize={textSize}
          textBackgroundColor={themeBasedProps.textBackgroundColor}
          textColor={themeBasedProps.textColor}
          showInnerComponent={donut && showInnerComponent}
          innerComponent={innerComponent}
          labelsPosition={labelsPosition}
          onPress={onPress}
          isAnimated={isAnimated}
          animationDuration={animationDuration}
        />
      </View>
    </ChartContainer>
  );
};

const styles = StyleSheet.create({
  chartWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
