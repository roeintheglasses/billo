import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GaugeChart } from '../GaugeChart';

/**
 * GaugeChartExample component
 * 
 * This example demonstrates how to use the GaugeChart component
 * with different configurations.
 */
export const GaugeChartExample: React.FC = () => {
  // Basic usage
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Basic Gauge Chart</Text>
      <GaugeChart
        value={75}
        title="Monthly Budget"
        subtitle="75% of budget used"
        height={200}
        showLabels={true}
        valueSuffix="%"
      />
      
      <Text style={styles.title}>Segments Example</Text>
      <GaugeChart
        value={65}
        title="Spending Status"
        subtitle="Budget health indicator"
        height={200}
        segments={[
          { startValue: 0, endValue: 30, color: 'green' },
          { startValue: 30, endValue: 70, color: 'orange' },
          { startValue: 70, endValue: 100, color: 'red' }
        ]}
        showLabels={true}
        valueSuffix="%"
      />
      
      <Text style={styles.title}>Custom Range</Text>
      <GaugeChart
        value={2500}
        minValue={0}
        maxValue={5000}
        title="Monthly Spending"
        subtitle="Total spent this month"
        height={200}
        showLabels={true}
        valuePrefix="$"
        formatValue={(value) => `$${value.toLocaleString()}`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
}); 