import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@components/ThemedText';
import { ThemedView } from '@components/ThemedView';
import api from '@services/api-client';

interface FactCheckResponse {
  // Define the structure based on your API response
  // These are example fields - adjust according to your actual API response
  id?: string;
  title?: string;
  description?: string;
  result?: {
    verdict: string;
    confidence: number;
    explanation: string;
  };
  sources?: Array<{
    url: string;
    title: string;
    isReliable: boolean;
  }>;
  [key: string]: any; // For any additional properties
}

export default function AnalyzeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FactCheckResponse | null>(null);

  async function onAnalyze() {
    setError(null);
    setResult(null);
    if (!text.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.startFactCheck(text);
      if (response) {
        setResult(response);
      } else {
        setError('No response received from the server.');
      }
    } catch (e) {
      const error = e as Error;
      setError(error.message || 'An error occurred while analyzing the text.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.mainContainer, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="analytics" size={32} color={colors.primary} />
          </View>
          <ThemedText type="title" style={[styles.title, { color: colors.text }]}>Analyze Text</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.text + '80' }]}>Submit text to check for misinformation signals using AI-powered analysis</ThemedText>
        </View>
        <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
            placeholder="Paste or type text here..."
            placeholderTextColor={colors.text + '60'}
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
          {text.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setText('')}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.text + '60'} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            { backgroundColor: loading || !text.trim() ? colors.primary + '40' : colors.primary }
          ]}
          onPress={onAnalyze}
          disabled={loading || !text.trim()}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.buttonText}>Analyze Text</Text>
            </>
          )}
        </TouchableOpacity>
        {error ? (
          <View style={[styles.errorCard, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <ThemedText style={styles.error}>{error}</ThemedText>
          </View>
        ) : null}
        {result ? (
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <View style={[styles.resultHeader, {
              backgroundColor: result.result?.verdict === 'accurate' ? '#10B981' + '20' : '#EF4444' + '20'
            }]}>
              <Ionicons
                name={result.result?.verdict === 'accurate' ? 'checkmark-circle' : 'warning'}
                size={24}
                color={result.result?.verdict === 'accurate' ? '#10B981' : '#EF4444'}
              />
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                {result.result?.verdict || 'Analysis Complete'}
              </Text>
            </View>
            {result.result?.confidence && (
              <Text style={[styles.resultConfidence, { color: colors.text + '80' }]}>
                Confidence: {(result.result.confidence * 100).toFixed(0)}%
              </Text>
            )}
            {result.result?.explanation && (
              <Text style={[styles.resultExplanation, { color: colors.text }]}>
                {result.result.explanation}
              </Text>
            )}
            {result.sources && result.sources.length > 0 && (
              <View style={styles.sourcesContainer}>
                <Text style={[styles.sourcesTitle, { color: colors.text }]}>Sources:</Text>
                {result.sources.map((source, index) => (
                  <Text key={index} style={[styles.sourceItem, { color: colors.primary }]}>
                    • {source.title}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  headerCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputCard: {
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    minHeight: 160,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  error: {
    color: '#DC2626',
    flex: 1,
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  resultConfidence: {
    fontSize: 13,
    marginBottom: 8,
  },
  resultExplanation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sourceItem: {
    fontSize: 13,
    marginBottom: 4,
  },
});


