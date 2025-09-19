import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { VerificationResults } from '../../components/ui/VerificationResults';
import api from '../../services/apiClient';

interface FactCheckResult {
  response: string;
  sources: string[];
}

interface VerificationResult {
  claim: string;
  verdict: {
    status: 'supported' | 'refuted' | 'insufficient' | 'conflicting';
    percentage: number;
    color: string;
  };
  sources: {
    id: string;
    title: string;
    url: string;
    domain: string;
    isReliable: boolean;
  }[];
  processedAnswer: string;
  summary: {
    supported: number;
    refuted: number;
    insufficient: number;
    conflicting: number;
  };
  claimsAnalyzed: number;
}

export default function AnalyzeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [detailedResult, setDetailedResult] = useState<VerificationResult | null>(null);

  function transformToDetailedResult(factCheckResult: FactCheckResult): VerificationResult {
    const isSupported = factCheckResult.response.toLowerCase().includes('true') ||
                       factCheckResult.response.toLowerCase().includes('supported') ||
                       factCheckResult.response.toLowerCase().includes('accurate');
    const isRefuted = factCheckResult.response.toLowerCase().includes('false') ||
                     factCheckResult.response.toLowerCase().includes('refuted') ||
                     factCheckResult.response.toLowerCase().includes('inaccurate');

    let status: 'supported' | 'refuted' | 'insufficient' | 'conflicting' = 'insufficient';
    let percentage = 50;
    let color = '#9C27B0';

    if (isSupported) {
      status = 'supported';
      percentage = 85;
      color = '#00C851';
    } else if (isRefuted) {
      status = 'refuted';
      percentage = 85;
      color = '#FF4444';
    }

    return {
      claim: text,
      verdict: {
        status,
        percentage,
        color
      },
      sources: factCheckResult.sources.map((source, index) => ({
        id: `source-${index}`,
        title: source,
        url: `https://${source}`,
        domain: source,
        isReliable: true
      })),
      processedAnswer: factCheckResult.response,
      summary: {
        supported: isSupported ? 1 : 0,
        refuted: isRefuted ? 1 : 0,
        insufficient: (!isSupported && !isRefuted) ? 1 : 0,
        conflicting: 0
      },
      claimsAnalyzed: 1
    };
  }

  function onResultCardPress() {
    if (result) {
      const detailedData = transformToDetailedResult(result);
      setDetailedResult(detailedData);
      setShowDetailedResults(true);
    }
  }

  async function onAnalyze() {
    setError(null);
    setResult(null);
    if (!text.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }
    setLoading(true);
    setCheckingStatus(true);
    try {
      // Start the fact-checking process
      const startResponse = await api.startFactCheck(text, 'fact');

      if (startResponse && startResponse.status === 'started') {
        // Poll for results
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

          const status = await api.getStatus();

          if (status.status === 'completed') {
            // Get the final results
            const factCheckResult = await api.getFactCheckResult();
            setResult(factCheckResult);
            break;
          } else if (status.status === 'idle') {
            setError('Fact-checking process stopped unexpectedly.');
            break;
          }

          attempts++;
        }

        if (attempts >= maxAttempts) {
          setError('Fact-checking timed out. Please try again.');
        }
      } else {
        setError('Failed to start fact-checking process.');
      }
    } catch (e) {
      const error = e as Error;
      console.error('Analysis error:', error);
      setError(error.message || 'An error occurred while analyzing the text.');
    } finally {
      setLoading(false);
      setCheckingStatus(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.mainContainer, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: 8, paddingBottom: 85 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
          <TouchableOpacity
            style={[styles.resultCard, { backgroundColor: colors.card }]}
            onPress={onResultCardPress}
            activeOpacity={0.8}
          >
            <View style={[styles.resultHeader, {
              backgroundColor: result.response.includes('True') ? '#10B981' + '20' : '#EF4444' + '20'
            }]}>
              <Ionicons
                name={result.response.includes('True') ? 'checkmark-circle' : 'warning'}
                size={24}
                color={result.response.includes('True') ? '#10B981' : '#EF4444'}
              />
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                Analysis Complete
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text + '60'}
                style={{ marginLeft: 'auto' }}
              />
            </View>
            <Text style={[styles.resultExplanation, { color: colors.text }]}>
              {result.response}
            </Text>
            {result.sources && result.sources.length > 0 && (
              <View style={styles.sourcesContainer}>
                <Text style={[styles.sourcesTitle, { color: colors.text }]}>Sources:</Text>
                {result.sources.map((source, index) => (
                  <Text key={index} style={[styles.sourceItem, { color: colors.primary }]}>
                    • {source}
                  </Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      {detailedResult && (
        <VerificationResults
          result={detailedResult}
          visible={showDetailedResults}
          onClose={() => setShowDetailedResults(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
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


