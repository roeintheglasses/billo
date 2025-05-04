import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import subscriptionService from '../../../services/subscriptionService';
import { formatCurrency } from '../../../utils/formatUtils';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Subscription } from '../../../types/supabase';

export interface BasicInsightsProps {
  /**
   * Title for the insights section
   */
  title?: string;
  
  /**
   * User ID to fetch subscription data for
   */
  userId?: string;
  
  /**
   * Callback when an insight is selected
   */
  onInsightSelect?: (insightType: string, data: any) => void;
}

interface InsightsData {
  highestCost: Subscription | null;
  mostFrequentCategory: any | null;
  fastestGrowing: any | null;
  totalSubscriptions: number;
  averageMonthly: number;
  categoryMap?: Record<string, number>;
  mostFrequentCategoryId?: string | null;
}

export const BasicInsights: React.FC<BasicInsightsProps> = ({
  title = 'Insights',
  userId,
  onInsightSelect
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightsData>({
    highestCost: null,
    mostFrequentCategory: null,
    fastestGrowing: null,
    totalSubscriptions: 0,
    averageMonthly: 0,
    categoryMap: {},
    mostFrequentCategoryId: null
  });

  useEffect(() => {
    fetchInsights();
  }, [userId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all subscriptions
      const subscriptions = await subscriptionService.getSubscriptions();
      
      if (!subscriptions || subscriptions.length === 0) {
        setInsights({
          highestCost: null,
          mostFrequentCategory: null,
          fastestGrowing: null,
          totalSubscriptions: 0,
          averageMonthly: 0,
          categoryMap: {},
          mostFrequentCategoryId: null
        });
        setLoading(false);
        return;
      }

      // Calculate total monthly spend
      const totalMonthly = await subscriptionService.calculateTotalMonthlySpend();
      
      // Get highest cost subscription
      const highestCost = [...subscriptions].sort((a, b) => {
        const aMonthly = subscriptionService.normalizeAmountToMonthly(a.amount, a.billing_cycle);
        const bMonthly = subscriptionService.normalizeAmountToMonthly(b.amount, b.billing_cycle);
        return bMonthly - aMonthly;
      })[0];
      
      // Get most frequent category
      const categoryMap: Record<string, number> = subscriptions.reduce((acc: Record<string, number>, sub: Subscription) => {
        if (sub.category_id) {
          acc[sub.category_id] = (acc[sub.category_id] || 0) + 1;
        }
        return acc;
      }, {});
      
      let mostFrequentCategoryId: string | null = null;
      let mostFrequentCount = 0;
      
      Object.entries(categoryMap).forEach(([catId, count]) => {
        if (count > mostFrequentCount) {
          mostFrequentCategoryId = catId;
          mostFrequentCount = count;
        }
      });
      
      const mostFrequentCategory = mostFrequentCategoryId ? 
        subscriptions.find((sub: Subscription) => sub.category_id === mostFrequentCategoryId)?.category : null;
      
      // Placeholder for fastest growing category (would need time-series data)
      // In a real implementation, this would compare current month vs previous months
      const fastestGrowing = null;
      
      setInsights({
        highestCost,
        mostFrequentCategory,
        fastestGrowing,
        totalSubscriptions: subscriptions.length,
        averageMonthly: subscriptions.length > 0 ? totalMonthly / subscriptions.length : 0,
        categoryMap,
        mostFrequentCategoryId
      });
      
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInsightPress = (insightType: string, data: any) => {
    if (onInsightSelect) {
      onInsightSelect(insightType, data);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background?.primary || '#ffffff' }]}>
        <Text style={[styles.title, { color: colors.text?.primary || '#000000' }]}>{title}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#0066cc'} />
          <Text style={[styles.loadingText, { color: colors.text?.primary || '#000000' }]}>Loading insights...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background?.primary || '#ffffff' }]}>
        <Text style={[styles.title, { color: colors.text?.primary || '#000000' }]}>{title}</Text>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={32} color={colors.error || '#ff0000'} />
          <Text style={[styles.errorText, { color: colors.error || '#ff0000' }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary || '#0066cc' }]}
            onPress={fetchInsights}
          >
            <Text style={[styles.retryButtonText, { color: colors.text?.inverted || '#ffffff' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (insights.totalSubscriptions === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background?.primary || '#ffffff' }]}>
        <Text style={[styles.title, { color: colors.text?.primary || '#000000' }]}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Icon name="lightbulb-outline" size={32} color={colors.text?.secondary || '#666666'} />
          <Text style={[styles.emptyText, { color: colors.text?.secondary || '#666666' }]}>
            Add subscriptions to see insights here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background?.primary || '#ffffff' }]}>
      <Text style={[styles.title, { color: colors.text?.primary || '#000000' }]}>{title}</Text>
      
      <View style={styles.insightsContainer}>
        {/* Highest Cost Subscription */}
        {insights.highestCost && (
          <TouchableOpacity 
            style={[styles.insightCard, { backgroundColor: colors.background?.primary || '#ffffff', borderColor: colors.border?.medium || '#e0e0e0' }]}
            onPress={() => handleInsightPress('highestCost', insights.highestCost)}
            accessible={true}
            accessibilityLabel={`Highest cost subscription: ${insights.highestCost.name}, ${formatCurrency(subscriptionService.normalizeAmountToMonthly(insights.highestCost.amount, insights.highestCost.billing_cycle))} per month`}
          >
            <View style={styles.insightIconContainer}>
              <Icon name="currency-usd" size={24} color={colors.primary || '#0066cc'} />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text?.primary || '#000000' }]}>Highest Cost</Text>
              <Text style={[styles.insightValue, { color: colors.text?.primary || '#000000' }]} numberOfLines={1}>
                {insights.highestCost.name}
              </Text>
              <Text style={[styles.insightSubvalue, { color: colors.text?.secondary || '#666666' }]}>
                {formatCurrency(subscriptionService.normalizeAmountToMonthly(insights.highestCost.amount, insights.highestCost.billing_cycle))}/mo
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Most Frequent Category */}
        {insights.mostFrequentCategory && insights.mostFrequentCategoryId && insights.categoryMap && (
          <TouchableOpacity 
            style={[styles.insightCard, { backgroundColor: colors.background?.primary || '#ffffff', borderColor: colors.border?.medium || '#e0e0e0' }]}
            onPress={() => handleInsightPress('mostFrequentCategory', insights.mostFrequentCategory)}
            accessible={true}
            accessibilityLabel={`Most frequent category: ${insights.mostFrequentCategory.name}`}
          >
            <View style={styles.insightIconContainer}>
              <Icon name="tag-outline" size={24} color={colors.primary || '#0066cc'} />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text?.primary || '#000000' }]}>Top Category</Text>
              <Text style={[styles.insightValue, { color: colors.text?.primary || '#000000' }]} numberOfLines={1}>
                {insights.mostFrequentCategory.name}
              </Text>
              <Text style={[styles.insightSubvalue, { color: colors.text?.secondary || '#666666' }]}>
                {insights.categoryMap[insights.mostFrequentCategoryId]} subscriptions
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Average Subscription Cost */}
        <TouchableOpacity 
          style={[styles.insightCard, { backgroundColor: colors.background?.primary || '#ffffff', borderColor: colors.border?.medium || '#e0e0e0' }]}
          onPress={() => handleInsightPress('averageCost', insights.averageMonthly)}
          accessible={true}
          accessibilityLabel={`Average monthly cost: ${formatCurrency(insights.averageMonthly)} per subscription`}
        >
          <View style={styles.insightIconContainer}>
            <Icon name="chart-line" size={24} color={colors.primary || '#0066cc'} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: colors.text?.primary || '#000000' }]}>Avg. Monthly</Text>
            <Text style={[styles.insightValue, { color: colors.text?.primary || '#000000' }]} numberOfLines={1}>
              {formatCurrency(insights.averageMonthly)}
            </Text>
            <Text style={[styles.insightSubvalue, { color: colors.text?.secondary || '#666666' }]}>
              per subscription
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Total Subscriptions */}
        <TouchableOpacity 
          style={[styles.insightCard, { backgroundColor: colors.background?.primary || '#ffffff', borderColor: colors.border?.medium || '#e0e0e0' }]}
          onPress={() => handleInsightPress('totalSubscriptions', insights.totalSubscriptions)}
          accessible={true}
          accessibilityLabel={`Total subscriptions: ${insights.totalSubscriptions}`}
        >
          <View style={styles.insightIconContainer}>
            <Icon name="apps" size={24} color={colors.primary || '#0066cc'} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: colors.text?.primary || '#000000' }]}>Total Active</Text>
            <Text style={[styles.insightValue, { color: colors.text?.primary || '#000000' }]} numberOfLines={1}>
              {insights.totalSubscriptions}
            </Text>
            <Text style={[styles.insightSubvalue, { color: colors.text?.secondary || '#666666' }]}>
              subscriptions
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  insightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightCard: {
    width: '48%',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIconContainer: {
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  insightSubvalue: {
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default BasicInsights; 