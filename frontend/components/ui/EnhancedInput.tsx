import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { useTheme } from '@react-navigation/native';

interface EnhancedInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  multiline?: boolean;
}

export function EnhancedInput({ 
  onSubmit, 
  isLoading = false, 
  placeholder = "Enter text or paste link to fact-check...",
  multiline = false 
}: EnhancedInputProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setText(text);
        Alert.alert('Pasted!', 'The text has been pasted from your clipboard.');
      } else {
        Alert.alert('Clipboard is empty', 'There is no text to paste.');
      }
    } catch (err) {
      console.warn('Clipboard error:', err);
      Alert.alert('Error', 'Could not access clipboard');
    }
  };

  const handleCopy = async () => {
    if (text.trim()) {
      try {
        Alert.alert('Copy', 'Text has been selected. Use the standard copy gesture to copy.');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        console.log('Copy not available');
      }
    }
  };

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSubmit(text.trim());
      Keyboard.dismiss();
    }
  };

  const handleClear = () => {
    setText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.card,
        borderTopColor: colors.border
      }
    ]}>
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: colors.background,
          borderColor: isFocused ? colors.primary : colors.border
        }
      ]}>
        {/* Copy/Paste Icon */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handlePaste}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="clipboard-outline" 
            size={20} 
            color={isLoading ? '#ccc' : colors.text + '80'} 
          />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.multilineInput,
            { color: colors.text }
          ]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.text + '60'}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!isLoading}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          blurOnSubmit={!multiline}
        />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {text.length > 0 && (
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
          
          {text.length > 0 && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCopy}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="copy-outline" 
                size={20} 
                color={isLoading ? '#ccc' : colors.text + '80'} 
              />
            </TouchableOpacity>
          )}

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: (text.trim() && !isLoading) ? colors.primary : colors.border,
                opacity: isLoading ? 0.6 : 1
              }
            ]}
            onPress={handleSubmit}
            disabled={!text.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={[styles.loadingDot, styles.loadingDot1]} />
                <View style={[styles.loadingDot, styles.loadingDot2]} />
                <View style={[styles.loadingDot, styles.loadingDot3]} />
              </View>
            ) : (
              <Ionicons name="arrow-forward" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Export the EnhancedInput component
export default EnhancedInput;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 -2px 4px rgba(0,0,0,0.05)',
    } : {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 5,
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 44,
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: 8,
    paddingHorizontal: 8,
    maxHeight: 100,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 60,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    marginHorizontal: 1,
  },
  loadingDot1: {
    // Animation would be handled with Animated API
  },
  loadingDot2: {
    // Animation would be handled with Animated API
  },
  loadingDot3: {
    // Animation would be handled with Animated API
  },
});