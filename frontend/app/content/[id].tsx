import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { api, EducationalContent } from '@/services/api';

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<EducationalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.getContentById(String(id));
        if (active) setItem(data);
      } catch (e: any) {
        if (active) setError(e?.message || 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.center}>
        <ThemedText>{error || 'Not found'}</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{item.title}</ThemedText>
        <ThemedText>
          {item.category} • {item.difficulty}
        </ThemedText>
      </ThemedView>
      <ThemedText style={styles.content}>{item.content}</ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
    gap: 6,
  },
  content: {
    lineHeight: 22,
    fontSize: 16,
  },
});


