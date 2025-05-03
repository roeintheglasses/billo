import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

/**
 * HomeScreen Component
 * 
 * Main dashboard screen for the application.
 */
export const HomeScreen = () => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  
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
            0
          </Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Monthly Spending
          </Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            $0.00
          </Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Next Payment
          </Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            None
          </Text>
        </View>
      </View>
      
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