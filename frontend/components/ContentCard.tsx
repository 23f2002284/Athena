import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { EducationalContent } from '@/services/api';

type Props = {
  item: EducationalContent;
  onPress?: () => void;
};

export function ContentCard({ item, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }] }>
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.badge}>{item.difficulty}</Text>
      </View>
      <Text style={styles.meta}>{item.category}</Text>
      <View style={styles.tags}>
        {item.tags?.slice(0, 3).map((t) => (
          <Text style={styles.tag} key={t}>#{t}</Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    paddingRight: 12,
  },
  badge: {
    fontSize: 12,
    color: '#111827',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    textTransform: 'capitalize',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    fontSize: 12,
    color: '#374151',
  },
});


