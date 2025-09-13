import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet } from 'react-native';
import { ThemedText } from '@components/ThemedText';
import api from '@services/api-client';
import type { FactCheckResponse } from '@services/api-client';

// Define the EducationalContent type based on your API response
interface EducationalContent {
  id: string;
  title: string;
  description: string;
  // Add other properties as needed
}
import { ContentCard } from '@components/ContentCard';
import { Link } from 'expo-router';

export default function LearnScreen() {
  const [items, setItems] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Using getResults as an example - replace with the actual method you need
        const results = await api.getResults();
        if (active) {
          // Transform the results to match EducationalContent interface
          const content: EducationalContent[] = Object.entries(results).map(([id, result]) => ({
            id,
            title: result.title || `Content ${id}`,
            description: result.description || 'No description available',
            // Map other fields as needed
          }));
          setItems(content);
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
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}> 
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <ThemedText>{error}</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/content/[id]', params: { id: item.id } }} asChild>
            <ContentCard item={item} />
          </Link>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
  },
});


