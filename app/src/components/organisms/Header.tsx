import React from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from '../atoms/Text';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  bgColor?: string;
  translucent?: boolean;
}

/**
 * Header component for app screens
 *
 * Displays a consistent header across screens with customizable left/right components,
 * title, and subtitle.
 *
 * @param {string} title - Main header title
 * @param {string} subtitle - Smaller text shown below the title
 * @param {React.ReactNode} leftComponent - Component to display on the left side
 * @param {React.ReactNode} rightComponent - Component to display on the right side
 * @param {function} onLeftPress - Function to call when left area is pressed
 * @param {function} onRightPress - Function to call when right area is pressed
 * @param {string} bgColor - Background color of the header
 * @param {boolean} translucent - Whether the header should be translucent
 * @returns {React.ReactElement} A styled header component
 *
 * @example
 * // Basic header with title
 * <Header title="Subscriptions" />
 *
 * // Header with back button and action
 * <Header
 *   title="Subscription Details"
 *   leftComponent={<BackIcon />}
 *   onLeftPress={navigation.goBack}
 *   rightComponent={<EditIcon />}
 *   onRightPress={handleEdit}
 * />
 */
export const Header = ({
  title,
  subtitle,
  leftComponent,
  rightComponent,
  onLeftPress,
  onRightPress,
  bgColor = '#ffffff',
  translucent = false,
}: HeaderProps) => {
  return (
    <>
      <StatusBar
        backgroundColor={translucent ? 'transparent' : bgColor}
        barStyle="dark-content"
        translucent={translucent}
      />
      <View
        style={[styles.container, { backgroundColor: bgColor }, translucent && styles.translucent]}
      >
        <View style={styles.leftContainer}>
          {leftComponent && (
            <TouchableOpacity
              disabled={!onLeftPress}
              onPress={onLeftPress}
              style={styles.iconContainer}
            >
              {leftComponent}
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text variant="heading3" weight="semibold" align="center" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" align="center" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.rightContainer}>
          {rightComponent && (
            <TouchableOpacity
              disabled={!onRightPress}
              onPress={onRightPress}
              style={styles.iconContainer}
            >
              {rightComponent}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  translucent: {
    borderBottomWidth: 0,
    paddingTop: StatusBar.currentHeight || 0,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  iconContainer: {
    padding: 8,
  },
});
