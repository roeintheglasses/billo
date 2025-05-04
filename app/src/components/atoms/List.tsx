import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ViewStyle,
  StyleProp,
  FlatListProps,
  ListRenderItem,
  ListRenderItemInfo,
  ActivityIndicator,
  Text,
  DimensionValue,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from './Card';

export interface ListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  isLoading?: boolean;
  showsVerticalScrollIndicator?: boolean;
  emptyText?: string;
  loadingText?: string;
  separatorHeight?: number;
  rounded?: boolean;
  cardVariant?: 'default' | 'outlined' | 'elevated';
  containerStyle?: StyleProp<ViewStyle>;
  headerComponent?: React.ReactElement;
  footerComponent?: React.ReactElement;
  itemContainerStyle?: StyleProp<ViewStyle>;
  contentContainerPadding?: DimensionValue;
}

/**
 * List component for displaying collections of items with consistent styling
 *
 * @param {array} data - Array of data items to render
 * @param {function} renderItem - Function to render each item
 * @param {boolean} isLoading - Whether the list is loading data
 * @param {string} emptyText - Text to display when list is empty
 * @param {string} loadingText - Text to display when list is loading
 * @param {number} separatorHeight - Height of separator between items
 * @param {boolean} rounded - Whether the list container should have rounded corners
 * @param {string} cardVariant - Styling variant for the card container
 * @param {object} containerStyle - Additional styles for the container
 * @param {ReactElement} headerComponent - Component to render at the top of the list
 * @param {ReactElement} footerComponent - Component to render at the bottom of the list
 * @param {object} itemContainerStyle - Additional styles for individual item containers
 * @param {number|string} contentContainerPadding - Padding for the content container
 * @returns {React.ReactElement} A list component
 *
 * @example
 * // Basic usage
 * <List
 *   data={items}
 *   renderItem={({ item }) => <Text>{item.name}</Text>}
 * />
 *
 * // With loading state and custom empty text
 * <List
 *   data={items}
 *   renderItem={({ item }) => <Text>{item.name}</Text>}
 *   isLoading={isLoading}
 *   emptyText="No items found"
 *   separatorHeight={8}
 * />
 */
export function List<T>({
  data,
  renderItem,
  isLoading = false,
  showsVerticalScrollIndicator = false,
  emptyText = 'No items found',
  loadingText = 'Loading...',
  separatorHeight = 0,
  rounded = true,
  cardVariant = 'default',
  containerStyle,
  headerComponent,
  footerComponent,
  itemContainerStyle,
  contentContainerPadding = 0,
  ...rest
}: ListProps<T>) {
  const { theme } = useTheme();
  const { colors } = theme;

  // Wrap each item with proper styling and separator
  const renderItemWithContainer: ListRenderItem<T> = info => {
    const content = renderItem(info);
    const { index } = info;

    // Apply styling to the item container
    return (
      <View
        style={[
          styles.itemContainer,
          { marginBottom: index < data.length - 1 ? separatorHeight : 0 },
          itemContainerStyle,
        ]}
      >
        {content}
      </View>
    );
  };

  // Render loading state
  const renderLoading = () => (
    <View style={styles.placeholderContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      {loadingText ? (
        <Text style={{ color: colors.text.secondary, marginTop: 16 }}>{loadingText}</Text>
      ) : null}
    </View>
  );

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.placeholderContainer}>
      {emptyText ? <Text style={{ color: colors.text.secondary }}>{emptyText}</Text> : null}
    </View>
  );

  // Determine what content to render
  const renderContent = () => {
    if (isLoading) {
      return renderLoading();
    }

    if (data.length === 0) {
      return renderEmpty();
    }

    return (
      <FlatList
        data={data}
        renderItem={renderItemWithContainer}
        keyExtractor={(item, index) => `list-item-${index}`}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={footerComponent}
        contentContainerStyle={{ padding: contentContainerPadding }}
        {...rest}
      />
    );
  };

  // Render the list with appropriate container
  return (
    <Card variant={cardVariant} radius={rounded ? 8 : 0} style={[styles.container, containerStyle]}>
      {renderContent()}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  itemContainer: {
    width: '100%',
  },
  placeholderContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
  },
});

export default List;
