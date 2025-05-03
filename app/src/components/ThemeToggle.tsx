import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ThemeToggle Component
 * 
 * A simple button component that toggles between dark and light theme
 */
export const ThemeToggle = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { colors } = theme;

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? colors.background.tertiary : colors.background.secondary }
      ]} 
      onPress={toggleTheme}
    >
      <Ionicons 
        name={isDarkMode ? 'sunny-outline' : 'moon-outline'} 
        size={20} 
        color={isDarkMode ? colors.primary : colors.primary} 
      />
      <Text 
        style={[
          styles.text, 
          { color: colors.text.primary }
        ]}
      >
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 10,
  },
  text: {
    marginLeft: 8,
    fontSize: 16,
  },
}); 