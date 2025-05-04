import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BarChart, BarData } from '../../atoms/visualization/BarChart';
import { useTheme } from '../../../contexts/ThemeContext';
import subscriptionCountService, {
  CategoryCount,
} from '../../../services/subscriptionCountService';

export interface SubscriptionCountChartProps {
  /**
   * Title for the chart
   */
  title?: string;

  /**
   * Custom height for the chart
   */
  height?: number;

  /**
   * Whether to show values on top of the bars
   */
  showValues?: boolean;

  /**
   * Callback when a category is selected
   */
  onCategorySelect?: (categoryId: string, categoryName: string) => void;
}

/**
 * SubscriptionCountChart component
 *
 * Displays a bar chart showing the number of subscriptions in each category.
 * Allows filtering the dashboard by clicking on a category.
 */
export const SubscriptionCountChart: React.FC<SubscriptionCountChartProps> = ({
  title = 'Subscriptions by Category',
  height = 300,
  showValues = true,
  onCategorySelect,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryCount[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { theme } = useTheme();
  const colors = theme.colors || {
    primary: '#4A80F0',
    secondary: '#7EB6FF',
    success: '#5DB075',
    error: '#F44336',
    warning: '#FFA726',
    text: {
      primary: '#1A1A1A',
      secondary: '#737373',
      tertiary: '#9E9E9E',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
    },
    border: {
      light: '#E0E0E0',
      medium: '#BDBDBD',
    },
  };

  // Fetch category count data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await subscriptionCountService.calculateSubscriptionCountByCategory();
        setCategoryData(data.filter(item => item.count > 0).sort((a, b) => b.count - a.count));

        const total = await subscriptionCountService.getTotalSubscriptionCount();
        setTotalCount(total);
      } catch (err) {
        console.error('Failed to fetch category count data:', err);
        setError('Failed to load subscription count data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform data for BarChart component
  const chartData = useMemo((): BarData[] => {
    return categoryData.map((item, index) => {
      // Generate color based on category color or fallback to index-based color
      const barColor =
        item.category.color ||
        [colors.primary, colors.secondary, colors.success, colors.warning, '#9C27B0'][index % 5];

      return {
        value: item.count,
        label: item.category.name,
        frontColor: barColor,
        onPress: () => {
          const newSelectedId = selectedCategory === item.category.id ? null : item.category.id;
          setSelectedCategory(newSelectedId);
          if (onCategorySelect) {
            onCategorySelect(item.category.id, item.category.name);
          }
        },
      };
    });
  }, [categoryData, selectedCategory, onCategorySelect, colors]);

  // Render legend items
  const renderLegend = () => {
    return (
      <View style={styles.legend}>
        {categoryData.map(item => (
          <TouchableOpacity
            key={item.category.id}
            style={[
              styles.legendItem,
              selectedCategory === item.category.id && styles.legendItemSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${item.category.name}: ${item.count} subscriptions`}
            accessibilityHint={`Double tap to ${selectedCategory === item.category.id ? 'deselect' : 'select'} category`}
            onPress={() => {
              const newSelectedId = selectedCategory === item.category.id ? null : item.category.id;
              setSelectedCategory(newSelectedId);
              if (onCategorySelect) {
                onCategorySelect(item.category.id, item.category.name);
              }
            }}
          >
            <View
              style={[
                styles.legendColor,
                {
                  backgroundColor:
                    item.category.color ||
                    [colors.primary, colors.secondary, colors.success, colors.warning, '#9C27B0'][
                      categoryData.indexOf(item) % 5
                    ],
                  borderColor:
                    selectedCategory === item.category.id ? colors.text.primary : 'transparent',
                },
              ]}
            />
            <View style={styles.legendText}>
              <Text
                style={[
                  styles.legendName,
                  {
                    color: colors.text.primary,
                    fontWeight: selectedCategory === item.category.id ? 'bold' : 'normal',
                  },
                ]}
              >
                {item.category.name}
              </Text>
              <Text style={[styles.legendCount, { color: colors.text.secondary }]}>
                {item.count} subscription{item.count !== 1 ? 's' : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Handle empty state
  if (!loading && categoryData.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            height,
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.light,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No subscription data available
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
            Add subscriptions with categories to see counts
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.light,
        },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
        <Text style={[styles.totalCount, { color: colors.primary }]}>Total: {totalCount}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading subscription data...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <BarChart
            data={chartData}
            height={height - 160} // Adjust height to leave room for legend
            barWidth={40}
            barBorderRadius={4}
            showValuesAsTopLabel={showValues}
            spacing={20}
            isAnimated={true}
            hideRules={true}
            hideYAxisText={false}
            yAxisTextStyle={{ color: colors.text.secondary }}
            xAxisLabelTextStyle={{ color: colors.text.secondary }}
            labelTextStyle={{ color: colors.text.primary }}
          />
          {renderLegend()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  legend: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 4,
    borderRadius: 4,
  },
  legendItemSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
  },
  legendText: {
    flex: 1,
  },
  legendName: {
    fontSize: 14,
  },
  legendCount: {
    fontSize: 12,
  },
});

export default SubscriptionCountChart;
