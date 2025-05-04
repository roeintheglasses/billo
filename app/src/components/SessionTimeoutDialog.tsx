/**
 * Session Timeout Dialog Component
 *
 * This component displays a warning when the user's session is about to expire,
 * giving them the option to extend the session or sign out.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Session Timeout Dialog
 *
 * Shows a warning when the session is about to expire and provides options to extend or sign out.
 */
const SessionTimeoutDialog: React.FC = () => {
  const { sessionTimeoutWarning, extendSession, signOut, dismissSessionWarning, isLoading } =
    useAuth();

  if (!sessionTimeoutWarning) {
    return null;
  }

  /**
   * Handle extending the session
   */
  const handleExtendSession = async () => {
    await extendSession();
  };

  /**
   * Handle signing out
   */
  const handleSignOut = async () => {
    await signOut();
  };

  /**
   * Handle dismissing the warning
   */
  const handleDismiss = () => {
    dismissSessionWarning();
  };

  return (
    <Modal
      transparent
      visible={sessionTimeoutWarning}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Session Timeout Warning</Text>
          <Text style={styles.message}>
            Your session is about to expire. Would you like to extend your session?
          </Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleExtendSession}>
                <Text style={styles.buttonText}>Extend Session</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSignOut}
              >
                <Text style={styles.secondaryButtonText}>Sign Out</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#333',
  },
  dismissButton: {
    padding: 10,
  },
  dismissText: {
    color: '#666',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
});

export default SessionTimeoutDialog;
