import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  TextInputProps 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export interface SearchInputProps extends TextInputProps {
  onClear?: () => void;
  onSearch?: (text: string) => void;
  placeholder?: string;
}

/**
 * SearchInput component with search icon and clear button
 * 
 * @param {function} onClear - Callback function when clear button is pressed
 * @param {function} onSearch - Callback function when search is submitted
 * @param {string} placeholder - Placeholder text for the search input
 * @returns {React.ReactElement} A styled search input component
 * 
 * @example
 * // Basic usage
 * <SearchInput
 *   placeholder="Search items..."
 *   onSearch={handleSearch}
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 * />
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  onClear,
  onSearch,
  placeholder = 'Search...',
  value,
  onChangeText,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  
  // Local state to track when to show the clear button
  const [isFocused, setIsFocused] = useState(false);
  
  // Handle text clear
  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
    if (onClear) {
      onClear();
    }
  };
  
  // Handle search submission
  const handleSubmit = () => {
    if (onSearch && value) {
      onSearch(value);
    }
  };
  
  const showClearButton = !!value && value.length > 0;
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderColor: isFocused ? colors.primary : colors.border.light,
        },
        style,
      ]}
    >
      <Ionicons 
        name="search" 
        size={20} 
        color={colors.text.tertiary} 
        style={styles.searchIcon} 
      />
      
      <TextInput
        style={[
          styles.input,
          { color: colors.text.primary }
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never" // We'll handle clear manually for cross-platform
        {...rest}
      />
      
      {showClearButton && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Ionicons 
            name="close-circle" 
            size={18} 
            color={colors.text.tertiary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    height: '100%',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4, // Increase touch target
  },
});

export default SearchInput; 