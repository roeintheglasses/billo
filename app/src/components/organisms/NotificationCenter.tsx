/**
 * NotificationCenter Component
 *
 * A component for displaying user notifications with filtering, pagination,
 * and notification management (marking as read, deleting, etc.)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import notificationService, {
  NotificationType,
  NotificationPriority,
  groupNotificationsByDate,
} from '../../services/notificationService';
import { Notification, NotificationWithMeta } from '../../types/supabase';
import { formatRelativeTime } from '../../utils/dateUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// Type for the filter options
interface FilterOptions {
  isRead?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
}

// Props for the component
interface NotificationCenterProps {
  onNotificationPress?: (notification: Notification) => void;
}

/**
 * NotificationCenter component
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationPress }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { user } = useAuth();

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');

  // Constants
  const PAGE_SIZE = 20;

  // Calculate the grouped notifications for display
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(notifications);
  }, [notifications]);

  // Load notifications
  const loadNotifications = useCallback(
    async (loadPage = 1, refresh = false) => {
      if (!user) return;

      try {
        if (refresh) {
          setRefreshing(true);
        } else if (loadPage === 1) {
          setLoading(true);
        }

        // Apply filters based on selected tab
        const filterOptions: FilterOptions = { ...filters };
        if (selectedTab === 'unread') {
          filterOptions.isRead = false;
        }

        const result = await notificationService.getNotificationsPaginated(
          user.id,
          loadPage,
          PAGE_SIZE,
          filterOptions
        );

        setTotalCount(result.count);

        if (loadPage === 1 || refresh) {
          setNotifications(result.data);
        } else {
          setNotifications(prev => [...prev, ...result.data]);
        }

        setHasMore(result.data.length === PAGE_SIZE);
        setPage(loadPage);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, filters, selectedTab]
  );

  // Load notifications on mount and when filters change
  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications, filters, selectedTab]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadNotifications(1, true);
  }, [loadNotifications]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && hasMore) {
      loadNotifications(page + 1);
    }
  }, [loading, refreshing, hasMore, page, loadNotifications]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notification: Notification) => {
    try {
      if (notification.is_read) return;

      await notificationService.markNotificationAsRead(notification.id);

      // Update the local state
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await notificationService.markAllNotificationsAsRead(user.id);

      // Update the local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Delete notification
  const handleDelete = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);

      // Update the local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Apply filter
  const applyFilter = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPage(1);
    setShowFilters(false);
  }, []);

  // Handle notification press
  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read when pressed
      handleMarkAsRead(notification);

      // Call custom handler if provided
      if (onNotificationPress) {
        onNotificationPress(notification);
      } else if (notification.link_url) {
        // Handle deep linking (this would be expanded in a real implementation)
        console.log(`Navigate to: ${notification.link_url}`);
      }
    },
    [handleMarkAsRead, onNotificationPress]
  );

  // Get icon for notification type
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case NotificationType.PAYMENT_REMINDER:
        return 'calendar-outline';
      case NotificationType.CANCELLATION_DEADLINE:
        return 'timer-outline';
      case NotificationType.PRICE_CHANGE:
        return 'trending-up-outline';
      case NotificationType.SUBSCRIPTION_DUE:
        return 'card-outline';
      case NotificationType.SUBSCRIPTION_CREATED:
        return 'add-circle-outline';
      case NotificationType.SUBSCRIPTION_UPDATED:
        return 'create-outline';
      case NotificationType.SYSTEM:
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  }, []);

  // Get colors for priority levels
  const getPriorityColors = useCallback(
    (priority: string) => {
      switch (priority) {
        case NotificationPriority.HIGH:
          return colors.error;
        case NotificationPriority.MEDIUM:
          return colors.warning;
        case NotificationPriority.LOW:
          return colors.success;
        default:
          return colors.text.secondary;
      }
    },
    [colors]
  );

  // Render filter section
  const renderFilterSection = () => {
    if (!showFilters) return null;

    return (
      <View style={[styles.filterContainer, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.filterTitle, { color: colors.text.primary }]}>
          Filter Notifications
        </Text>

        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: !filters.type ? colors.primary : colors.background.tertiary,
                },
              ]}
              onPress={() => applyFilter({ ...filters, type: undefined })}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: !filters.type ? colors.white : colors.text.secondary,
                  },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {Object.values(NotificationType).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      filters.type === type ? colors.primary : colors.background.tertiary,
                  },
                ]}
                onPress={() => applyFilter({ ...filters, type })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: filters.type === type ? colors.white : colors.text.secondary,
                    },
                  ]}
                >
                  {type.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Priority:</Text>
          <View style={styles.filterChipsContainer}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: !filters.priority ? colors.primary : colors.background.tertiary,
                },
              ]}
              onPress={() => applyFilter({ ...filters, priority: undefined })}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: !filters.priority ? colors.white : colors.text.secondary,
                  },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {Object.values(NotificationPriority).map(priority => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      filters.priority === priority ? colors.primary : colors.background.tertiary,
                  },
                ]}
                onPress={() => applyFilter({ ...filters, priority })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: filters.priority === priority ? colors.white : colors.text.secondary,
                    },
                  ]}
                >
                  {priority}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterActions}>
          <TouchableOpacity
            style={[styles.filterActionButton, { backgroundColor: colors.background.tertiary }]}
            onPress={() => {
              setFilters({});
              setShowFilters(false);
            }}
          >
            <Text style={[styles.filterActionText, { color: colors.text.primary }]}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterActionButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowFilters(false)}
          >
            <Text style={[styles.filterActionText, { color: colors.white }]}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render a notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const iconName = getNotificationIcon(item.type);
    const priorityColor = getPriorityColors(item.priority);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.is_read ? colors.background.primary : colors.background.secondary,
            borderLeftColor: priorityColor,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIconContainer}>
          <Ionicons name={iconName} size={24} color={priorityColor} />
          {!item.is_read && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </View>

        <View style={styles.notificationContent}>
          <Text
            style={[
              styles.notificationTitle,
              {
                color: colors.text.primary,
                fontWeight: item.is_read ? 'normal' : 'bold',
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <Text
            style={[styles.notificationMessage, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {item.message}
          </Text>

          <Text style={[styles.notificationTime, { color: colors.text.tertiary }]}>
            {formatRelativeTime(new Date(item.created_at))}
          </Text>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render a date header
  const renderDateHeader = ({ section }: { section: { title: string } }) => (
    <View style={[styles.dateHeader, { backgroundColor: colors.background.tertiary }]}>
      <Text style={[styles.dateHeaderText, { color: colors.text.secondary }]}>{section.title}</Text>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="notifications-off-outline" size={64} color={colors.text.tertiary} />
        <Text style={[styles.emptyStateTitle, { color: colors.text.secondary }]}>
          No notifications
        </Text>
        <Text style={[styles.emptyStateMessage, { color: colors.text.tertiary }]}>
          {selectedTab === 'unread'
            ? "You don't have any unread notifications"
            : "You don't have any notifications yet"}
        </Text>
      </View>
    );
  };

  // Convert grouped notifications to sections for SectionList
  const sections = useMemo(() => {
    return Object.entries(groupedNotifications).map(([date, items]) => ({
      title: date,
      data: items,
    }));
  }, [groupedNotifications]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Notifications</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons
              name="filter-outline"
              size={24}
              color={Object.keys(filters).length > 0 ? colors.primary : colors.text.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={handleMarkAllAsRead}>
            <Ionicons name="checkmark-done-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'all' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setSelectedTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'all' ? colors.primary : colors.text.secondary },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'unread' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setSelectedTab('unread')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'unread' ? colors.primary : colors.text.secondary },
            ]}
          >
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {renderFilterSection()}

      {/* Notification List */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderNotificationItem}
        renderSectionHeader={renderDateHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.loadingIndicator}
            />
          ) : null
        }
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : null}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
  },
  filterContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 12,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  filterActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  filterActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 4,
  },
  notificationIconContainer: {
    marginRight: 12,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateHeaderText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingIndicator: {
    paddingVertical: 16,
  },
});

export default NotificationCenter;
