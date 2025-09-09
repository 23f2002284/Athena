import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Button, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { api } from '@/services/api';
import { ResultCard } from '@/components/ResultCard';

export default function AnalyzeScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.analyze>> | null>(null);

  async function onAnalyze() {
    setError(null);
    setResult(null);
    if (!text.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.analyze({ text });
      setResult(res);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.header}>
          <ThemedText type="title">Analyze Text</ThemedText>
          <ThemedText>Submit text to check for misinformation signals.</ThemedText>
        </ThemedView>
        <TextInput
          style={styles.input}
          placeholder="Paste or type text here..."
          multiline
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />
        <View style={styles.actions}>
          <Button title={loading ? 'Analyzing…' : 'Analyze'} onPress={onAnalyze} disabled={loading} />
        </View>
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {result ? <ResultCard result={result} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
    gap: 6,
  },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  actions: {
    marginTop: 12,
    marginBottom: 4,
  },
  error: {
    color: '#b91c1c',
    marginTop: 8,
  },
});


