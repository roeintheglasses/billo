import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { FeedbackForm } from './FeedbackForm';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  subscriptionId?: string;
  messageId?: string;
}

/**
 * FeedbackModal Component
 *
 * A modal that contains the feedback form for collecting user feedback
 * on subscription detection accuracy.
 */
export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  onSubmitSuccess,
  subscriptionId,
  messageId,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <FeedbackForm
            subscriptionId={subscriptionId}
            messageId={messageId}
            onSubmitSuccess={() => {
              onSubmitSuccess();
              onClose();
            }}
            onCancel={onClose}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
  },
  closeButton: {
    padding: 4,
  },
});
