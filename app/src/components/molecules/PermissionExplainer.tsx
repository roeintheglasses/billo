import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PermissionState, PermissionType } from '../../types/permissions';

interface PermissionExplainerProps {
  permissionType: PermissionType;
  permissionState: PermissionState;
  onRequestPermission: () => void;
  onSkip: () => void;
  onOpenSettings: () => void;
}

/**
 * PermissionExplainer Component
 * 
 * Displays educational UI about permission usage with appropriate actions
 * based on the current permission state
 */
export const PermissionExplainer: React.FC<PermissionExplainerProps> = ({
  permissionType,
  permissionState,
  onRequestPermission,
  onSkip,
  onOpenSettings,
}) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  // Different messages based on permission type
  const getPermissionDetails = () => {
    switch (permissionType) {
      case PermissionType.SMS:
        return {
          title: 'SMS Scanning',
          description: 'Billo can automatically detect subscriptions by scanning your SMS messages for payment confirmations and renewal notices.',
          benefits: [
            'Automatic detection of subscription services',
            'No manual entry needed for common subscriptions',
            'Detection of billing amounts and renewal dates',
            'Timely notification of subscription renewals'
          ],
          privacyNote: 'Your messages are scanned locally on your device. No message content is stored or transmitted.',
          icon: 'mail-outline',
        };
      case PermissionType.CAMERA:
        return {
          title: 'Camera Access',
          description: 'Billo can use your camera to scan subscription documents and payment receipts.',
          benefits: [
            'Quickly capture payment receipts',
            'Scan QR codes for subscription information',
            'Import subscription details from documents'
          ],
          privacyNote: 'Photos taken in the app are processed locally and aren\'t stored unless you specifically save them.',
          icon: 'camera-outline',
        };
      default:
        return {
          title: 'Permission Required',
          description: 'This feature requires additional permissions to work correctly.',
          benefits: ['Enhanced app functionality'],
          privacyNote: 'Your privacy is important to us.',
          icon: 'shield-outline',
        };
    }
  };

  const { title, description, benefits, privacyNote, icon } = getPermissionDetails();

  // Determine the action button text and callback based on current permission state
  const getActionButton = () => {
    switch (permissionState) {
      case PermissionState.NOT_REQUESTED:
      case PermissionState.DENIED:
        return {
          text: 'Grant Permission',
          action: onRequestPermission,
        };
      case PermissionState.DENIED_PERMANENTLY:
        return {
          text: 'Open Settings',
          action: onOpenSettings,
        };
      case PermissionState.GRANTED:
        return {
          text: 'Permission Granted',
          action: () => {},
        };
      default:
        return {
          text: 'Continue',
          action: onSkip,
        };
    }
  };

  const actionButton = getActionButton();
  const isDeniedPermanently = permissionState === PermissionState.DENIED_PERMANENTLY;
  const isGranted = permissionState === PermissionState.GRANTED;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <Ionicons name={icon as any} size={64} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {description}
        </Text>

        <View style={[styles.benefitsContainer, { borderColor: colors.border.light }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text.primary }]}>
            Benefits:
          </Text>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
              <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
                {benefit}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.privacyContainer, { backgroundColor: colors.background.secondary }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
          <Text style={[styles.privacyText, { color: colors.text.secondary }]}>
            {privacyNote}
          </Text>
        </View>

        {isDeniedPermanently && (
          <View style={[styles.warningContainer, { backgroundColor: colors.background.tertiary }]}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.text.secondary }]}>
              You've previously denied this permission. Please open your device settings to enable it.
            </Text>
          </View>
        )}

        {isGranted && (
          <View style={[styles.successContainer, { backgroundColor: colors.background.tertiary }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
            <Text style={[styles.successText, { color: colors.text.secondary }]}>
              Permission already granted. You're all set!
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {!isGranted && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border.medium }]}
            onPress={onSkip}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text.secondary }]}>
              Skip for Now
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: isGranted ? colors.success : colors.primary },
            isGranted && { opacity: 0.7 }
          ]}
          onPress={actionButton.action}
          disabled={isGranted}
        >
          <Text style={[styles.primaryButtonText, { color: colors.text.inverted }]}>
            {actionButton.text}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  benefitsContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
  },
}); 