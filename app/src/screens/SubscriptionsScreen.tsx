import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Modal as RNModal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabScreenProps } from '../navigation/navigationTypes';
import { Text, Container, SearchInput, FloatingActionButton } from '../components/atoms';
import { SubscriptionCard } from '../components/molecules/SubscriptionCard/SubscriptionCard';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../contexts/StorageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Subscription, Category } from '../types/supabase';
import { EmptyState, FilterModal } from '../components/molecules';
import { Modal as CustomModal } from '../components/atoms/Modal';
import { BulkActionModal } from '../components/molecules/BulkActionModal';

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
  SubscriptionDetail: { subscriptionId: string };
  AddSubscription: undefined;
  Add: undefined;
  ChangePassword: undefined;
};

type SubscriptionsScreenProps = {
  navigation: {
    navigate: <T extends keyof NavigationScreens>(screen: T, params?: NavigationScreens[T]) => void;
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
  const {
    subscriptions,
    categories,
    fetchSubscriptions,
    isLoading,
    error,
    bulkDeleteSubscriptions,
    bulkUpdateCategory,
    bulkUpdateBillingCycle,
  } = useStorage();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const navigation = useNavigation<SubscriptionsScreenProps['navigation']>();

  // Bulk action state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Subscription[]>([]);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);

  // Fetch subscriptions when component mounts
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Reset selection when exiting multi-select mode
  useEffect(() => {
    if (!isMultiSelectMode) {
      setSelectedSubscriptions([]);
    }
  }, [isMultiSelectMode]);

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

  // Toggle multi-select mode
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    // Clear selections when exiting multi-select mode
    if (isMultiSelectMode) {
      setSelectedSubscriptions([]);
    }
  };

  // Toggle selection of a subscription
  const toggleSubscriptionSelection = (subscription: Subscription) => {
    if (selectedSubscriptions.some(sub => sub.id === subscription.id)) {
      setSelectedSubscriptions(selectedSubscriptions.filter(sub => sub.id !== subscription.id));
    } else {
      setSelectedSubscriptions([...selectedSubscriptions, subscription]);
    }
  };

  // Check if a subscription is selected
  const isSubscriptionSelected = (subscription: Subscription) => {
    return selectedSubscriptions.some(sub => sub.id === subscription.id);
  };

  // Handle bulk actions
  const handleBulkDelete = async (): Promise<void> => {
    const subscriptionIds = selectedSubscriptions.map(sub => sub.id);
    const success = await bulkDeleteSubscriptions(subscriptionIds);

    if (success) {
      Alert.alert('Success', `Successfully deleted ${selectedSubscriptions.length} subscriptions.`);
      setIsMultiSelectMode(false);
    }
  };

  const handleBulkUpdateCategory = async (categoryId: string): Promise<void> => {
    const subscriptionIds = selectedSubscriptions.map(sub => sub.id);
    const success = await bulkUpdateCategory(subscriptionIds, categoryId);

    if (success) {
      Alert.alert(
        'Success',
        `Successfully updated category for ${selectedSubscriptions.length} subscriptions.`
      );
      setIsMultiSelectMode(false);
    }
  };

  const handleBulkUpdateBillingCycle = async (billingCycle: string): Promise<void> => {
    const subscriptionIds = selectedSubscriptions.map(sub => sub.id);
    const success = await bulkUpdateBillingCycle(subscriptionIds, billingCycle);

    if (success) {
      Alert.alert(
        'Success',
        `Successfully updated billing cycle for ${selectedSubscriptions.length} subscriptions.`
      );
      setIsMultiSelectMode(false);
    }
  };

  // Filter and sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];

    return subscriptions
      .filter(sub => {
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
        let result = 0;

        if (sortBy === 'name') {
          result = a.name.localeCompare(b.name);
        } else if (sortBy === 'amount') {
          result = a.amount - b.amount;
        } else if (sortBy === 'next_billing_date') {
          // Handle null dates
          if (!a.next_billing_date && !b.next_billing_date) result = 0;
          else if (!a.next_billing_date) result = 1;
          else if (!b.next_billing_date) result = -1;
          else
            result =
              new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime();
        } else if (sortBy === 'category') {
          const catA = categories?.find(c => c.id === a.category_id)?.name || '';
          const catB = categories?.find(c => c.id === b.category_id)?.name || '';
          result = catA.localeCompare(catB);
        }

        // Apply sort direction
        return sortDirection === 'asc' ? result : -result;
      });
  }, [
    subscriptions,
    searchQuery,
    sortBy,
    sortDirection,
    selectedCategory,
    selectedBillingCycle,
    categories,
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

    setShowSortModal(false);
  };

  // Handle subscription press
  const handleSubscriptionPress = (subscription: Subscription) => {
    if (isMultiSelectMode) {
      toggleSubscriptionSelection(subscription);
    } else {
      // Navigate to the subscription detail screen
      navigation.navigate('SubscriptionDetail', { subscriptionId: subscription.id });
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
    const isSelected = isSubscriptionSelected(item);

    return (
      <TouchableOpacity
        style={[styles.subscriptionItem, isSelected && styles.selectedSubscriptionItem]}
        onPress={() => handleSubscriptionPress(item)}
        activeOpacity={0.7}
      >
        <SubscriptionCard
          status={status}
          renewalDate={item.next_billing_date || undefined}
          selected={isSelected}
          selectable={isMultiSelectMode}
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
      </TouchableOpacity>
    );
  };

  // Render header with search and filter options
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search subscriptions..."
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          accessibilityLabel="Search subscriptions"
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => setShowFilterModal(true)}
          accessibilityLabel="Filter subscriptions"
        >
          <Ionicons name="filter" size={18} color={colors.text.primary} />
          {(selectedCategory || selectedBillingCycle) && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => setShowSortModal(true)}
          accessibilityLabel="Sort subscriptions"
        >
          <Ionicons
            name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
            size={18}
            color={colors.text.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: isMultiSelectMode ? colors.primary : colors.background.secondary },
          ]}
          onPress={toggleMultiSelectMode}
          accessibilityLabel={
            isMultiSelectMode ? 'Exit selection mode' : 'Select multiple subscriptions'
          }
        >
          <Ionicons
            name={isMultiSelectMode ? 'checkmark-done' : 'checkmark-circle-outline'}
            size={18}
            color={isMultiSelectMode ? colors.text.inverted : colors.text.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" style={{ marginTop: 16 }}>
            Loading subscriptions...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text variant="body" style={{ marginTop: 16, color: colors.error }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchSubscriptions}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text variant="caption" style={{ color: colors.text.inverted }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // No subscriptions or no results after filtering
    const noResultsText =
      searchQuery || selectedCategory || selectedBillingCycle
        ? 'No subscriptions match your filters'
        : "You don't have any subscriptions yet";

    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons
          name={
            searchQuery || selectedCategory || selectedBillingCycle ? 'search' : 'wallet-outline'
          }
          size={48}
          color={colors.text.tertiary}
        />
        <Text variant="body" style={{ marginTop: 16, color: colors.text.secondary }}>
          {noResultsText}
        </Text>
        {!searchQuery && !selectedCategory && !selectedBillingCycle && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Add')}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Text variant="caption" style={{ color: colors.text.inverted }}>
              Add Subscription
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render selected count action button when in multi-select mode
  const renderMultiSelectActionButton = () => {
    if (!isMultiSelectMode || selectedSubscriptions.length === 0) return null;

    return (
      <FloatingActionButton
        title={`${selectedSubscriptions.length} selected`}
        icon="checkbox-outline"
        onPress={() => setShowBulkActionModal(true)}
      />
    );
  };

  return (
    <Container>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text variant="heading2" style={styles.title}>
            Your Subscriptions
          </Text>

          {renderHeader()}

          {isMultiSelectMode && (
            <View
              style={[styles.selectionModeBar, { backgroundColor: colors.background.secondary }]}
            >
              <Text variant="body">
                {selectedSubscriptions.length > 0
                  ? `${selectedSubscriptions.length} subscription${selectedSubscriptions.length > 1 ? 's' : ''} selected`
                  : 'Tap items to select them'}
              </Text>
              {selectedSubscriptions.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSelectedSubscriptions([])}
                  style={styles.clearSelectionButton}
                >
                  <Text variant="caption" style={{ color: colors.primary }}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <FlatList
            data={filteredSubscriptions}
            renderItem={renderSubscription}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
          />

          {/* Filter Modal */}
          <FilterModal
            visible={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBillingCycle={selectedBillingCycle}
            setSelectedBillingCycle={setSelectedBillingCycle}
            onApplyFilters={applyFilters}
            onResetFilters={resetFilters}
          />

          {/* Sort Modal */}
          <CustomModal
            visible={showSortModal}
            onClose={() => setShowSortModal(false)}
            title="Sort Subscriptions"
            size="medium"
          >
            <View style={styles.sortModalContent}>
              {sortOptions.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.sortOption}
                  onPress={() => handleSortPress(option.key)}
                >
                  <Text variant="body">{option.label}</Text>
                  {sortBy === option.key && (
                    <Ionicons
                      name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                      size={18}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </CustomModal>

          {/* Bulk Action Modal */}
          <BulkActionModal
            visible={showBulkActionModal}
            onClose={() => setShowBulkActionModal(false)}
            selectedSubscriptions={selectedSubscriptions}
            categories={categories}
            onBulkDelete={handleBulkDelete}
            onBulkUpdateCategory={handleBulkUpdateCategory}
            onBulkUpdateBillingCycle={handleBulkUpdateBillingCycle}
          />

          {renderMultiSelectActionButton()}
        </View>
      </SafeAreaView>
    </Container>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
    position: 'relative',
  },
  filterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 4,
    right: 4,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80, // Extra padding for FAB
  },
  subscriptionItem: {
    marginBottom: 12,
  },
  selectedSubscriptionItem: {
    opacity: 0.9,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 60,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  sortModalContent: {
    padding: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectionModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  clearSelectionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

export default SubscriptionsScreen;
