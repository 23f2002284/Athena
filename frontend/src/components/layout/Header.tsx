import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ViewStyle, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export type HeaderProps = {
  title?: string;
  showBackButton?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  style?: ViewStyle;
  titleStyle?: TextStyle;
  backgroundColor?: string;
  tintColor?: string;
};

export function Header({ 
  title = 'Athena', 
  showBackButton = false, 
  rightAction, 
  style, 
  titleStyle, 
  backgroundColor,
  tintColor
}: HeaderProps) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[colorScheme ?? 'light'];
  const headerBgColor = backgroundColor || colors.background;
  const iconColor = tintColor || colors.tint;

  return (
    <View style={[styles.header, { backgroundColor: headerBgColor }, style]}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
        )}
        <Text 
          style={[
            styles.title, 
            { color: colors.text },
            titleStyle
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>
      
      {rightAction && (
        <TouchableOpacity 
          onPress={rightAction.onPress} 
          style={[styles.rightAction, { padding: 8 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={rightAction.icon} 
            size={24} 
            color={iconColor} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    minHeight: 56,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  backButton: {
    marginRight: 12,
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  rightAction: {
    marginLeft: 'auto',
  },
});
