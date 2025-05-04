import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '../../contexts/ThemeContext';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  color?: string;
  position?: 'bottom-right' | 'bottom-center';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = 'add',
  title,
  color,
  position = 'bottom-right',
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <TouchableOpacity
      style={[styles.button, styles[position], { backgroundColor: color || colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {title ? (
        <View style={styles.containerWithTitle}>
          <Ionicons name={icon} size={24} color={colors.text.inverted} />
          <Text variant="body" style={styles.title}>
            {title}
          </Text>
        </View>
      ) : (
        <Ionicons name={icon} size={24} color={colors.text.inverted} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,
  },
  'bottom-right': {
    bottom: 20,
    right: 20,
  },
  'bottom-center': {
    bottom: 20,
    alignSelf: 'center',
  },
  containerWithTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
