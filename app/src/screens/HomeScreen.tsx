import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { 
  CategoryDistributionChart, 
  UpcomingPaymentsSection,
  MonthlyTrendChart,
  SubscriptionCountChart,
  BasicInsights
} from '../components/molecules/visualization';
import subscriptionService from '../services/subscriptionService';
import { formatCurrency } from '../utils/formatUtils';

/**
 * HomeScreen Component
 * 
 * Main dashboard screen for the application.
 */
export const HomeScreen = () => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  
  const [totalMonthlySpend, setTotalMonthlySpend] = useState<number>(0);
  const [subscriptionCount, setSubscriptionCount] = useState<number>(0);
  const [nextPaymentDate, setNextPaymentDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get total monthly spend
        const monthlySpend = await subscriptionService.calculateTotalMonthlySpend();
        setTotalMonthlySpend(monthlySpend);
        
        // Get active subscriptions count
        const subscriptions = await subscriptionService.getSubscriptions();
        setSubscriptionCount(subscriptions.length);
        
        // Find next payment date
        if (subscriptions.length > 0) {
          // Sort by next billing date and get the earliest one
          const sortedSubscriptions = [...subscriptions].sort((a, b) => {
            const dateA = a.next_billing_date ? new Date(a.next_billing_date).getTime() : Number.MAX_SAFE_INTEGER;
            const dateB = b.next_billing_date ? new Date(b.next_billing_date).getTime() : Number.MAX_SAFE_INTEGER;
            return dateA - dateB;
          });
          
          const nextBillingDate = sortedSubscriptions[0].next_billing_date;
          if (nextBillingDate) {
            const nextDate = new Date(nextBillingDate);
            setNextPaymentDate(nextDate.toLocaleDateString());
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId(prevId => prevId === categoryId ? null : categoryId);
    // Here you could add additional logic to filter other components based on the selected category
    console.log(`Category selected: ${categoryName} (${categoryId})`);
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ padding: spacing.screenPadding }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Dashboard</Text>
        <ThemeToggle />
      </View>
      
      <View style={styles.totalContainer}>
        <Text style={[styles.totalLabel, { color: colors.text.secondary }]}>
          Total Monthly Spend
        </Text>
        <Text style={[styles.totalValue, { color: colors.text.primary }]}>
          {loading ? '...' : formatCurrency(totalMonthlySpend)}
        </Text>
      </View>
      
      <BasicInsights title="Quick Insights" />
      
      {/* Category Distribution Chart */}
      <CategoryDistributionChart 
        title="Spending by Category"
        showLegend={true}
        height={350}
      />
      
      {/* Subscription Count by Category Chart */}
      <SubscriptionCountChart
        title="Subscriptions by Category"
        height={350}
        showValues={true}
        onCategorySelect={handleCategorySelect}
      />
      
      {/* Monthly Trend Chart */}
      <MonthlyTrendChart
        title="Monthly Spending Trend"
        months={6}
        height={300}
        showArea={true}
        curved={true}
        showAverage={true}
      />
      
      {/* Upcoming Payments Section */}
      <UpcomingPaymentsSection 
        daysAhead={7}
        maxItems={3}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  totalContainer: {
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
}); 