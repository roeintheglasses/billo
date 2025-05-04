import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../components/atoms/Text';
import { Button } from '../components/atoms/Button';
import { useTheme } from '../contexts/ThemeContext';
import { useStorage } from '../contexts/StorageContext';
import { Category } from '../types/supabase';
import CategoryModal from '../components/molecules/CategoryModal';

/**
 * CategoryManagementScreen Component
 *
 * Displays a list of categories and allows users to add, edit, and delete categories.
 */
const CategoryManagementScreen = () => {
  const { theme } = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();
  const { categories, fetchCategories, deleteCategory } = useStorage();

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        await fetchCategories();
      } catch (error) {
        console.error('Error loading categories:', error);
        Alert.alert('Error', 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [fetchCategories]);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setModalVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    // Check if it's a default category
    if (category.is_default) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the category "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              await fetchCategories(); // Refresh the list
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const categoryColor = item.color || colors.primary;

    return (
      <View
        style={[
          styles.categoryItem,
          { backgroundColor: colors.background.secondary, borderColor: colors.border.light },
        ]}
      >
        <View style={styles.categoryInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
            <Ionicons name={item.icon ? (item.icon as any) : 'apps'} size={24} color="#fff" />
          </View>
          <View style={styles.categoryDetails}>
            <Text variant="heading3" style={styles.categoryName}>
              {item.name}
            </Text>
            {item.is_default && (
              <Text variant="caption" style={styles.defaultBadge}>
                Default
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditCategory(item)}
            disabled={item.is_default}
          >
            <Ionicons
              name="pencil"
              size={20}
              color={item.is_default ? colors.text.tertiary : colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteCategory(item)}
            disabled={item.is_default}
          >
            <Ionicons
              name="trash"
              size={20}
              color={item.is_default ? colors.text.tertiary : colors.error}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text variant="heading1" style={styles.title}>
          Manage Categories
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" style={styles.loadingText}>
            Loading categories...
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text variant="body" style={styles.emptyText}>
                  No categories found
                </Text>
              </View>
            }
          />

          <View style={styles.addButtonContainer}>
            <Button title="Add New Category" onPress={handleAddCategory} />
          </View>
        </>
      )}

      <CategoryModal
        visible={modalVisible}
        category={selectedCategory}
        onClose={handleCloseModal}
        onRefresh={fetchCategories}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  list: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    marginBottom: 2,
  },
  defaultBadge: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  addButtonContainer: {
    padding: 16,
    paddingBottom: 24,
  },
});

export default CategoryManagementScreen;
