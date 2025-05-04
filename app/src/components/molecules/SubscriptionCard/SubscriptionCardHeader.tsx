import React from 'react';
import { View, StyleSheet, Image, StyleProp, ViewStyle, ImageSourcePropType } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { Text } from '../../atoms/Text';

export interface SubscriptionCardHeaderProps {
  title: string;
  iconUrl?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Header component for SubscriptionCard
 *
 * @param {string} title - The subscription service name
 * @param {string} iconUrl - URL to the subscription service logo
 * @returns {React.ReactElement} A subscription card header component
 */
export const SubscriptionCardHeader: React.FC<SubscriptionCardHeaderProps> = ({
  title,
  iconUrl,
  style,
  testID,
}) => {
  const { theme } = useTheme();

  // Generate placeholder initial if no icon is provided
  const getInitial = () => {
    return title.charAt(0).toUpperCase();
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {iconUrl ? (
        <Image source={{ uri: iconUrl }} style={styles.icon} resizeMode="contain" />
      ) : (
        <View style={[styles.initialContainer, { backgroundColor: theme.colors.primary }]}>
          <Text style={{ color: theme.colors.text.inverted }} variant="subtitle">
            {getInitial()}
          </Text>
        </View>
      )}
      <Text
        variant="subtitle"
        style={[styles.title, { color: theme.colors.text.primary }]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 12,
  },
  initialContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});

export default SubscriptionCardHeader;
