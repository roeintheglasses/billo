import React, { useEffect, useState } from 'react';
import { 
  View, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../atoms/Text';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useStorage } from '../../contexts/StorageContext';
import { Category } from '../../types/supabase';
import { isValidColor } from '../../services/categoryService';

// Available icons for categories
const AVAILABLE_ICONS = [
  'film', 'cloud', 'code', 'heart', 'pizza', 'cart', 
  'home', 'bicycle', 'airplane', 'car', 'book', 'cafe',
  'game-controller', 'barbell', 'wifi', 'musical-notes'
];

// Available colors for categories
const AVAILABLE_COLORS = [
  '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
  '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
  '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
  '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
];

interface CategoryModalProps {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

/**
 * CategoryModal Component
 * 
 * A modal for adding or editing a category with name, icon, and color selection.
 */
const CategoryModal: React.FC<CategoryModalProps> = ({ 
  visible, 
  category, 
  onClose,
  onRefresh
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { createCategory, updateCategory } = useStorage();
  
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FF5252');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form with category data if editing
  useEffect(() => {
    if (category) {
      setName(category.name);
      setSelectedIcon(category.icon);
      setSelectedColor(category.color || '#FF5252');
    } else {
      // Reset form for new category
      setName('');
      setSelectedIcon(null);
      setSelectedColor('#FF5252');
    }
    setError(null);
  }, [category, visible]);
  
  const handleSave = async () => {
    try {
      setError(null);
      
      // Validate name
      if (!name.trim()) {
        setError('Category name is required');
        return;
      }
      
      // Validate color if provided
      if (selectedColor && !isValidColor(selectedColor)) {
        setError('Invalid color format');
        return;
      }
      
      setIsLoading(true);
      
      if (category) {
        // Update existing category
        await updateCategory(category.id, {
          name,
          icon: selectedIcon,
          color: selectedColor,
        });
        Alert.alert('Success', `Category "${name}" updated successfully`);
      } else {
        // Create new category
        await createCategory({
          name,
          icon: selectedIcon,
          color: selectedColor,
          is_default: false,
          user_id: null
        });
        Alert.alert('Success', `Category "${name}" created successfully`);
      }
      
      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      setError(`Failed to save category: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderIconOption = (icon: string) => {
    const isSelected = selectedIcon === icon;
    
    return (
      <TouchableOpacity
        key={icon}
        style={[
          styles.iconOption,
          { 
            backgroundColor: isSelected ? selectedColor : colors.background.secondary,
            borderColor: isSelected ? selectedColor : colors.border.light,
          }
        ]}
        onPress={() => setSelectedIcon(icon)}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={isSelected ? '#fff' : colors.text.primary}
        />
      </TouchableOpacity>
    );
  };
  
  const renderColorOption = (color: string) => {
    const isSelected = selectedColor === color;
    
    return (
      <TouchableOpacity
        key={color}
        style={[
          styles.colorOption,
          { 
            backgroundColor: color,
            borderWidth: isSelected ? 3 : 1,
            borderColor: isSelected ? colors.primary : colors.border.light,
          }
        ]}
        onPress={() => setSelectedColor(color)}
      />
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[
              styles.modalContent,
              { backgroundColor: colors.background.primary }
            ]}>
              <View style={styles.modalHeader}>
                <Text variant="heading2">
                  {category ? 'Edit Category' : 'Add Category'}
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView contentContainerStyle={styles.formContainer}>
                <View style={styles.formField}>
                  <Text variant="body" style={styles.label}>Name</Text>
                  <Input
                    placeholder="Enter category name"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                
                <View style={styles.formField}>
                  <Text variant="body" style={styles.label}>Icon</Text>
                  <View style={styles.iconsContainer}>
                    {AVAILABLE_ICONS.map(renderIconOption)}
                  </View>
                </View>
                
                <View style={styles.formField}>
                  <Text variant="body" style={styles.label}>Color</Text>
                  <View style={styles.colorsContainer}>
                    {AVAILABLE_COLORS.map(renderColorOption)}
                  </View>
                </View>
                
                {error && (
                  <Text variant="caption" style={[styles.errorText, { color: colors.error }]}>
                    {error}
                  </Text>
                )}
                
                <View style={styles.previewContainer}>
                  <Text variant="body" style={styles.label}>Preview</Text>
                  <View style={[
                    styles.previewCard,
                    { 
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.light
                    }
                  ]}>
                    <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                      <Ionicons
                        name={(selectedIcon || 'apps') as any}
                        size={24}
                        color="#fff"
                      />
                    </View>
                    <Text variant="heading3" style={styles.previewText}>
                      {name || 'Category Name'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
              
              <View style={styles.buttonContainer}>
                <Button
                  title="Cancel"
                  onPress={onClose}
                  variant="secondary"
                />
                <View style={styles.buttonSpacer} />
                <Button
                  title={isLoading ? 'Saving...' : 'Save'}
                  onPress={handleSave}
                  disabled={isLoading}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formContainer: {
    paddingBottom: 20,
  },
  formField: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  iconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  iconOption: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10,
  },
  previewContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewText: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonSpacer: {
    width: 12,
  },
  errorText: {
    marginBottom: 16,
  },
});

export default CategoryModal; 