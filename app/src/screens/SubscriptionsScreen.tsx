import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabScreenProps } from '../navigation/navigationTypes';
import { Text } from '../components/atoms/Text';
import { Container } from '../components/atoms/Container';
import { SearchInput } from '../components/atoms/SearchInput';
import { SubscriptionCard } from '../components/molecules/SubscriptionCard';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../contexts/StorageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Subscription, Category } from '../types/supabase';

type SortBy = 'name' | 'amount' | 'next_billing_date' | 'category';
type SortDirection = 'asc' | 'desc';

interface SortOption {
  key: SortBy;
  label: string;
  icon: string;
}

type SubscriptionsScreenProps = TabScreenProps<'Subscriptions'>;

const sortOptions: SortOption[] = [
  { key: 'name', label: 'Name', icon: 'text' },
  { key: 'amount', label: 'Amount', icon: 'cash-outline' },
  { key: 'next_billing_date', label: 'Next Payment', icon: 'calendar-outline' },
  { key: 'category', label: 'Category', icon: 'bookmark-outline' },
];

const SubscriptionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { subscriptions, categories, fetchSubscriptions, isLoading, error } = useStorage();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const navigation = useNavigation<SubscriptionsScreenProps['navigation']>();

  // Fetch subscriptions when component mounts
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  // Filter and sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    // First filter by search query
    let filtered = subscriptions.filter(sub => {
      const matchesSearch = searchQuery === '' || 
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCategoryName(sub.category_id).toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply category filter if selected
      const matchesCategory = selectedCategory === null || sub.category_id === selectedCategory;
      
      // Apply billing cycle filter if selected
      const matchesBillingCycle = selectedBillingCycle === null || 
        sub.billing_cycle.toLowerCase() === selectedBillingCycle.toLowerCase();
      
      return matchesSearch && matchesCategory && matchesBillingCycle;
    });
    
    // Then sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'next_billing_date':
          // Handle null next_billing_date values by placing them at the end
          if (!a.next_billing_date && !b.next_billing_date) {
            comparison = 0;
          } else if (!a.next_billing_date) {
            comparison = 1;
          } else if (!b.next_billing_date) {
            comparison = -1;
          } else {
            comparison = new Date(a.next_billing_date).getTime() - 
                        new Date(b.next_billing_date).getTime();
          }
          break;
        case 'category':
          comparison = getCategoryName(a.category_id).localeCompare(getCategoryName(b.category_id));
          break;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    subscriptions, 
    searchQuery, 
    sortBy, 
    sortDirection, 
    selectedCategory, 
    selectedBillingCycle, 
    categories
  ]);

  // Toggle sort direction when the same sort option is selected
  const handleSortPress = (option: SortBy) => {
    if (sortBy === option) {
      // Toggle direction if same sort option
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort option and reset to ascending
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  // Navigate to subscription detail when a card is pressed
  const handleSubscriptionPress = (subscriptionId: string) => {
    // Will be implemented in a later task
    console.log(`Navigate to subscription ${subscriptionId}`);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  // Format amount with currency
  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Calculate subscription status based on renewal date
  const calculateStatus = (subscription: Subscription): 'active' | 'pending' | 'expired' => {
    if (!subscription.next_billing_date) return 'active';
    
    const today = new Date();
    const nextBillingDate = new Date(subscription.next_billing_date);
    
    if (nextBillingDate < today) {
      return 'expired';
    } else if (
      nextBillingDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000 // 7 days
    ) {
      return 'pending';
    } else {
      return 'active';
    }
  };

  // Render subscription card
  const renderSubscription = ({ item }: { item: Subscription }) => {
    const status = calculateStatus(item);
    
    return (
      <View style={styles.subscriptionItem}>
        <SubscriptionCard 
          status={status} 
          renewalDate={item.next_billing_date || undefined}
          onPress={() => handleSubscriptionPress(item.id)}
          testID={`subscription-card-${item.id}`}
        >
          <SubscriptionCard.Header 
            title={item.name} 
          />
          <SubscriptionCard.Details 
            amount={item.amount} 
            cycle={item.billing_cycle as any} 
            category={getCategoryName(item.category_id)}
          />
          <SubscriptionCard.Actions />
        </SubscriptionCard>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" style={{ marginTop: 16 }}>Loading subscriptions...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text variant="body" style={{ marginTop: 16, color: colors.error }}>{error}</Text>
          <TouchableOpacity 
            onPress={fetchSubscriptions}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text variant="caption" style={{ color: colors.text.inverted }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // No subscriptions or no results after filtering
    const noResultsText = searchQuery || selectedCategory || selectedBillingCycle
      ? "No subscriptions match your filters"
      : "You don't have any subscriptions yet";

    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons 
          name={searchQuery ? "search-outline" : "document-outline"} 
          size={48} 
          color={colors.text.secondary} 
        />
        <Text 
          variant="heading3" 
          style={{ marginTop: 16, color: colors.text.secondary }}
        >
          {noResultsText}
        </Text>
        {!searchQuery && !selectedCategory && !selectedBillingCycle && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Add')}
          >
            <Text variant="caption" style={{ color: colors.text.inverted }}>Add Subscription</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Container>
      <View style={styles.header}>
        <Text variant="heading1" style={styles.title}>My Subscriptions</Text>
        
        <View style={styles.searchContainer}>
          <SearchInput
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            testID="subscription-search-input"
          />
          <TouchableOpacity 
            style={[styles.filterButton, selectedCategory || selectedBillingCycle ? { backgroundColor: colors.primary } : {}]}
            onPress={() => setShowFilterModal(true)} 
            testID="filter-button"
          >
            <Ionicons 
              name="options-outline" 
              size={24} 
              color={selectedCategory || selectedBillingCycle ? colors.text.inverted : colors.text.primary} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.sortContainer}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                sortBy === option.key && { 
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.primary,
                }
              ]}
              onPress={() => handleSortPress(option.key)}
              testID={`sort-by-${option.key}`}
            >
              <Ionicons
                name={option.icon as any}
                size={16}
                color={sortBy === option.key ? colors.primary : colors.text.secondary}
              />
              <Text 
                variant="caption" 
                style={[
                  styles.sortButtonText,
                  sortBy === option.key && { color: colors.primary }
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.key && (
                <Ionicons
                  name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredSubscriptions}
        renderItem={renderSubscription}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState()}
        testID="subscriptions-list"
      />

      {/* Filter Modal would be implemented here in a later task */}
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  sortButtonText: {
    marginHorizontal: 4,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  subscriptionItem: {
    marginBottom: 16,
  },
  emptyStateContainer: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});

export default SubscriptionsScreen; 