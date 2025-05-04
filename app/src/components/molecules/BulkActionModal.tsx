import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text } from '../atoms/Text';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { Ionicons } from '@expo/vector-icons';
import { Category, Subscription } from '../../types/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { RadioButton } from '../atoms/RadioButton';

interface BulkActionModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSubscriptions: Subscription[];
  categories: Category[];
  onBulkDelete: () => Promise<void>;
  onBulkUpdateCategory: (categoryId: string) => Promise<void>;
  onBulkUpdateBillingCycle: (billingCycle: string) => Promise<void>;
}

type BulkActionType = 'delete' | 'change-category' | 'change-billing-cycle';

const billingCycles = [
  { id: 'monthly', name: 'Monthly' },
  { id: 'yearly', name: 'Yearly' },
  { id: 'quarterly', name: 'Quarterly' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'biweekly', name: 'Bi-weekly' },
];

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  visible,
  onClose,
  selectedSubscriptions,
  categories,
  onBulkDelete,
  onBulkUpdateCategory,
  onBulkUpdateBillingCycle,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const [selectedAction, setSelectedAction] = useState<BulkActionType>('delete');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyAction = async () => {
    if (selectedSubscriptions.length === 0) {
      Alert.alert(
        'No Subscriptions Selected',
        'Please select at least one subscription to perform bulk actions.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      switch (selectedAction) {
        case 'delete':
          await handleBulkDelete();
          break;
        case 'change-category':
          if (selectedCategoryId) {
            await onBulkUpdateCategory(selectedCategoryId);
          } else {
            Alert.alert('Error', 'Please select a category');
            setIsProcessing(false);
            return;
          }
          break;
        case 'change-billing-cycle':
          if (selectedBillingCycle) {
            await onBulkUpdateBillingCycle(selectedBillingCycle);
          } else {
            Alert.alert('Error', 'Please select a billing cycle');
            setIsProcessing(false);
            return;
          }
          break;
      }

      onClose();
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to perform bulk action: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    // Confirm deletion
    return new Promise<void>((resolve, reject) => {
      Alert.alert(
        'Confirm Deletion',
        `Are you sure you want to delete ${selectedSubscriptions.length} subscriptions? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsProcessing(false);
              reject(new Error('Operation cancelled'));
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await onBulkDelete();
                resolve();
              } catch (error) {
                reject(error);
              }
            },
          },
        ]
      );
    });
  };

  const renderActionContent = () => {
    switch (selectedAction) {
      case 'delete':
        return (
          <View style={styles.actionContent}>
            <Text variant="body">
              This will delete {selectedSubscriptions.length} selected subscriptions. This action
              cannot be undone.
            </Text>
          </View>
        );
      case 'change-category':
        return (
          <View style={styles.actionContent}>
            <Text variant="body" style={styles.actionTitle}>
              Select a category:
            </Text>
            <View style={styles.optionsContainer}>
              {categories.map(category => (
                <View key={category.id} style={styles.radioOption}>
                  <RadioButton
                    selected={selectedCategoryId === category.id}
                    onSelect={() => setSelectedCategoryId(category.id)}
                  />
                  <View style={styles.radioLabelContainer}>
                    <Text variant="body">{category.name}</Text>
                    {category.icon && (
                      <Ionicons
                        name={category.icon as any}
                        size={16}
                        color={category.color || colors.text.primary}
                        style={styles.categoryIcon}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      case 'change-billing-cycle':
        return (
          <View style={styles.actionContent}>
            <Text variant="body" style={styles.actionTitle}>
              Select a billing cycle:
            </Text>
            <View style={styles.optionsContainer}>
              {billingCycles.map(cycle => (
                <View key={cycle.id} style={styles.radioOption}>
                  <RadioButton
                    selected={selectedBillingCycle === cycle.id}
                    onSelect={() => setSelectedBillingCycle(cycle.id)}
                  />
                  <Text variant="body" style={styles.radioLabel}>
                    {cycle.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Bulk Action (${selectedSubscriptions.length} selected)`}
      size="large"
    >
      <View style={styles.container}>
        <Text variant="heading3" style={styles.sectionTitle}>
          Select Action
        </Text>
        <View style={styles.actionSelectionContainer}>
          <View style={styles.radioOption}>
            <RadioButton
              selected={selectedAction === 'delete'}
              onSelect={() => setSelectedAction('delete')}
            />
            <Text variant="body" style={styles.radioLabel}>
              Delete Subscriptions
            </Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton
              selected={selectedAction === 'change-category'}
              onSelect={() => setSelectedAction('change-category')}
            />
            <Text variant="body" style={styles.radioLabel}>
              Change Category
            </Text>
          </View>
          <View style={styles.radioOption}>
            <RadioButton
              selected={selectedAction === 'change-billing-cycle'}
              onSelect={() => setSelectedAction('change-billing-cycle')}
            />
            <Text variant="body" style={styles.radioLabel}>
              Change Billing Cycle
            </Text>
          </View>
        </View>

        {renderActionContent()}

        <View style={styles.buttonContainer}>
          <Button
            variant="outline"
            title="Cancel"
            onPress={onClose}
            style={styles.cancelButton}
            disabled={isProcessing}
          />
          <Button
            variant="primary"
            title={isProcessing ? 'Processing...' : 'Apply'}
            onPress={handleApplyAction}
            style={styles.applyButton}
            disabled={isProcessing}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionSelectionContainer: {
    marginBottom: 24,
  },
  actionContent: {
    marginBottom: 24,
  },
  actionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  optionsContainer: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioLabel: {
    marginLeft: 8,
  },
  categoryIcon: {
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    marginRight: 12,
  },
  applyButton: {},
});
