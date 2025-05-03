import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

/**
 * Settings Screen Component
 * 
 * Displays user settings and configuration options.
 */
export const SettingsScreen = () => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const navigation = useNavigation();
  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
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
        <TouchableOpacity style={[
          styles.option,
          { borderBottomColor: colors.border.light }
        ]}>
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
}); 