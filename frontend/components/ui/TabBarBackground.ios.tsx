import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

// Simple implementation that returns a default height
// This avoids the module system issues while providing basic functionality
export function useBottomTabOverflow(): number {
  // Return a default tab bar height (typical iOS tab bar height)
  return 49; // Default iOS tab bar height in points
}

export default function BlurTabBarBackground() {
  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint="systemChromeMaterial"
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}
