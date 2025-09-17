import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { StyleProp } from 'react-native';
import { Colors } from '../../src/constants/Colors';
import Layout from '../../src/components/layout/Layout';

// Props for the tab bar icon component from expo-router
interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

// Props for our custom TabBarIcon component
interface CustomTabBarIconProps {
  name: ComponentProps<typeof Ionicons>['name'];
  color: string;
  size: number;
  style?: StyleProp<TextStyle>;
}

function TabBarIcon({ name, color, size = 24, style }: CustomTabBarIconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Layout showFooter={false}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: 'transparent',
            borderTopWidth: 0,
            paddingBottom: 8,
            paddingTop: 8,
            height: 65,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -3,
            },
            shadowOpacity: 0.05,
            shadowRadius: 5,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 2,
            marginTop: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <TabBarIcon name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="analyze"
          options={{
            title: 'Analyze',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <TabBarIcon name="search" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: 'Learn',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <TabBarIcon name="book" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <TabBarIcon name="compass" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </Layout>
  );
}
