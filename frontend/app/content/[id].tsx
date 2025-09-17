import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@components/ThemedText';
import { ThemedView } from '@components/ThemedView';
import api from '@services/api-client';

interface ApiContent {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  difficulty?: string;
  [key: string]: any; // For any additional properties
}

// Define the EducationalContent type based on your API response
interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content: string;
  category?: string;
  difficulty?: string;
  // Add other properties as needed
}

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<EducationalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Using getResults as an example - replace with the actual method you need
        const results = await api.getResults();
        if (active) {
          // Find the specific content by ID
          const content = Object.entries<ApiContent>(results as Record<string, ApiContent>)
            .find(([itemId]) => itemId === id)?.[1];
          
          if (content) {
            setItem({
              id,
              title: content?.title || `Content ${id}`,
              description: content?.description || 'No description available',
              content: content?.content || 'No content available',
              category: content?.category,
              difficulty: content?.difficulty,
            });
          } else {
            setError('Content not found');
          }
        }
      } catch (e: any) {
        if (active) setError(e?.message || 'Failed to load content');
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
        {(item.category || item.difficulty) && (
          <ThemedText>
            {item.category && <>{item.category}{item.difficulty ? ' • ' : ''}</>}
            {item.difficulty}
          </ThemedText>
        )}
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


