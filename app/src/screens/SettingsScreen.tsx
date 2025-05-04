import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../contexts/StorageContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

/**
 * Settings Screen Component
 * 
 * Displays user settings and configuration options.
 */
export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { signOut } = useAuth();
  const { 
    storageMethod, 
    setStorageMethod, 
    isOnline, 
    subscriptions 
  } = useStorage();
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  // Toggle between local and remote storage
  const toggleStorageMethod = async () => {
    try {
      setIsLoading(true);
      const newMethod = storageMethod === 'remote' ? 'local' : 'remote';
      
      // If switching to remote storage but offline, show warning
      if (newMethod === 'remote' && !isOnline) {
        Alert.alert(
          'No Internet Connection',
          'You appear to be offline. Remote storage requires an internet connection.',
          [
            { text: 'Stay on Local Storage', style: 'cancel' },
            { 
              text: 'Try Anyway', 
              onPress: async () => await setStorageMethod(newMethod),
              style: 'destructive'
            }
          ]
        );
        return;
      }
      
      // If switching from local to remote, ask for confirmation if there are local changes
      if (newMethod === 'remote' && storageMethod === 'local' && subscriptions.length > 0) {
        Alert.alert(
          'Sync Local Data?',
          'Would you like to sync your local data to the remote server? This will merge your changes with any existing remote data.',
          [
            { 
              text: 'Keep Separate', 
              onPress: async () => await setStorageMethod(newMethod)
            },
            { 
              text: 'Sync Data', 
              onPress: async () => {
                // In a real implementation, we would sync the data here
                // For now, we just switch the storage method
                await setStorageMethod(newMethod);
                Alert.alert('Data Synced', 'Your local data has been synced with the remote server.');
              }
            }
          ]
        );
        return;
      }
      
      // Default case: just switch storage method
      await setStorageMethod(newMethod);
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to change storage method: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: colors.background.primary }
      ]}
    >
      <View style={[
        styles.header,
        { 
          backgroundColor: colors.background.primary,
          borderBottomColor: colors.border.light 
        }
      ]}>
        <Text style={[
          styles.headerTitle,
          { color: colors.text.primary }
        ]}>Settings</Text>
      </View>
      
      <View style={[
        styles.section,
        { 
          backgroundColor: colors.background.primary,
          borderColor: colors.border.light 
        }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { 
            color: colors.text.secondary,
            backgroundColor: colors.background.secondary 
          }
        ]}>Account</Text>
        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: colors.border.light }]}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.option, { borderBottomColor: colors.border.light }]}
          onPress={() => navigation.navigate('ChangePassword' as never)}
        >
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[
          styles.option,
          { borderBottomColor: colors.border.light }
        ]}>
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Subscription Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[
          styles.option,
          { borderBottomColor: colors.border.light }
        ]}>
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Payment Methods</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[
        styles.section,
        { 
          backgroundColor: colors.background.primary,
          borderColor: colors.border.light 
        }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { 
            color: colors.text.secondary,
            backgroundColor: colors.background.secondary 
          }
        ]}>Preferences</Text>
        
        {/* Theme toggle component */}
        <View style={[
          styles.option,
          { 
            borderBottomColor: colors.border.light,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }
        ]}>
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Theme</Text>
          <ThemeToggle />
        </View>
        
        <TouchableOpacity style={[
          styles.option,
          { borderBottomColor: colors.border.light }
        ]}>
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[
          styles.option,
          { borderBottomColor: colors.border.light }
        ]}>
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Currency</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[
        styles.section,
        { 
          backgroundColor: colors.background.primary,
          borderColor: colors.border.light 
        }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { 
            color: colors.text.secondary,
            backgroundColor: colors.background.secondary 
          }
        ]}>Data Storage</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Use Remote Storage</Text>
            <Text style={styles.settingDescription}>
              {storageMethod === 'remote' 
                ? 'Your data is stored on our servers and synced across devices.' 
                : 'Your data is only stored locally on this device.'}
            </Text>
            {!isOnline && storageMethod === 'local' && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning-outline" size={16} color="#FF9800" />
                <Text style={styles.warningText}>You are currently offline. Remote storage unavailable.</Text>
              </View>
            )}
          </View>
          <Switch
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={storageMethod === 'remote' ? '#8BC34A' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleStorageMethod}
            value={storageMethod === 'remote'}
            disabled={isLoading}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Connection Status</Text>
            <Text style={styles.settingDescription}>
              {isOnline ? 'Connected to the internet' : 'Currently offline'}
            </Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]}>
            <Ionicons 
              name={isOnline ? 'checkmark-circle-outline' : 'close-circle-outline'} 
              size={16} 
              color="#fff"
            />
          </View>
        </View>
      </View>
      
      <View style={[
        styles.section,
        { 
          backgroundColor: colors.background.primary,
          borderColor: colors.border.light 
        }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { 
            color: colors.text.secondary,
            backgroundColor: colors.background.secondary 
          }
        ]}>Subscription Management</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
          <Ionicons name="cloud-download-outline" size={20} color="#2196F3" />
          <Text style={styles.actionButtonText}>Export Subscriptions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
          <Ionicons name="cloud-upload-outline" size={20} color="#4CAF50" />
          <Text style={styles.actionButtonText}>Import Subscriptions</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[
        styles.section,
        { 
          backgroundColor: colors.background.primary,
          borderColor: colors.border.light 
        }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { 
            color: colors.text.secondary,
            backgroundColor: colors.background.secondary 
          }
        ]}>Support</Text>
        <TouchableOpacity style={[
          styles.option,
          { borderBottomColor: colors.border.light }
        ]}>
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[
          styles.option,
          { borderBottomColor: colors.border.light }
        ]}>
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[
          styles.option,
          { borderBottomColor: colors.border.light }
        ]}>
          <Text style={[styles.optionText, { color: colors.text.primary }]}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: colors.error }]}
        onPress={handleSignOut}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      
      <Text style={[
        styles.versionText,
        { color: colors.text.tertiary }
      ]}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    padding: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  option: {
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 6,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  actionButtonText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#333',
  },
});

export default SettingsScreen; 