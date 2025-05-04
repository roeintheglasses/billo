import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../../contexts/ThemeContext';
import { ChartContainer, ChartContainerProps } from './ChartContainer';

export interface DataPoint {
  value: number;
  label?: string;
  dataPointText?: string;
  topLabelComponent?: React.ReactNode;
  bottomLabelComponent?: React.ReactNode;
  showDataPoint?: boolean;
  dataPointColor?: string;
  dataPointRadius?: number;
  color?: string;
}

export interface LineChartProps extends Omit<ChartContainerProps, 'children'> {
  /**
   * Data for the line chart
   */
  data: DataPoint[];

  /**
   * Whether to show data points on the line
   */
  showDataPoints?: boolean;

  /**
   * Whether to make the line curved instead of straight segments
   */
  curved?: boolean;

  /**
   * Whether to fill the area under the line
   */
  areaChart?: boolean;

  /**
   * Color for the line
   */
  color?: string;

  /**
   * Thickness of the line
   */
  thickness?: number;

  /**
   * Start gradient color for area chart
   */
  startFillColor?: string;

  /**
   * End gradient color for area chart
   */
  endFillColor?: string;

  /**
   * Start gradient opacity for area chart
   */
  startOpacity?: number;

  /**
   * End gradient opacity for area chart
   */
  endOpacity?: number;

  /**
   * Whether to animate the chart on initial render
   */
  animated?: boolean;

  /**
   * Animation delay in milliseconds (if animated is true)
   */
  animationDuration?: number;

  /**
   * Text color for X-axis labels
   */
  xAxisLabelTextStyle?: any;

  /**
   * Text color for Y-axis labels
   */
  yAxisTextStyle?: any;

  /**
   * Label for the X-axis
   */
  xAxisLabelText?: string;

  /**
   * Label for the Y-axis
   */
  yAxisLabelText?: string;

  /**
   * Width of the Y-axis label container
   */
  yAxisLabelWidth?: number;

  /**
   * Whether to hide the Y-axis text
   */
  hideYAxisText?: boolean;

  /**
   * Whether to hide rules (horizontal grid lines)
   */
  hideRules?: boolean;

  /**
   * Whether to show points for data values
   */
  hideDataPoints?: boolean;

  /**
   * Color for the data points
   */
  dataPointsColor?: string;

  /**
   * Size of the data points
   */
  dataPointsRadius?: number;

  /**
   * Maximum value for the Y-axis (calculated automatically if not provided)
   */
  maxValue?: number;

  /**
   * Number of sections on the Y-axis
   */
  noOfSections?: number;

  /**
   * Step value between Y-axis labels
   */
  stepValue?: number;

  /**
   * Whether to show Y-axis label above each point
   */
  showValuesAsDataPointsText?: boolean;

  /**
   * Size of the font for data point value labels
   */
  textFontSize?: number;

  /**
   * Color of the font for data point value labels
   */
  textColor?: string;
}

/**
 * LineChart component
 *
 * A line chart component for displaying trends over time using react-native-gifted-charts.
 * Supports styling, animation, and various customization options.
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  showDataPoints = true,
  curved = true,
  areaChart = false,
  color,
  thickness = 2,
  startFillColor,
  endFillColor,
  startOpacity = 0.8,
  endOpacity = 0.2,
  animated = true,
  animationDuration = 1000,
  xAxisLabelTextStyle,
  yAxisTextStyle,
  xAxisLabelText,
  yAxisLabelText,
  yAxisLabelWidth = 40,
  hideYAxisText = false,
  hideRules = false,
  hideDataPoints = false,
  dataPointsColor,
  dataPointsRadius = 4,
  maxValue,
  noOfSections = 5,
  stepValue,
  showValuesAsDataPointsText = false,
  textFontSize = 12,
  textColor,
  ...chartContainerProps
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  // Generate colors based on theme
  const themeBasedProps = useMemo(() => {
    const lineColor = color || colors.primary;
    const pointColor = dataPointsColor || lineColor;
    const valueTextColor = textColor || colors.text.secondary;

    // Area chart gradient colors if not specified
    const areaStartColor = startFillColor || lineColor;
    const areaEndColor = endFillColor || areaStartColor;

    // Text styles
    const xAxisTextStyle = xAxisLabelTextStyle || {
      color: colors.text.secondary,
      fontSize: 10,
    };

    const yAxisStyle = yAxisTextStyle || {
      color: colors.text.secondary,
      fontSize: 10,
    };

    return {
      color: lineColor,
      dataPointsColor: pointColor,
      startFillColor: areaStartColor,
      endFillColor: areaEndColor,
      textColor: valueTextColor,
      xAxisLabelTextStyle: xAxisTextStyle,
      yAxisTextStyle: yAxisStyle,
      rulesColor: colors.border.light,
      xAxisColor: colors.border.medium,
      yAxisColor: colors.border.medium,
    };
  }, [
    color,
    colors,
    dataPointsColor,
    textColor,
    startFillColor,
    endFillColor,
    xAxisLabelTextStyle,
    yAxisTextStyle,
  ]);

  return (
    <ChartContainer {...chartContainerProps}>
      <View style={styles.chartWrapper}>
        <GiftedLineChart
          data={data}
          hideDataPoints={!showDataPoints || hideDataPoints}
          curved={curved}
          areaChart={areaChart}
          color={themeBasedProps.color}
          thickness={thickness}
          startFillColor={themeBasedProps.startFillColor}
          endFillColor={themeBasedProps.endFillColor}
          startOpacity={startOpacity}
          endOpacity={endOpacity}
          isAnimated={animated}
          animationDuration={animationDuration}
          xAxisLabelTextStyle={themeBasedProps.xAxisLabelTextStyle}
          yAxisTextStyle={themeBasedProps.yAxisTextStyle}
          yAxisLabelWidth={yAxisLabelWidth}
          hideYAxisText={hideYAxisText}
          hideRules={hideRules}
          dataPointsColor={themeBasedProps.dataPointsColor}
          dataPointsRadius={dataPointsRadius}
          maxValue={maxValue}
          noOfSections={noOfSections}
          stepValue={stepValue}
          showValuesAsDataPointsText={showValuesAsDataPointsText}
          textFontSize={textFontSize}
          textColor={themeBasedProps.textColor}
          rulesColor={themeBasedProps.rulesColor}
          xAxisColor={themeBasedProps.xAxisColor}
          yAxisColor={themeBasedProps.yAxisColor}
          width={chartContainerProps.width ? Number(chartContainerProps.width) - 32 : undefined}
          height={chartContainerProps.height ? chartContainerProps.height - 70 : 230}
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
