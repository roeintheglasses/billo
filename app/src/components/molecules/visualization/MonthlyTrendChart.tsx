import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from '../../atoms/visualization/LineChart';
import { useTheme } from '../../../contexts/ThemeContext';
import relationshipService from '../../../services/relationshipService';
import { formatCurrency } from '../../../utils/formatUtils';
import { exportDataAsCSV, formatSpendingDataForExport } from '../../../utils/exportUtils';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface MonthlyTrendChartProps {
  /**
   * Title for the chart
   */
  title?: string;
  
  /**
   * Number of months to display in the trend
   */
  months?: number;
  
  /**
   * Custom height for the chart
   */
  height?: number;
  
  /**
   * Whether to show the area under the line
   */
  showArea?: boolean;
  
  /**
   * Whether to use curved lines instead of straight lines
   */
  curved?: boolean;
  
  /**
   * Whether to show the average spending line
   */
  showAverage?: boolean;
  
  /**
   * Whether to show the export option
   */
  showExport?: boolean;
}

/**
 * MonthlyTrendChart Component
 * 
 * Displays a line chart showing the monthly spending trends over time.
 * Includes insights about average spending and trend direction.
 */
export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  title = 'Monthly Spending Trend',
  months = 6,
  height = 250,
  showArea = true,
  curved = true,
  showAverage = true,
  showExport = true,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ month: string; amount: number }[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch spending time series data
        const spendingData = await relationshipService.getSpendingTimeSeries(months);
        
        // Transform data for display
        if (spendingData) {
          // Map the data from period to month format
          const transformedData = spendingData.map(item => ({
            month: item.period,
            amount: item.amount
          }));
          setData(transformedData);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error('Error fetching monthly trend data:', err);
        setError('Failed to load spending trend data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [months]);
  
  // Transform data for chart display
  const chartData = useMemo(() => {
    return data.map(({ month, amount }) => {
      // Extract month from YYYY-MM format and convert to MMM format
      const date = new Date(month);
      const formattedMonth = date.toLocaleDateString(undefined, { month: 'short' });
      
      return {
        label: formattedMonth,
        value: amount,
        dataPointText: formatCurrency(amount)
      };
    });
  }, [data]);
  
  // Calculate insights
  const insights = useMemo(() => {
    if (data.length === 0) return null;
    
    const amounts = data.map(item => item.amount);
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    // Calculate percentage change between first and last month
    const oldestAmount = amounts[0];
    const latestAmount = amounts[amounts.length - 1];
    const percentageChange = oldestAmount > 0 
      ? ((latestAmount - oldestAmount) / oldestAmount) * 100 
      : 0;
    
    // Negative percentage change is good for spending (spending less)
    const isPositiveTrend = percentageChange <= 0;
    
    return {
      average,
      percentageChange: Math.abs(percentageChange).toFixed(1),
      isPositiveTrend,
    };
  }, [data]);

  // Handle export functionality
  const handleExport = async () => {
    if (data.length === 0) return;
    
    try {
      setIsExporting(true);
      const formattedData = formatSpendingDataForExport(data);
      await exportDataAsCSV(
        formattedData,
        'monthly-spending-trend',
        { Month: 'Month', Amount: 'Amount ($)' }
      );
    } catch (err) {
      console.error('Failed to export data:', err);
      setError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background?.secondary || '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderColor: colors.border?.light || '#E0E0E0',
      borderWidth: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    titleContainer: {
      flex: 1,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    exportText: {
      color: colors.primary || '#0066CC',
      marginLeft: 4,
      fontSize: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text?.primary || '#000000',
    },
    chartContainer: {
      height,
      marginVertical: 8,
    },
    insightContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    insightItem: {
      flex: 1,
      alignItems: 'center',
    },
    insightValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text?.primary || '#000000',
    },
    insightLabel: {
      fontSize: 12,
      color: colors.text?.secondary || '#757575',
      marginTop: 4,
    },
    trendIndicator: {
      fontSize: 16,
      marginLeft: 4,
    },
    positiveTrend: {
      color: colors.success || '#00C853',
    },
    negativeTrend: {
      color: colors.error || '#F44336',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: height * 0.7,
    },
    emptyText: {
      color: colors.text?.secondary || '#757575',
      fontSize: 14,
    },
    errorText: {
      color: colors.error || '#F44336',
      fontSize: 14,
      textAlign: 'center',
    },
  });
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.chartContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary || '#0066CC'} />
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.chartContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }
  
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No spending data available</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
        {showExport && (
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExport}
            disabled={isExporting || data.length === 0}
            accessibilityLabel="Export monthly spending data"
            accessibilityHint="Exports the monthly spending trend data as a CSV file"
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.primary || '#0066CC'} />
            ) : (
              <>
                <Icon name="export" size={20} color={colors.primary || '#0066CC'} />
                <Text style={styles.exportText}>Export</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.chartContainer}>
        <LineChart 
          data={chartData} 
          height={height}
          areaChart={showArea}
          curved={curved}
          hideDataPoints={false}
          color={colors.primary || '#0066CC'}
          thickness={3}
          startFillColor={colors.primary || '#0066CC'}
          endFillColor={colors.primary || '#0066CC'}
          startOpacity={0.6}
          endOpacity={0.1}
          hideRules={false}
          yAxisLabelWidth={60}
          hideYAxisText={false}
          showValuesAsDataPointsText={true}
          textColor={colors.text?.primary || '#000000'}
        />
      </View>
      
      {insights && (
        <View style={styles.insightContainer}>
          <View style={styles.insightItem}>
            <Text style={styles.insightValue}>{formatCurrency(insights.average)}</Text>
            <Text style={styles.insightLabel}>Average Monthly Spending</Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.insightValue}>{insights.percentageChange}%</Text>
              <Text 
                style={[
                  styles.trendIndicator, 
                  insights.isPositiveTrend ? styles.positiveTrend : styles.negativeTrend
                ]}
              >
                {insights.isPositiveTrend ? '↓' : '↑'}
              </Text>
            </View>
            <Text style={styles.insightLabel}>
              {insights.isPositiveTrend ? 'Decreased Spending' : 'Increased Spending'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}; 