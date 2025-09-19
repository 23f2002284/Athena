import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NewsCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
}

interface TrendingTopic {
  id: string;
  title: string;
  count: string;
  trend: 'up' | 'down' | 'stable';
}

export default function ExploreScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories: NewsCategory[] = [
    { id: '1', title: 'Politics', icon: 'flag', color: '#3B82F6', description: 'Political news and analysis' },
    { id: '2', title: 'Health', icon: 'fitness', color: '#10B981', description: 'Health and medical information' },
    { id: '3', title: 'Technology', icon: 'hardware-chip', color: '#8B5CF6', description: 'Tech news and innovation' },
    { id: '4', title: 'Science', icon: 'flask', color: '#F59E0B', description: 'Scientific discoveries' },
    { id: '5', title: 'Business', icon: 'trending-up', color: '#EF4444', description: 'Business and finance news' },
    { id: '6', title: 'Environment', icon: 'earth', color: '#06B6D4', description: 'Climate and environment' },
  ];

  const trendingTopics: TrendingTopic[] = [
    { id: '1', title: 'Climate Change Summit 2024', count: '15.2K', trend: 'up' },
    { id: '2', title: 'AI Safety Regulations', count: '9.8K', trend: 'up' },
    { id: '3', title: 'Global Economic Outlook', count: '7.3K', trend: 'down' },
    { id: '4', title: 'Space Exploration Updates', count: '5.1K', trend: 'stable' },
  ];

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleTopicPress = (topic: string) => {
    // Navigate to search with this topic
    console.log('Searching for:', topic);
  };

  const handleResourcePress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="compass" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Explore Topics</Text>
          <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
            Discover trending news topics and fact-check resources
          </Text>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedCategory === category.id ? category.color : 'transparent',
                    borderWidth: selectedCategory === category.id ? 2 : 0,
                  }
                ]}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon as any} size={24} color={category.color} />
                </View>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>{category.title}</Text>
                <Text style={[styles.categoryDescription, { color: colors.text + '60' }]}>
                  {category.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending Topics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Topics</Text>
          {trendingTopics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[styles.topicCard, { backgroundColor: colors.card }]}
              onPress={() => handleTopicPress(topic.title)}
              activeOpacity={0.7}
            >
              <View style={styles.topicContent}>
                <Text style={[styles.topicTitle, { color: colors.text }]}>{topic.title}</Text>
                <View style={styles.topicStats}>
                  <Text style={[styles.topicCount, { color: colors.text + '80' }]}>
                    {topic.count} checks
                  </Text>
                  <Ionicons
                    name={
                      topic.trend === 'up' ? 'trending-up' :
                      topic.trend === 'down' ? 'trending-down' :
                      'remove'
                    }
                    size={16}
                    color={
                      topic.trend === 'up' ? '#10B981' :
                      topic.trend === 'down' ? '#EF4444' :
                      colors.text + '60'
                    }
                  />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text + '40'} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Fact-Checking Resources */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fact-Checking Resources</Text>
          <TouchableOpacity
            style={[styles.resourceCard, { backgroundColor: colors.card }]}
            onPress={() => handleResourcePress('https://www.snopes.com')}
            activeOpacity={0.7}
          >
            <Ionicons name="link" size={20} color={colors.primary} />
            <View style={styles.resourceContent}>
              <Text style={[styles.resourceTitle, { color: colors.text }]}>Snopes</Text>
              <Text style={[styles.resourceDescription, { color: colors.text + '60' }]}>
                The definitive fact-checking resource
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resourceCard, { backgroundColor: colors.card }]}
            onPress={() => handleResourcePress('https://www.factcheck.org')}
            activeOpacity={0.7}
          >
            <Ionicons name="link" size={20} color={colors.primary} />
            <View style={styles.resourceContent}>
              <Text style={[styles.resourceTitle, { color: colors.text }]}>FactCheck.org</Text>
              <Text style={[styles.resourceDescription, { color: colors.text + '60' }]}>
                A project of the Annenberg Public Policy Center
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 11,
    textAlign: 'center',
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicCount: {
    fontSize: 13,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  resourceDescription: {
    fontSize: 13,
  },
});
