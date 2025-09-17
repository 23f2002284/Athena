import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  LayoutAnimation
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

interface DropdownItem {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

interface DropdownSectionProps {
  title: string;
  items: DropdownItem[];
  icon?: string;
  initialExpanded?: boolean;
}

export function DropdownSection({
  title,
  items,
  icon = "information-circle-outline",
  initialExpanded = false
}: DropdownSectionProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(initialExpanded);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleSection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  const toggleItem = (itemId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Section Header */}
      <TouchableOpacity
        style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
        onPress={toggleSection}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitleContainer}>
          <Ionicons
            name={icon as any}
            size={24}
            color={colors.primary}
            style={styles.sectionIcon}
          />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title}
          </Text>
          <View style={[styles.itemCount, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.itemCountText, { color: colors.primary }]}>
              {items.length}
            </Text>
          </View>
        </View>

        <Animated.View
          style={{
            transform: [{ rotate: expanded ? '180deg' : '0deg' }]
          }}
        >
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.text + '60'}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Section Content */}
      {expanded && (
        <View style={styles.sectionContent}>
          {items.map((item, index) => (
            <View key={item.id} style={styles.itemContainer}>
              <TouchableOpacity
                style={[
                  styles.itemHeader,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: index < items.length - 1 ? 0.5 : 0
                  }
                ]}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.itemTitleContainer}>
                  {item.icon && (
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={colors.primary}
                      style={styles.itemIcon}
                    />
                  )}
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                </View>

                <Animated.View
                  style={{
                    transform: [{
                      rotate: expandedItems.has(item.id) ? '180deg' : '0deg'
                    }]
                  }}
                >
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.text + '60'}
                  />
                </Animated.View>
              </TouchableOpacity>

              {expandedItems.has(item.id) && (
                <View style={[styles.itemContent, { backgroundColor: colors.background }]}>
                  <Text style={[styles.itemText, { color: colors.text }]}>
                    {item.content}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  itemCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 8,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionContent: {
    paddingBottom: 8,
  },
  itemContainer: {
    // Container for each dropdown item
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  itemContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default DropdownSection;