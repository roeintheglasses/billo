import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../atoms/Text';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.background.secondary }]}>
        <Ionicons name={icon as any} size={48} color={colors.text.secondary} />
      </View>
      <Text variant="heading3" style={[styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>
      <Text variant="body" style={[styles.message, { color: colors.text.secondary }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
