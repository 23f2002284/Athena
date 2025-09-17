import React, { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Header, HeaderProps } from './Header';
import { Footer } from './Footer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type LayoutProps = {
  children: ReactNode;
  headerProps?: Omit<HeaderProps, 'title'> & { title?: string };
  showFooter?: boolean;
  scrollable?: boolean;
  style?: any;
  contentContainerStyle?: any;
};

function Layout({ 
  children, 
  headerProps, 
  showFooter = true, 
  scrollable = true,
  style,
  contentContainerStyle,
  ...rest 
}: LayoutProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];

  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable 
    ? { 
        style: [styles.scrollContainer, { backgroundColor: colors.background }, style],
        contentContainerStyle: [styles.scrollContent, contentContainerStyle],
        showsVerticalScrollIndicator: false,
        bounces: false,
        ...rest
      } 
    : { 
        style: [styles.container, { backgroundColor: colors.background }, style],
        ...rest 
      };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      {headerProps && <Header {...headerProps} />}
      
      <Container {...containerProps}>
        {children}
      </Container>
      
      {showFooter && <Footer />}
      
      {/* Add bottom padding to account for safe area */}
      <View style={{ height: insets.bottom, backgroundColor: colors.background }} />
    </View>
  );
}

export default Layout;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60, // Space for footer
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    paddingBottom: 60, // Space for footer
    paddingHorizontal: 16,
  },
});
