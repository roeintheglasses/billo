import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewProps, 
  StyleProp,
  ViewStyle,
  DimensionValue,
} from 'react-native';

// Row component props
export interface RowProps extends ViewProps {
  gap?: number;
  wrap?: boolean;
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  style?: StyleProp<ViewStyle>;
}

/**
 * Row component for horizontal layouts
 * 
 * @param {number} gap - Space between items
 * @param {boolean} wrap - Whether items should wrap to next line
 * @param {string} alignItems - Vertical alignment of items
 * @param {string} justifyContent - Horizontal distribution of items
 * @returns {React.ReactElement} A row layout component
 * 
 * @example
 * // Basic usage
 * <Row>
 *   <View style={{ width: 50, height: 50, backgroundColor: 'red' }} />
 *   <View style={{ width: 50, height: 50, backgroundColor: 'blue' }} />
 * </Row>
 * 
 * // With gap and alignment
 * <Row gap={16} alignItems="center" justifyContent="space-between">
 *   <Text>Left</Text>
 *   <Text>Right</Text>
 * </Row>
 */
export const Row = ({
  children,
  gap = 0,
  wrap = false,
  alignItems = 'center',
  justifyContent = 'flex-start',
  style,
  ...rest
}: RowProps) => {
  // Create container style
  const rowStyle: StyleProp<ViewStyle> = [
    styles.row,
    {
      flexWrap: wrap ? 'wrap' : 'nowrap',
      alignItems,
      justifyContent,
    },
    style,
  ];

  // If no gap is set, render children directly
  if (gap === 0) {
    return (
      <View style={rowStyle} {...rest}>
        {children}
      </View>
    );
  }

  // Apply gap manually by wrapping each child in a container with margin
  const childCount = React.Children.count(children);
  const childrenWithGap = React.Children.map(children, (child, index) => {
    return (
      <View style={index < childCount - 1 ? { marginRight: gap } : undefined}>
        {child}
      </View>
    );
  });

  return (
    <View style={rowStyle} {...rest}>
      {childrenWithGap}
    </View>
  );
};

// Column component props
export interface ColumnProps extends ViewProps {
  gap?: number;
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  flex?: number;
  width?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

/**
 * Column component for vertical layouts
 * 
 * @param {number} gap - Space between items
 * @param {string} alignItems - Horizontal alignment of items
 * @param {string} justifyContent - Vertical distribution of items
 * @param {number} flex - Flex value for the column
 * @param {number|string} width - Width of the column
 * @returns {React.ReactElement} A column layout component
 * 
 * @example
 * // Basic usage
 * <Column>
 *   <Text>Item 1</Text>
 *   <Text>Item 2</Text>
 * </Column>
 * 
 * // With gap and alignment
 * <Column gap={16} alignItems="center" justifyContent="space-between">
 *   <Text>Top</Text>
 *   <Text>Bottom</Text>
 * </Column>
 */
export const Column = ({
  children,
  gap = 0,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  flex,
  width,
  style,
  ...rest
}: ColumnProps) => {
  // Create container style
  const columnStyle: StyleProp<ViewStyle> = [
    styles.column,
    {
      alignItems,
      justifyContent,
      flex: flex !== undefined ? flex : undefined,
      width,
    },
    style,
  ];

  // If no gap is set, render children directly
  if (gap === 0) {
    return (
      <View style={columnStyle} {...rest}>
        {children}
      </View>
    );
  }

  // Apply gap manually by wrapping each child in a container with margin
  const childCount = React.Children.count(children);
  const childrenWithGap = React.Children.map(children, (child, index) => {
    return (
      <View style={index < childCount - 1 ? { marginBottom: gap } : undefined}>
        {child}
      </View>
    );
  });

  return (
    <View style={columnStyle} {...rest}>
      {childrenWithGap}
    </View>
  );
};

// Grid component props
export interface GridProps extends ViewProps {
  columns?: number;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Grid component for creating responsive grid layouts
 * 
 * @param {number} columns - Number of columns in the grid
 * @param {number} gap - Space between all items
 * @param {number} rowGap - Space between rows
 * @param {number} columnGap - Space between columns
 * @returns {React.ReactElement} A grid layout component
 * 
 * @example
 * // Basic usage with 2 columns
 * <Grid columns={2} gap={16}>
 *   <View style={{ height: 100, backgroundColor: 'red' }} />
 *   <View style={{ height: 100, backgroundColor: 'blue' }} />
 *   <View style={{ height: 100, backgroundColor: 'green' }} />
 *   <View style={{ height: 100, backgroundColor: 'yellow' }} />
 * </Grid>
 */
export const Grid = ({
  children,
  columns = 2,
  gap = 0,
  rowGap,
  columnGap,
  style,
  ...rest
}: GridProps) => {
  // Apply gap to both row and column gaps if they're not explicitly specified
  const effectiveRowGap = rowGap !== undefined ? rowGap : gap;
  const effectiveColumnGap = columnGap !== undefined ? columnGap : gap;

  // Convert React children to array for manipulation
  const childrenArray = React.Children.toArray(children);
  const rows: React.ReactElement[] = [];

  // Group children into rows based on column count
  for (let i = 0; i < childrenArray.length; i += columns) {
    const rowItems = childrenArray.slice(i, i + columns);
    
    // Create a row with all items in this group
    rows.push(
      <View 
        key={`grid-row-${i}`} 
        style={[
          styles.gridRow,
          { marginBottom: i + columns < childrenArray.length ? effectiveRowGap : 0 }
        ]}
      >
        <Row gap={effectiveColumnGap}>
          {rowItems.map((child, index) => (
            <View 
              key={`grid-item-${i + index}`}
              style={[styles.gridItem, { flex: 1 / columns }]}
            >
              {child}
            </View>
          ))}
        </Row>
      </View>
    );
  }

  return (
    <View style={[styles.grid, style]} {...rest}>
      {rows}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  column: {
    flexDirection: 'column',
  },
  grid: {
    width: '100%',
  },
  gridRow: {
    width: '100%',
  },
  gridItem: {
    minWidth: 0, // Prevent items from overflowing
  },
}); 