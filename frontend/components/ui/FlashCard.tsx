import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

interface FlashCardData {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FlashCardProps {
  data: FlashCardData;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function FlashCard({
  data,
  onNext,
  onPrevious,
  isFirst = false,
  isLast = false
}: FlashCardProps) {
  const { colors } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const handleNext = () => {
    if (onNext && !isLast) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsFlipped(false);
      flipAnimation.setValue(0);
      onNext();
    }
  };

  const handlePrevious = () => {
    if (onPrevious && !isFirst) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsFlipped(false);
      flipAnimation.setValue(0);
      onPrevious();
    }
  };

  return (
    <View style={styles.container}>
      {/* Category Badge */}
      {data.category && (
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {data.category}
          </Text>
        </View>
      )}

      {/* Card */}
      <TouchableOpacity
        style={[styles.cardContainer, { backgroundColor: colors.card }]}
        onPress={handleFlip}
        activeOpacity={0.9}
      >
        {/* Front Side (Question) */}
        <Animated.View
          style={[
            styles.cardSide,
            styles.frontCard,
            {
              transform: [{ rotateY: frontInterpolate }],
              opacity: isFlipped ? 0 : 1,
            }
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <Text style={[styles.cardLabel, { color: colors.primary }]}>Question</Text>
          </View>

          <Text style={[styles.cardText, { color: colors.text }]}>
            {data.question}
          </Text>

          <View style={styles.flipHint}>
            <Ionicons name="sync-outline" size={16} color={colors.text + '60'} />
            <Text style={[styles.flipHintText, { color: colors.text + '60' }]}>
              Tap to flip
            </Text>
          </View>
        </Animated.View>

        {/* Back Side (Answer) */}
        <Animated.View
          style={[
            styles.cardSide,
            styles.backCard,
            {
              transform: [{ rotateY: backInterpolate }],
              opacity: isFlipped ? 1 : 0,
            }
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.notification} />
            <Text style={[styles.cardLabel, { color: colors.notification }]}>Answer</Text>
          </View>

          <Text style={[styles.cardText, { color: colors.text }]}>
            {data.answer}
          </Text>

          <View style={styles.flipHint}>
            <Ionicons name="sync-outline" size={16} color={colors.text + '60'} />
            <Text style={[styles.flipHintText, { color: colors.text + '60' }]}>
              Tap to flip back
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Navigation Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: !isFirst ? colors.card : colors.border,
              opacity: !isFirst ? 1 : 0.5,
            }
          ]}
          onPress={handlePrevious}
          disabled={isFirst}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={!isFirst ? colors.text : colors.text + '40'}
          />
        </TouchableOpacity>

        <View style={styles.cardInfo}>
          <Ionicons name="layers-outline" size={16} color={colors.text + '60'} />
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: !isLast ? colors.card : colors.border,
              opacity: !isLast ? 1 : 0.5,
            }
          ]}
          onPress={handleNext}
          disabled={isLast}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={!isLast ? colors.text : colors.text + '40'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  categoryBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContainer: {
    height: 280,
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardSide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
  },
  frontCard: {
    // Front side styling
  },
  backCard: {
    transform: [{ rotateY: '180deg' }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardText: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  flipHintText: {
    fontSize: 12,
    marginLeft: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    alignItems: 'center',
  },
});

export default FlashCard;