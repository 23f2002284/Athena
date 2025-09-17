import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface NewsVerifierProps {
  onVerify: (message: string) => Promise<void>;
  isLoading: boolean;
}

export const NewsVerifier: React.FC<NewsVerifierProps> = ({ onVerify, isLoading }) => {
  const [message, setMessage] = useState('');
  const { colors } = useTheme();

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onVerify(message);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input, 
          { 
            color: colors.text, 
            backgroundColor: colors.background,
            borderColor: colors.border,
          }
        ]}
        placeholder="Enter news to verify..."
        placeholderTextColor={colors.text + '80'}
        value={message}
        onChangeText={setMessage}
        onSubmitEditing={handleSubmit}
        multiline
        editable={!isLoading}
      />
      <TouchableOpacity 
        style={[
          styles.button, 
          { 
            backgroundColor: isLoading || !message.trim() ? colors.border : colors.primary,
          }
        ]}
        onPress={handleSubmit}
        disabled={isLoading || !message.trim()}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons 
            name="send" 
            size={20} 
            color={isLoading || !message.trim() ? colors.text + '60' : '#fff'} 
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1.5,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
