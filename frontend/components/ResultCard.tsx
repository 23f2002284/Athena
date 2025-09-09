import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import type { AnalysisResponse } from '@/services/api';

type Props = {
  result: AnalysisResponse;
};

export function ResultCard({ result }: Props) {
  return (
    <View style={[styles.card, result.is_misinformation ? styles.warn : styles.ok]}>
      <Text style={styles.title}>
        {result.is_misinformation ? 'Potential Misinformation' : 'Likely Accurate'}
      </Text>
      <Text style={styles.confidence}>Confidence: {(result.confidence * 100).toFixed(1)}%</Text>
      <Text style={styles.explanation}>{result.explanation}</Text>
      {result.sources?.length ? (
        <View style={styles.sources}>
          {result.sources.map((s, idx) => (
            <Text
              key={`${s.url}-${idx}`}
              style={styles.link}
              onPress={() => Linking.openURL(s.url)}
            >
              • {s.title}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  ok: {
    backgroundColor: '#e7f8ef',
  },
  warn: {
    backgroundColor: '#fff2f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  confidence: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 20,
  },
  sources: {
    marginTop: 12,
  },
  link: {
    color: '#2563eb',
    marginTop: 4,
  },
});


