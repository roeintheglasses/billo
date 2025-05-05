/**
 * NotificationSettingsScreen.tsx
 *
 * Screen for configuring notification preferences for different notification types,
 * including quiet hours, notification methods, and advance notice settings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import notificationPreferencesService, {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../services/NotificationPreferencesService';
import { NotificationType } from '../services/notificationService';
import FormInput from '../components/FormInput';

/**
 * NotificationSettingsScreen Component
 */
const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [showQuietHoursStart, setShowQuietHoursStart] = useState(false);
  const [showQuietHoursEnd, setShowQuietHoursEnd] = useState(false);
  const [showDigestTime, setShowDigestTime] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'general' | 'types'>('general');

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const prefs = await notificationPreferencesService.getPreferences(user.id);
        setPreferences(prefs);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        Alert.alert('Error', 'Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences
  const savePreferences = useCallback(async () => {
    if (!user) return;

    try {
      setSaving(true);
      await notificationPreferencesService.updatePreferences(user.id, preferences);
      Alert.alert('Success', 'Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  }, [user, preferences]);

  // Update general setting
  const updateGeneralSetting = useCallback((key: keyof typeof preferences.general, value: any) => {
    setPreferences(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [key]: value,
      },
    }));
  }, []);

  // Update notification type setting
  const updateTypeSetting = useCallback((type: NotificationType, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      byType: {
        ...prev.byType,
        [type]: {
          ...prev.byType[type],
          [key]: value,
        },
      },
    }));
  }, []);

  // Format time string for display
  const formatTimeForDisplay = useCallback((timeString?: string) => {
    if (!timeString) return '';

    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  // Handle time change
  const handleTimeChange = useCallback(
    (event: any, selectedDate?: Date, field?: string) => {
      if (!selectedDate || !field) return;

      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      switch (field) {
        case 'quietHoursStart':
          updateGeneralSetting('quietHoursStart', timeString);
          setShowQuietHoursStart(false);
          break;
        case 'quietHoursEnd':
          updateGeneralSetting('quietHoursEnd', timeString);
          setShowQuietHoursEnd(false);
          break;
        case 'digestTime':
          updateGeneralSetting('digestTime', timeString);
          setShowDigestTime(false);
          break;
      }
    },
    [updateGeneralSetting]
  );

  // Get type display name
  const getTypeDisplayName = useCallback((type: NotificationType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }, []);

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading preferences...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Notification Settings
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={savePreferences} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.background.secondary }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'general' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setSelectedTab('general')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'general' ? colors.primary : colors.text.secondary },
            ]}
          >
            General
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'types' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setSelectedTab('types')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'types' ? colors.primary : colors.text.secondary },
            ]}
          >
            Notification Types
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'general' ? (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text.secondary, backgroundColor: colors.background.tertiary },
              ]}
            >
              General Settings
            </Text>

            {/* Quiet Hours */}
            <View style={styles.settingGroup}>
              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  <Ionicons name="moon-outline" size={24} color={colors.text.secondary} />
                  <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                    Quiet Hours
                  </Text>
                </View>
                <Switch
                  value={preferences.general.quietHoursEnabled}
                  onValueChange={value => updateGeneralSetting('quietHoursEnabled', value)}
                  trackColor={{ false: colors.border.medium, true: colors.primary }}
                  thumbColor={colors.background.primary}
                />
              </View>

              {preferences.general.quietHoursEnabled && (
                <View style={styles.quietHoursSettings}>
                  <TouchableOpacity
                    style={[
                      styles.timePickerButton,
                      { backgroundColor: colors.background.tertiary },
                    ]}
                    onPress={() => setShowQuietHoursStart(true)}
                  >
                    <Text style={[styles.timePickerLabel, { color: colors.text.secondary }]}>
                      Start:
                    </Text>
                    <Text style={[styles.timePickerValue, { color: colors.text.primary }]}>
                      {formatTimeForDisplay(preferences.general.quietHoursStart)}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.timePickerButton,
                      { backgroundColor: colors.background.tertiary },
                    ]}
                    onPress={() => setShowQuietHoursEnd(true)}
                  >
                    <Text style={[styles.timePickerLabel, { color: colors.text.secondary }]}>
                      End:
                    </Text>
                    <Text style={[styles.timePickerValue, { color: colors.text.primary }]}>
                      {formatTimeForDisplay(preferences.general.quietHoursEnd)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.settingDescription, { color: colors.text.tertiary }]}>
                No notifications will be delivered during quiet hours
              </Text>
            </View>

            {/* Daily Digest */}
            <View style={styles.settingGroup}>
              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  <Ionicons name="newspaper-outline" size={24} color={colors.text.secondary} />
                  <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                    Daily Digest
                  </Text>
                </View>
                <Switch
                  value={preferences.general.dailyDigestEnabled}
                  onValueChange={value => updateGeneralSetting('dailyDigestEnabled', value)}
                  trackColor={{ false: colors.border.medium, true: colors.primary }}
                  thumbColor={colors.background.primary}
                />
              </View>

              {preferences.general.dailyDigestEnabled && (
                <View style={styles.quietHoursSettings}>
                  <TouchableOpacity
                    style={[
                      styles.timePickerButton,
                      { backgroundColor: colors.background.tertiary },
                    ]}
                    onPress={() => setShowDigestTime(true)}
                  >
                    <Text style={[styles.timePickerLabel, { color: colors.text.secondary }]}>
                      Time:
                    </Text>
                    <Text style={[styles.timePickerValue, { color: colors.text.primary }]}>
                      {formatTimeForDisplay(preferences.general.digestTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.settingDescription, { color: colors.text.tertiary }]}>
                Receive a daily summary of all notifications
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text.secondary, backgroundColor: colors.background.tertiary },
              ]}
            >
              Notification Types
            </Text>

            {/* Notification Types */}
            {Object.entries(preferences.byType).map(([type, settings]) => (
              <View key={type} style={styles.settingGroup}>
                <View style={styles.settingRow}>
                  <View style={styles.settingLabelContainer}>
                    <Ionicons
                      name={
                        type === NotificationType.PAYMENT_REMINDER
                          ? 'calendar-outline'
                          : type === NotificationType.CANCELLATION_DEADLINE
                            ? 'timer-outline'
                            : type === NotificationType.PRICE_CHANGE
                              ? 'trending-up-outline'
                              : 'notifications-outline'
                      }
                      size={24}
                      color={colors.text.secondary}
                    />
                    <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                      {getTypeDisplayName(type as NotificationType)}
                    </Text>
                  </View>
                  <Switch
                    value={settings.enabled}
                    onValueChange={value =>
                      updateTypeSetting(type as NotificationType, 'enabled', value)
                    }
                    trackColor={{ false: colors.border.medium, true: colors.primary }}
                    thumbColor={colors.background.primary}
                  />
                </View>

                {settings.enabled && (
                  <View style={styles.typeSettings}>
                    <View style={styles.settingRow}>
                      <Text style={[styles.typeSettingLabel, { color: colors.text.secondary }]}>
                        Push Notifications
                      </Text>
                      <Switch
                        value={settings.pushEnabled}
                        onValueChange={value =>
                          updateTypeSetting(type as NotificationType, 'pushEnabled', value)
                        }
                        trackColor={{ false: colors.border.medium, true: colors.primary }}
                        thumbColor={colors.background.primary}
                      />
                    </View>

                    <View style={styles.settingRow}>
                      <Text style={[styles.typeSettingLabel, { color: colors.text.secondary }]}>
                        In-App Notifications
                      </Text>
                      <Switch
                        value={settings.inAppEnabled}
                        onValueChange={value =>
                          updateTypeSetting(type as NotificationType, 'inAppEnabled', value)
                        }
                        trackColor={{ false: colors.border.medium, true: colors.primary }}
                        thumbColor={colors.background.primary}
                      />
                    </View>

                    <View style={styles.settingRow}>
                      <Text style={[styles.typeSettingLabel, { color: colors.text.secondary }]}>
                        Email Notifications
                      </Text>
                      <Switch
                        value={settings.emailEnabled}
                        onValueChange={value =>
                          updateTypeSetting(type as NotificationType, 'emailEnabled', value)
                        }
                        trackColor={{ false: colors.border.medium, true: colors.primary }}
                        thumbColor={colors.background.primary}
                      />
                    </View>

                    {/* Advance Notice Days (for applicable notification types) */}
                    {(type === NotificationType.PAYMENT_REMINDER ||
                      type === NotificationType.CANCELLATION_DEADLINE ||
                      type === NotificationType.SUBSCRIPTION_DUE) && (
                      <View style={styles.advanceNoticeContainer}>
                        <Text style={[styles.typeSettingLabel, { color: colors.text.secondary }]}>
                          Advance Notice (Days)
                        </Text>
                        <FormInput
                          value={settings.advanceNoticeDays?.toString() || ''}
                          onChangeText={value =>
                            updateTypeSetting(
                              type as NotificationType,
                              'advanceNoticeDays',
                              parseInt(value) || 0
                            )
                          }
                          keyboardType="number-pad"
                          containerStyle={styles.advanceNoticeInput}
                          inputStyle={{ textAlign: 'center' }}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Time Pickers */}
      {showQuietHoursStart && (
        <DateTimePicker
          value={(() => {
            const [hours, minutes] = (preferences.general.quietHoursStart || '22:00')
              .split(':')
              .map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
          })()}
          mode="time"
          display="spinner"
          onChange={(event, date) => handleTimeChange(event, date, 'quietHoursStart')}
        />
      )}

      {showQuietHoursEnd && (
        <DateTimePicker
          value={(() => {
            const [hours, minutes] = (preferences.general.quietHoursEnd || '08:00')
              .split(':')
              .map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
          })()}
          mode="time"
          display="spinner"
          onChange={(event, date) => handleTimeChange(event, date, 'quietHoursEnd')}
        />
      )}

      {showDigestTime && (
        <DateTimePicker
          value={(() => {
            const [hours, minutes] = (preferences.general.digestTime || '09:00')
              .split(':')
              .map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
          })()}
          mode="time"
          display="spinner"
          onChange={(event, date) => handleTimeChange(event, date, 'digestTime')}
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  settingGroup: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  quietHoursSettings: {
    flexDirection: 'row',
    marginTop: 8,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  timePickerLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  timePickerValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeSettings: {
    marginLeft: 36,
  },
  typeSettingLabel: {
    fontSize: 14,
  },
  advanceNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  advanceNoticeInput: {
    width: 60,
  },
});

export default NotificationSettingsScreen;
