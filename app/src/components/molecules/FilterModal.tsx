import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../atoms/Text';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../../types/supabase';
import { useTheme } from '../../contexts/ThemeContext';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  selectedBillingCycle: string | null;
  setSelectedBillingCycle: (cycle: string | null) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

const billingCycles = [
  { id: 'monthly', name: 'Monthly' },
  { id: 'yearly', name: 'Yearly' },
  { id: 'quarterly', name: 'Quarterly' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'biweekly', name: 'Bi-weekly' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedBillingCycle,
  setSelectedBillingCycle,
  onApplyFilters,
  onResetFilters,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Modal visible={visible} onClose={onClose} title="Filter Subscriptions" size="large">
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text variant="heading3" style={styles.sectionTitle}>
            Categories
          </Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.categoryOption,
                !selectedCategory && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[styles.categoryText, !selectedCategory && { color: colors.text.inverted }]}
              >
                All Categories
              </Text>
            </TouchableOpacity>

            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  selectedCategory === category.id && {
                    backgroundColor: category.color || colors.primary,
                    borderColor: category.color || colors.primary,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && { color: colors.text.inverted },
                  ]}
                >
                  {category.name}
                </Text>
                {category.icon && selectedCategory === category.id && (
                  <Ionicons
                    name={category.icon as any}
                    size={16}
                    color={colors.text.inverted}
                    style={styles.categoryIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="heading3" style={styles.sectionTitle}>
            Billing Cycle
          </Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.billingOption,
                !selectedBillingCycle && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedBillingCycle(null)}
            >
              <Text
                style={[
                  styles.billingText,
                  !selectedBillingCycle && { color: colors.text.inverted },
                ]}
              >
                All Cycles
              </Text>
            </TouchableOpacity>

            {billingCycles.map(cycle => (
              <TouchableOpacity
                key={cycle.id}
                style={[
                  styles.billingOption,
                  selectedBillingCycle === cycle.id && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setSelectedBillingCycle(cycle.id)}
              >
                <Text
                  style={[
                    styles.billingText,
                    selectedBillingCycle === cycle.id && { color: colors.text.inverted },
                  ]}
                >
                  {cycle.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          variant="outline"
          title="Reset Filters"
          onPress={onResetFilters}
          style={styles.resetButton}
        />
        <Button
          variant="primary"
          title="Apply Filters"
          onPress={onApplyFilters}
          style={styles.applyButton}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 8,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
  },
  categoryIcon: {
    marginLeft: 4,
  },
  billingOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 8,
    marginBottom: 12,
  },
  billingText: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  resetButton: {
    marginRight: 12,
  },
  applyButton: {},
});
