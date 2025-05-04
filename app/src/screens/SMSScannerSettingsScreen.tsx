import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../components/atoms/Text';
import { useTheme } from '../contexts/ThemeContext';
import SMSScannerService, { ScanFrequency } from '../services/SMSScannerService';
import { formatDate } from '../utils/dateUtils';
import { Button } from '../components/atoms/Button';
import { useSMSPermissions } from '../contexts/PermissionsContext';
import { Alert } from 'react-native';
import Card from '../components/atoms/Card';
import { Ionicons } from '@expo/vector-icons';

/**
 * Settings screen for SMS Scanner background service
 */
const SMSScannerSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { colors } = theme;
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequency, setFrequency] = useState<ScanFrequency>('medium');
  const [lastScanTimestamp, setLastScanTimestamp] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanningNow, setIsScanningNow] = useState(false);
  const { isSMSPermissionGranted, requestSMSPermission } = useSMSPermissions();

  // Load scanner status
  useEffect(() => {
    loadScannerStatus();
  }, []);

  // Load scanner status from native module
  const loadScannerStatus = async () => {
    try {
      setIsLoading(true);

      if (!SMSScannerService.isSupported()) {
        setIsLoading(false);
        return;
      }

      const status = await SMSScannerService.getScanStatus();
      setIsEnabled(status.isEnabled);
      setFrequency(status.frequency);
      setLastScanTimestamp(status.lastScanTimestamp);
    } catch (error) {
      console.error('Error loading scanner status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle scanner enabled state
  const toggleEnabled = async () => {
    try {
      if (!isSMSPermissionGranted) {
        const granted = await requestSMSPermission();
        if (!granted) {
          return;
        }
      }

      const newState = !isEnabled;
      let success: boolean;

      if (newState) {
        success = await SMSScannerService.enableScanning(frequency);
      } else {
        success = await SMSScannerService.disableScanning();
      }

      if (success) {
        setIsEnabled(newState);
      }
    } catch (error) {
      console.error('Error toggling scanner:', error);
    }
  };

  // Update scan frequency
  const updateFrequency = async (newFrequency: ScanFrequency) => {
    try {
      const success = await SMSScannerService.setScanFrequency(newFrequency);

      if (success) {
        setFrequency(newFrequency);
      }
    } catch (error) {
      console.error('Error updating frequency:', error);
    }
  };

  // Run manual scan
  const runManualScan = async () => {
    try {
      setIsScanningNow(true);

      if (!isSMSPermissionGranted) {
        const granted = await requestSMSPermission();
        if (!granted) {
          setIsScanningNow(false);
          return;
        }
      }

      const success = await SMSScannerService.runManualScan();

      if (success) {
        Alert.alert('Scan Complete', 'Manual SMS scan completed successfully.', [{ text: 'OK' }]);
      }

      // Refresh status
      await loadScannerStatus();
    } catch (error) {
      console.error('Error running manual scan:', error);
    } finally {
      setIsScanningNow(false);
    }
  };

  // Format last scan time
  const getLastScanTimeText = () => {
    if (lastScanTimestamp === 0) {
      return 'Never';
    }

    return formatDate(new Date(lastScanTimestamp));
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!SMSScannerService.isSupported()) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <Card style={styles.notSupportedCard}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
          <Text
            variant="heading2"
            style={[styles.notSupportedTitle, { color: colors.text.primary }]}
          >
            Not Supported
          </Text>
          <Text variant="body" style={[styles.notSupportedText, { color: colors.text.secondary }]}>
            Background SMS scanning is only supported on Android devices.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.settingRow}>
        <View style={styles.settingLabelContainer}>
          <Text variant="heading3" style={{ color: colors.text.primary }}>
            Background SMS Scanning
          </Text>
          <Text variant="body" style={{ color: colors.text.secondary }}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: '#cccccc', true: colors.primary }}
          thumbColor={isEnabled ? colors.primary : '#f4f3f4'}
        />
      </View>

      <Text variant="heading3" style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Scan Frequency
      </Text>

      <View style={[styles.frequencySelector, !isEnabled && styles.disabledSection]}>
        <FrequencyOption
          label="Low"
          description="Once per hour"
          selected={frequency === 'low'}
          onSelect={() => updateFrequency('low')}
          disabled={!isEnabled}
          colors={colors}
        />

        <FrequencyOption
          label="Medium"
          description="Twice per hour"
          selected={frequency === 'medium'}
          onSelect={() => updateFrequency('medium')}
          disabled={!isEnabled}
          colors={colors}
        />

        <FrequencyOption
          label="High"
          description="Four times per hour"
          selected={frequency === 'high'}
          onSelect={() => updateFrequency('high')}
          disabled={!isEnabled}
          colors={colors}
        />
      </View>

      <View style={styles.infoSection}>
        <Text variant="heading3" style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Scanner Information
        </Text>

        <View style={styles.infoRow}>
          <Text variant="body" style={{ color: colors.text.secondary }}>
            Last Scan:
          </Text>
          <Text variant="body" style={{ color: colors.text.primary }}>
            {getLastScanTimeText()}
          </Text>
        </View>

        <View style={styles.manualScanSection}>
          <Button
            title={isScanningNow ? 'Scanning...' : 'Run Manual Scan Now'}
            variant="primary"
            onPress={runManualScan}
            disabled={isScanningNow || !isEnabled}
            style={styles.manualScanButton}
          />
        </View>
      </View>

      <Card style={styles.infoCard}>
        <Ionicons
          name="information-circle-outline"
          size={24}
          color={colors.primary}
          style={styles.infoIcon}
        />
        <Text variant="body" style={{ color: colors.text.secondary }}>
          Background scanning will run periodically to detect new subscription-related SMS messages.
          Higher frequencies provide faster detection but may use more battery.
        </Text>
      </Card>
    </ScrollView>
  );
};

// Frequency option component
interface FrequencyOptionProps {
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
  colors: any;
}

const FrequencyOption: React.FC<FrequencyOptionProps> = ({
  label,
  description,
  selected,
  onSelect,
  disabled,
  colors,
}) => (
  <TouchableOpacity
    style={[
      styles.frequencyOption,
      selected && { backgroundColor: colors.primary + '20' },
      disabled && { opacity: 0.5 },
    ]}
    onPress={onSelect}
    disabled={disabled}
  >
    <View style={styles.radioButton}>
      <View style={[styles.radioButtonInner, selected && { backgroundColor: colors.primary }]} />
    </View>
    <View style={styles.frequencyText}>
      <Text variant="heading3" style={{ color: colors.text.primary }}>
        {label}
      </Text>
      <Text variant="caption" style={{ color: colors.text.secondary }}>
        {description}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLabelContainer: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  frequencySelector: {
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  frequencyOption: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dddddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  frequencyText: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  manualScanSection: {
    marginTop: 16,
  },
  manualScanButton: {
    width: '100%',
  },
  disabledSection: {
    opacity: 0.5,
  },
  infoCard: {
    padding: 16,
    marginBottom: 24,
  },
  infoIcon: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  notSupportedCard: {
    padding: 24,
    alignItems: 'center',
    margin: 16,
  },
  notSupportedTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  notSupportedText: {
    textAlign: 'center',
  },
});

export default SMSScannerSettingsScreen;
