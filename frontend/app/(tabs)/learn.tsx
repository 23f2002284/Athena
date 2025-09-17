import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@components/ThemedText';

// Import new components
import SearchBar from '../../components/ui/SearchBar';
import FlashCard from '../../components/ui/FlashCard';
import DropdownSection from '../../components/ui/DropdownSection';

// Define interfaces
interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content?: string;
  category?: string;
  difficulty?: string;
}

interface FlashCardData {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface DropdownItem {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

type LearnMode = 'overview' | 'flashcards' | 'search' | 'topics';

export default function LearnScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // State management
  const [currentMode, setCurrentMode] = useState<LearnMode>('overview');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<EducationalContent[]>([]);
  const [currentFlashCardIndex, setCurrentFlashCardIndex] = useState(0);

  // Mock data
  const flashCards: FlashCardData[] = [
    {
      id: '1',
      question: 'What are the main red flags to look for in potentially fake news articles?',
      answer: 'Look for: sensational headlines, missing author information, unusual URLs, poor grammar/spelling, lack of credible sources, and emotional rather than factual language.',
      category: 'Fake News Detection'
    },
    {
      id: '2',
      question: 'How can you verify information using multiple sources?',
      answer: 'Cross-reference information across 2-3 reputable, independent sources. Check original sources, look for expert quotes, and verify facts through established fact-checking websites.',
      category: 'Source Verification'
    },
    {
      id: '3',
      question: 'What is confirmation bias and how does it affect news consumption?',
      answer: 'Confirmation bias is the tendency to seek and interpret information that confirms existing beliefs. It can lead to consuming only news that aligns with your views, creating information bubbles.',
      category: 'Media Psychology'
    },
    {
      id: '4',
      question: 'What makes a news source credible?',
      answer: 'Credible sources have: established editorial standards, named authors with expertise, transparent corrections policy, clear distinction between news and opinion, and accountability measures.',
      category: 'Source Credibility'
    }
  ];

  const topicsData = [
    {
      title: 'Fake News Identification',
      icon: 'warning-outline',
      items: [
        {
          id: '1',
          title: 'Headlines and Clickbait',
          content: 'Learn to identify sensational headlines designed to provoke emotional responses rather than inform. Look for ALL CAPS, excessive punctuation, and vague claims like "You Won\'t Believe..." or "This Will Shock You."',
          icon: 'megaphone-outline'
        },
        {
          id: '2',
          title: 'Source Analysis',
          content: 'Check the URL, author information, and publication date. Fake news often comes from suspicious domains, lacks author credentials, or recycles old stories as current events.',
          icon: 'search-outline'
        },
        {
          id: '3',
          title: 'Visual Verification',
          content: 'Images and videos can be doctored or taken out of context. Use reverse image search tools and check if the visual content matches the story being told.',
          icon: 'image-outline'
        }
      ]
    },
    {
      title: 'Critical Thinking Skills',
      icon: 'bulb-outline',
      items: [
        {
          id: '4',
          title: 'Question Everything',
          content: 'Develop the habit of asking: Who benefits from this information? What evidence supports these claims? Are there alternative explanations?',
          icon: 'help-circle-outline'
        },
        {
          id: '5',
          title: 'Emotional vs. Logical Response',
          content: 'Strong emotional reactions to news can cloud judgment. Take time to process information logically before sharing or making decisions based on it.',
          icon: 'heart-outline'
        },
        {
          id: '6',
          title: 'Bias Recognition',
          content: 'Understand your own biases and how they affect information processing. Actively seek diverse perspectives and challenge your own assumptions.',
          icon: 'eye-outline'
        }
      ]
    },
    {
      title: 'Fact-Checking Tools',
      icon: 'checkmark-circle-outline',
      items: [
        {
          id: '7',
          title: 'Professional Fact-Checkers',
          content: 'Utilize established fact-checking organizations like Snopes, FactCheck.org, PolitiFact, and AP Fact Check for verified information.',
          icon: 'library-outline'
        },
        {
          id: '8',
          title: 'Browser Extensions',
          content: 'Install browser extensions like NewsGuard, Media Bias/Fact Check Extension, or InVID for real-time credibility assessments.',
          icon: 'browsers-outline'
        },
        {
          id: '9',
          title: 'Reverse Search Techniques',
          content: 'Use Google Reverse Image Search, TinEye, or Jeffrey\'s Image Metadata Viewer to verify the authenticity and origin of images.',
          icon: 'arrow-undo-outline'
        }
      ]
    }
  ];

