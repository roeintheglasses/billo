import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../../contexts/ThemeContext';
import { ChartContainer, ChartContainerProps } from './ChartContainer';

export interface BarData {
  value: number;
  label?: string;
  topLabelComponent?: React.ReactNode;
  frontColor?: string;
  sideColor?: string;
  topColor?: string;
  showGradient?: boolean;
  gradientColor?: string;
  onPress?: () => void;
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  disablePress?: boolean;
}

export interface BarChartProps extends Omit<ChartContainerProps, 'children'> {
  /**
   * Data for the bar chart
   */
  data: BarData[];
  
  /**
   * Whether to make the chart horizontal instead of vertical
   */
  horizontal?: boolean;
  
  /**
   * Main bar color (overridden by individual bar colors if provided)
   */
  barColor?: string;
  
  /**
   * Width of individual bars
   */
  barWidth?: number;
  
  /**
   * Spacing between bars
   */
  spacing?: number;
  
  /**
   * Radius for bar corners
   */
  barBorderRadius?: number;
  
  /**
   * Whether to round the top of the bars
   */
  roundedTop?: boolean;
  
  /**
   * Whether to round the bottom of the bars
   */
  roundedBottom?: boolean;
  
  /**
   * Whether to show X-axis label
   */
  hideAxesAndRules?: boolean;
  
  /**
   * Whether to animate the chart on initial render
   */
  isAnimated?: boolean;
  
  /**
   * Animation duration for the chart
   */
  animationDuration?: number;
  
  /**
   * Whether to hide Y-axis text
   */
  hideYAxisText?: boolean;
  
  /**
   * Whether to make a 3D bar chart
   */
  is3D?: boolean;
  
  /**
   * Side color for 3D bars
   */
  sideColor?: string;
  
  /**
   * Top color for 3D bars
   */
  topColor?: string;
  
  /**
   * Whether to show a gradient on the bars
   */
  showGradient?: boolean;
  
  /**
   * Gradient color for bars
   */
  gradientColor?: string;
  
  /**
   * Text color for X-axis labels
   */
  xAxisLabelTextStyle?: any;
  
  /**
   * Text color for Y-axis labels
   */
  yAxisTextStyle?: any;
  
  /**
   * Width of the Y-axis label container
   */
  yAxisLabelWidth?: number;
  
  /**
   * Number of sections on the Y-axis
   */
  noOfSections?: number;
  
  /**
   * Maximum value for the Y-axis (calculated automatically if not provided)
   */
  maxValue?: number;
  
  /**
   * Whether to show values on top of bars
   */
  showValuesAsTopLabel?: boolean;
  
  /**
   * Font size for value labels
   */
  labelTextStyle?: any;
  
  /**
   * Whether to hide the rules (horizontal grid lines)
   */
  hideRules?: boolean;
  
  /**
   * Function called when a bar is pressed
   */
  onPress?: (item: BarData, index: number) => void;
}

/**
 * BarChart component
 * 
 * A bar chart component for displaying categorical data with customizable bars,
 * colors, and animations using react-native-gifted-charts.
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  horizontal = false,
  barColor,
  barWidth = 30,
  spacing = 20,
  barBorderRadius = 0,
  roundedTop = false,
  roundedBottom = false,
  hideAxesAndRules = false,
  isAnimated = true,
  animationDuration = 800,
  hideYAxisText = false,
  is3D = false,
  sideColor,
  topColor,
  showGradient = false,
  gradientColor,
  xAxisLabelTextStyle,
  yAxisTextStyle,
  yAxisLabelWidth = 40,
  noOfSections = 5,
  maxValue,
  showValuesAsTopLabel = false,
  labelTextStyle,
  hideRules = false,
  onPress,
  ...chartContainerProps
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  
  // Generate theme-based props
  const themeBasedProps = useMemo(() => {
    const defaultBarColor = colors.primary;
    const defaultSideColor = colors.secondary || defaultBarColor;
    const defaultTopColor = colors.success || defaultBarColor;
    const defaultGradientColor = colors.error || defaultBarColor;
    
    // Text styles
    const xAxisTextStyle = xAxisLabelTextStyle || { 
      color: colors.text.secondary,
      fontSize: 10,
    };
    
    const yAxisStyle = yAxisTextStyle || {
      color: colors.text.secondary,
      fontSize: 10,
    };
    
    const valueLabelStyle = labelTextStyle || {
      color: colors.text.primary,
      fontSize: 10,
      fontWeight: 'bold',
    };
    
    return {
      barColor: barColor || defaultBarColor,
      sideColor: sideColor || defaultSideColor,
      topColor: topColor || defaultTopColor,
      gradientColor: gradientColor || defaultGradientColor,
      xAxisLabelTextStyle: xAxisTextStyle,
      yAxisTextStyle: yAxisStyle,
      labelTextStyle: valueLabelStyle,
      rulesColor: colors.border.light,
      xAxisColor: colors.border.medium,
      yAxisColor: colors.border.medium,
    };
  }, [
    colors, 
    barColor, 
    sideColor, 
    topColor, 
    gradientColor, 
    xAxisLabelTextStyle, 
    yAxisTextStyle, 
    labelTextStyle
  ]);
  
  return (
    <ChartContainer {...chartContainerProps}>
      <View style={styles.chartWrapper}>
        <GiftedBarChart
          data={data}
          horizontal={horizontal}
          barWidth={barWidth}
          spacing={spacing}
          barBorderRadius={barBorderRadius}
          frontColor={themeBasedProps.barColor}
          sideColor={is3D ? themeBasedProps.sideColor : undefined}
          topColor={is3D ? themeBasedProps.topColor : undefined}
          roundedTop={roundedTop}
          roundedBottom={roundedBottom}
          hideAxesAndRules={hideAxesAndRules}
          isAnimated={isAnimated}
          animationDuration={animationDuration}
          hideYAxisText={hideYAxisText}
          showGradient={showGradient}
          gradientColor={showGradient ? themeBasedProps.gradientColor : undefined}
          xAxisLabelTextStyle={themeBasedProps.xAxisLabelTextStyle}
          yAxisTextStyle={themeBasedProps.yAxisTextStyle}
          yAxisLabelWidth={yAxisLabelWidth}
          noOfSections={noOfSections}
          maxValue={maxValue}
          showValuesAsTopLabel={showValuesAsTopLabel}
          valueStyle={themeBasedProps.labelTextStyle}
          hideRules={hideRules}
          rulesColor={themeBasedProps.rulesColor}
          xAxisColor={themeBasedProps.xAxisColor}
          yAxisColor={themeBasedProps.yAxisColor}
          onPress={onPress}
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
    width: '100%'
  }
}); 