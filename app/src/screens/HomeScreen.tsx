import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { CategoryDistributionChart } from '../components/molecules';
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
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ padding: spacing.screenPadding }}
    >
      <Text style={[
        styles.title, 
        { color: colors.text.primary }
      ]}>
        Welcome to Billo
      </Text>
      
      <Text style={[
        styles.subtitle,
        { color: colors.text.secondary }
      ]}>
        Manage your subscriptions in one place
      </Text>
      
      <View style={[
        styles.card, 
        { 
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.light 
        }
      ]}>
        <Text style={[
          styles.cardTitle,
          { color: colors.text.primary }
        ]}>
          Quick Stats
        </Text>
        
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Active Subscriptions
          </Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {loading ? '...' : subscriptionCount}
          </Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Monthly Spending
          </Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {loading ? '...' : formatCurrency(totalMonthlySpend)}
          </Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Next Payment
          </Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {loading ? '...' : (nextPaymentDate || 'None')}
          </Text>
        </View>
      </View>
      
      {/* Category Distribution Chart */}
      <CategoryDistributionChart 
        title="Spending by Category"
        showLegend={true}
        height={350}
      />
      
      <View style={styles.themeToggleContainer}>
        <ThemeToggle />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeToggleContainer: {
    alignItems: 'center',
    marginTop: 20,
  }
}); 