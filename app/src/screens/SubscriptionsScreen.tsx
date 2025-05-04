import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabScreenProps } from '../navigation/navigationTypes';
import { Text } from '../components/atoms/Text';
import { Container } from '../components/atoms/Container';
import { SearchInput } from '../components/atoms/SearchInput';
import { SubscriptionCard } from '../components/molecules/SubscriptionCard/SubscriptionCard';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../contexts/StorageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Subscription, Category } from '../types/supabase';
import { EmptyState, FilterModal } from '../components/molecules';
import { Modal as CustomModal } from '../components/atoms/Modal';

type SortBy = 'name' | 'amount' | 'next_billing_date' | 'category';
type SortDirection = 'asc' | 'desc';

interface SortOption {
  key: SortBy;
  label: string;
}

// Define the navigation screens available
type NavigationScreens = {
  Subscriptions: undefined;
  Home: undefined;
  SubscriptionDetail: { subscription: Subscription };
  AddSubscription: undefined;
  Add: undefined;
  ChangePassword: undefined;
};

type SubscriptionsScreenProps = {
  navigation: {
    navigate: <T extends keyof NavigationScreens>(
      screen: T,
      params?: NavigationScreens[T]
    ) => void;
  };
};

const sortOptions: SortOption[] = [
  { key: 'name', label: 'Name' },
  { key: 'amount', label: 'Amount' },
  { key: 'next_billing_date', label: 'Payment Date' },
  { key: 'category', label: 'Category' },
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
  const [showSortModal, setShowSortModal] = useState(false);
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

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedBillingCycle(null);
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    // Filters are already applied through the state variables
  };

  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];

    return subscriptions
      .filter((sub) => {
        if (searchQuery && !sub.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        if (selectedCategory && sub.category_id !== selectedCategory) {
          return false;
        }

        if (selectedBillingCycle && sub.billing_cycle !== selectedBillingCycle) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'amount') {
          return a.amount - b.amount;
        }
        if (sortBy === 'next_billing_date') {
          // Handle null dates
          if (!a.next_billing_date && !b.next_billing_date) return 0;
          if (!a.next_billing_date) return 1;
          if (!b.next_billing_date) return -1;
          return new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime();
        }
        if (sortBy === 'category') {
          const catA = categories?.find(c => c.id === a.category_id)?.name || '';
          const catB = categories?.find(c => c.id === b.category_id)?.name || '';
          return catA.localeCompare(catB);
        }
        return 0;
      });
  }, [subscriptions, searchQuery, sortBy, selectedCategory, selectedBillingCycle, categories]);

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

  // Calculate subscription status based on payment date
  const calculateStatus = (subscription: Subscription): 'active' | 'pending' => {
    if (!subscription.next_billing_date) return 'pending';
    
    const nextBillingDate = new Date(subscription.next_billing_date);
    const now = new Date();
    const diffDays = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDays <= 7 ? 'pending' : 'active';
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
            iconUrl={categories?.find(c => c.id === item.category_id)?.icon || undefined}
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text variant="heading1">Subscriptions</Text>
          <Text variant="body" style={{ color: colors.text.secondary }}>
            {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? 'subscription' : 'subscriptions'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.background.secondary }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={24} color={colors.text.primary} />
            {(selectedCategory || selectedBillingCycle) && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.background.secondary }]}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="swap-vertical" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.background.secondary }]}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search subscriptions..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <Text variant="body" style={{ color: colors.error }}>
            {error}
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredSubscriptions.length === 0 ? (
        <EmptyState
          icon="folder-open-outline"
          title="No subscriptions found"
          message={
            searchQuery || selectedCategory || selectedBillingCycle
              ? "Try adjusting your search or filters"
              : "Add your first subscription by tapping the '+' button"
          }
        />
      ) : (
        <FlatList
          data={filteredSubscriptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.cardContainer}
              onPress={() => navigation.navigate('SubscriptionDetail', { subscription: item })}
            >
              <SubscriptionCard
                status={calculateStatus(item)}
                renewalDate={item.next_billing_date || undefined}
              >
                <SubscriptionCard.Header 
                  title={item.name} 
                  iconUrl={categories?.find(c => c.id === item.category_id)?.icon || undefined}
                />
                <SubscriptionCard.Details 
                  amount={item.amount} 
                  cycle={item.billing_cycle as any}
                  category={getCategoryName(item.category_id)}
                />
              </SubscriptionCard>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Sort Modal */}
      <CustomModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        title="Sort By"
      >
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortOption,
              sortBy === option.key && {
                backgroundColor: colors.primary + '20',
              },
            ]}
            onPress={() => {
              setSortBy(option.key);
              setShowSortModal(false);
            }}
          >
            <Text
              variant="body"
              style={[
                sortBy === option.key && {
                  color: colors.primary,
                  fontWeight: 'bold',
                },
              ]}
            >
              {option.label}
            </Text>
            {sortBy === option.key && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </CustomModal>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        categories={categories || []}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedBillingCycle={selectedBillingCycle}
        setSelectedBillingCycle={setSelectedBillingCycle}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddSubscription')}
      >
        <Ionicons name="add" size={24} color={colors.background.primary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3498db', // Default color, will be overridden
    borderWidth: 2,
    borderColor: '#FFFFFF', // Default color, will be overridden
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  cardContainer: {
    marginBottom: 16,
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
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
});

export default SubscriptionsScreen; 