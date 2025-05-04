import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { PieChart, PieChartData } from '../../atoms/visualization/PieChart';
import { useTheme } from '../../../contexts/ThemeContext';
import subscriptionService from '../../../services/subscriptionService';
import { formatCurrency } from '../../../utils/formatUtils';
import { Category } from '../../../types/supabase';

interface CategorySpending {
  category: Category;
  amount: number;
}

interface CategoryDistributionChartProps {
  /**
   * Title for the chart
   */
  title?: string;
  
  /**
   * Whether to show a legend
   */
  showLegend?: boolean;
  
  /**
   * Custom height for the chart
   */
  height?: number;
  
  /**
   * Callback when a category is selected
   */
  onCategorySelect?: (category: Category, amount: number) => void;
}

/**
 * CategoryDistributionChart component
 * 
 * Displays a donut chart showing the distribution of subscription costs
 * across different categories.
 */
export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  title = 'Spending by Category',
  showLegend = true,
  height = 300,
  onCategorySelect
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  
  // Fetch category spending data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await subscriptionService.calculateSpendingByCategory();
        setCategoryData(data);
      } catch (err) {
        console.error('Failed to fetch category data:', err);
        setError('Failed to load category data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Calculate total monthly spending
  const totalSpending = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.amount, 0);
  }, [categoryData]);
  
  // Transform data for PieChart component
  const chartData = useMemo((): PieChartData[] => {
    return categoryData.map((item, index) => ({
      value: item.amount,
      text: item.category.name,
      // Use category color if available, otherwise use index-based color
      focused: selectedCategory === item.category.id,
      onPress: () => {
        setSelectedCategory(
          selectedCategory === item.category.id ? null : item.category.id
        );
        if (onCategorySelect) {
          onCategorySelect(item.category, item.amount);
        }
      }
    }));
  }, [categoryData, selectedCategory, onCategorySelect]);
  
  // Create inner component for the donut center
  const innerComponent = useMemo(() => {
    if (selectedCategory) {
      const selected = categoryData.find(item => item.category.id === selectedCategory);
      if (selected) {
        const percentage = Math.round((selected.amount / totalSpending) * 100);
        return (
          <View style={styles.innerComponent}>
            <Text style={[styles.selectedCategory, { color: colors.text.primary }]}>
              {selected.category.name}
            </Text>
            <Text style={[styles.selectedAmount, { color: colors.primary }]}>
              {formatCurrency(selected.amount)}
            </Text>
            <Text style={[styles.selectedPercentage, { color: colors.text.secondary }]}>
              {percentage}% of total
            </Text>
          </View>
        );
      }
    }
    
    return (
      <View style={styles.innerComponent}>
        <Text style={[styles.totalLabel, { color: colors.text.secondary }]}>
          Monthly
        </Text>
        <Text style={[styles.totalAmount, { color: colors.text.primary }]}>
          {formatCurrency(totalSpending)}
        </Text>
      </View>
    );
  }, [selectedCategory, categoryData, totalSpending, colors]);
  
  // Render legend items
  const renderLegend = () => {
    return (
      <View style={styles.legend}>
        {categoryData.map((item) => {
          // Find matching chart data to get the color
          const chartItem = chartData.find(
            chartItem => chartItem.text === item.category.name
          );
          
          return (
            <TouchableOpacity
              key={item.category.id}
              style={styles.legendItem}
              onPress={() => {
                setSelectedCategory(
                  selectedCategory === item.category.id ? null : item.category.id
                );
                if (onCategorySelect) {
                  onCategorySelect(item.category, item.amount);
                }
              }}
            >
              <View 
                style={[
                  styles.legendColor, 
                  { 
                    backgroundColor: chartItem?.color || colors.primary,
                    borderColor: selectedCategory === item.category.id 
                      ? colors.text.primary 
                      : 'transparent'
                  }
                ]} 
              />
              <View style={styles.legendText}>
                <Text 
                  style={[
                    styles.legendName, 
                    { 
                      color: colors.text.primary,
                      fontWeight: selectedCategory === item.category.id ? 'bold' : 'normal'
                    }
                  ]}
                >
                  {item.category.name}
                </Text>
                <Text style={[styles.legendAmount, { color: colors.text.secondary }]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
            borderColor: colors.border.light
          }
        ]}
      >
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {title}
        </Text>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No category data available
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
            Add subscriptions with categories to see distribution
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
          height: height + (showLegend ? categoryData.length * 40 : 0),
          backgroundColor: colors.background.secondary, 
          borderColor: colors.border.light
        }
      ]}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading category data...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <PieChart
            data={chartData}
            donut={true}
            innerRadius={70}
            radius={120}
            showInnerComponent={true}
            innerComponent={innerComponent}
            isAnimated={true}
          />
          
          {showLegend && renderLegend()}
        </View>
      )}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
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
  innerComponent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedCategory: {
    fontSize: 12,
    textAlign: 'center',
  },
  selectedAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedPercentage: {
    fontSize: 12,
  },
  legend: {
    width: '100%',
    marginTop: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendName: {
    fontSize: 14,
  },
  legendAmount: {
    fontSize: 14,
  }
}); 