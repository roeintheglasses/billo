import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PermissionExplainer } from '../components/molecules/PermissionExplainer';
import { PermissionState, PermissionType } from '../types/permissions';
import { useSMSPermissions } from '../contexts/PermissionsContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * SMSPermissionScreen Component
 * 
 * A screen that explains and requests SMS permissions
 */
const SMSPermissionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    smsPermissionState,
    checkSMSPermission,
    requestSMSPermission,
    showSMSPermissionExplanation,
    isSMSPermissionGranted,
  } = useSMSPermissions();

  useEffect(() => {
    const checkPermissions = async () => {
      setIsLoading(true);
      await checkSMSPermission();
      setIsLoading(false);
    };

    checkPermissions();
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestSMSPermission();
    if (granted) {
      // Navigate to the next screen or show confirmation
      handleContinue();
    }
  };

  const handleOpenSettings = () => {
    // This will be handled by the PermissionExplainer component
  };

  const handleContinue = () => {
    // Navigate to next screen or close this screen
    navigation.goBack();
  };

  // Show loading indicator while checking permissions
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Checking permissions...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <PermissionExplainer
        permissionType={PermissionType.SMS}
        permissionState={smsPermissionState}
        onRequestPermission={handleRequestPermission}
        onSkip={handleContinue}
        onOpenSettings={handleOpenSettings}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default SMSPermissionScreen; 