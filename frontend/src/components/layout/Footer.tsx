import React from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

type FooterLink = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: `/${string}`;
};

const footerLinks: FooterLink[] = [
  { name: 'Home', icon: 'home', href: '/(tabs)/' },
  { name: 'Analyze', icon: 'search', href: '/(tabs)/analyze' },
  { name: 'Learn', icon: 'book', href: '/(tabs)/learn' },
  { name: 'Profile', icon: 'person', href: '/(tabs)/profile' },
];

export function Footer() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.tabIconDefault }]}>
      {footerLinks.map((link) => (
        <TouchableOpacity 
          key={link.name} 
          onPress={() => router.push(link.href as any)}
          style={styles.footerLink}
        >
          <Ionicons 
            name={link.icon} 
            size={24} 
            color={pathname?.startsWith(link.href) ? colors.tint : colors.tabIconDefault} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerLink: {
    alignItems: 'center',
    padding: 8,
    flex: 1,
  },
});