  // Functions
  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      // Simulate API call - replace with real search functionality
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock search results based on query
      const mockResults: EducationalContent[] = [
        {
          id: 'search-1',
          title: `Understanding ${query}`,
          description: `Comprehensive guide about ${query} and its implications in media literacy.`,
          content: `This is detailed information about ${query}...`,
          category: 'Search Result'
        },
        {
          id: 'search-2',
          title: `How to Identify ${query}`,
          description: `Practical tips for recognizing and dealing with ${query} in digital media.`,
          content: `Learn practical strategies for ${query}...`,
          category: 'Search Result'
        }
      ];

      setSearchResults(mockResults);
      setCurrentMode('search');
    } catch (error) {
      Alert.alert('Search Error', 'Unable to search at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlashCardNext = () => {
    if (currentFlashCardIndex < flashCards.length - 1) {
      setCurrentFlashCardIndex(currentFlashCardIndex + 1);
    }
  };

  const handleFlashCardPrevious = () => {
    if (currentFlashCardIndex > 0) {
      setCurrentFlashCardIndex(currentFlashCardIndex - 1);
    }
  };

  const renderModeButtons = () => (
    <View style={styles.modeButtons}>
      {[
        { mode: 'overview', icon: 'grid-outline', label: 'Overview' },
        { mode: 'topics', icon: 'list-outline', label: 'Topics' },
        { mode: 'flashcards', icon: 'layers-outline', label: 'Flashcards' }
      ].map((item) => (
        <TouchableOpacity
          key={item.mode}
          style={[
            styles.modeButton,
            {
              backgroundColor: currentMode === item.mode ? colors.primary : colors.card,
            }
          ]}
          onPress={() => setCurrentMode(item.mode as LearnMode)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.icon as any}
            size={20}
            color={currentMode === item.mode ? 'white' : colors.text}
          />
          <Text
            style={[
              styles.modeButtonText,
              {
                color: currentMode === item.mode ? 'white' : colors.text
              }
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (currentMode) {
      case 'overview':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.overviewGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Ionicons name="book-outline" size={32} color={colors.primary} />
                <Text style={[styles.statNumber, { color: colors.text }]}>12</Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>Topics</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Ionicons name="layers-outline" size={32} color={colors.primary} />
                <Text style={[styles.statNumber, { color: colors.text }]}>{flashCards.length}</Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>Flash Cards</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => setCurrentMode('flashcards')}
              >
                <Ionicons name="play-outline" size={24} color="white" />
                <Text style={styles.actionButtonText}>Start Learning</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 'flashcards':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.flashCardProgress}>
              <Text style={[styles.progressText, { color: colors.text }]}>
                Card {currentFlashCardIndex + 1} of {flashCards.length}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${((currentFlashCardIndex + 1) / flashCards.length) * 100}%`
                    }
                  ]}
                />
              </View>
            </View>

            <FlashCard
              data={flashCards[currentFlashCardIndex]}
              onNext={handleFlashCardNext}
              onPrevious={handleFlashCardPrevious}
              isFirst={currentFlashCardIndex === 0}
              isLast={currentFlashCardIndex === flashCards.length - 1}
            />
          </ScrollView>
        );

      case 'topics':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {topicsData.map((section) => (
              <DropdownSection
                key={section.title}
                title={section.title}
                items={section.items}
                icon={section.icon}
              />
            ))}
          </ScrollView>
        );

      case 'search':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {searchResults.map((result) => (
              <View key={result.id} style={[styles.searchResultCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.searchResultTitle, { color: colors.text }]}>
                  {result.title}
                </Text>
                <Text style={[styles.searchResultDescription, { color: colors.text + '80' }]}>
                  {result.description}
                </Text>
                {result.category && (
                  <View style={[styles.categoryTag, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.categoryTagText, { color: colors.primary }]}>
                      {result.category}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {searchResults.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.text + '40'} />
                <Text style={[styles.emptyStateText, { color: colors.text + '60' }]}>
                  No search results yet. Use the search bar above to find learning resources.
                </Text>
              </View>
            )}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="school" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Learn & Improve</Text>
        <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
          Master media literacy skills
        </Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search for media literacy topics..."
        isLoading={loading}
      />

      {/* Mode Buttons */}
      {renderModeButtons()}

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
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
  },
  modeButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  overviewGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  flashCardProgress: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  searchResultCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchResultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchResultDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});


