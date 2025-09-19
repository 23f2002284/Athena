import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function SearchBar({
  onSearch,
  placeholder = "Search for learning topics...",
  isLoading = false
}: SearchBarProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = () => {
    if (query.trim() && !isLoading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.card,
        borderColor: isFocused ? colors.primary : colors.border
      }
    ]}>
      <Ionicons
        name="search-outline"
        size={20}
        color={isFocused ? colors.primary : colors.text + '60'}
        style={styles.searchIcon}
      />

      <TextInput
        style={[
          styles.textInput,
          { color: colors.text }
        ]}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={colors.text + '60'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        editable={!isLoading}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
      />

      {query.length > 0 && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleClear}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={isLoading ? '#ccc' : colors.text + '60'}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.searchButton,
          {
            backgroundColor: (query.trim() && !isLoading) ? colors.primary : colors.border,
            opacity: isLoading ? 0.6 : 1
          }
        ]}
        onPress={handleSearch}
        disabled={!query.trim() || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingDot, styles.loadingDot1]} />
            <View style={[styles.loadingDot, styles.loadingDot2]} />
            <View style={[styles.loadingDot, styles.loadingDot3]} />
          </View>
        ) : (
          <Ionicons name="search" size={18} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 16,
    marginBottom: 16,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'white',
    marginHorizontal: 1,
  },
  loadingDot1: {},
  loadingDot2: {},
  loadingDot3: {},
});

export default SearchBar;