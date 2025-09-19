import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HomeHeaderProps {
  onNotificationPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ onNotificationPress }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleDownloadExtension = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web platform, actually download the extension
        Alert.alert(
          'Download Browser Extension',
          'Download the Athena browser extension to fact-check content on any website.\n\n' +
          '• Select text on any webpage\n' +
          '• Right-click for quick verification\n' +
          '• Seamless integration with Chrome, Edge, and Brave',
          [
            {
              text: 'Download Now',
              onPress: async () => {
                try {
                  // Create a temporary link to download the ZIP file
                  const downloadUrl = 'http://localhost:8000/api/download-extension';

                  // For web, create a temporary anchor to trigger download
                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.download = 'athena-browser-extension.zip';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  // Show installation instructions after download starts
                  setTimeout(() => {
                    Alert.alert(
                      'Installation Instructions',
                      '1. Extract the downloaded ZIP file\n' +
                      '2. Open Chrome → Extensions (chrome://extensions/)\n' +
                      '3. Enable "Developer mode" (top right)\n' +
                      '4. Click "Load unpacked" and select the extracted folder\n' +
                      '5. Start fact-checking on any website!\n\n' +
                      'The extension connects to this same backend for analysis.',
                      [{ text: 'Got it!' }]
                    );
                  }, 1000);
                } catch (downloadError) {
                  console.error('Download failed:', downloadError);
                  Alert.alert(
                    'Download Instructions',
                    'Automatic download failed. You can manually download by visiting:\n\n' +
                    'http://localhost:8000/api/download-extension\n\n' +
                    'Then follow the installation instructions.',
                    [{ text: 'OK' }]
                  );
                }
              }
            },
            { text: 'Maybe Later', style: 'cancel' }
          ]
        );
      } else {
        // For mobile platforms, show appropriate message
        Alert.alert(
          'Browser Extension',
          'The Athena browser extension is available for desktop browsers like Chrome, Edge, and Brave.\n\n' +
          'Visit this app on your computer to download the extension.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Extension download error:', error);
      Alert.alert('Error', 'Unable to initiate download at this time.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4, backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Athena</Text>
        </View>

        <View style={styles.rightButtons}>
          <View style={styles.tooltipContainer}>
            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: colors.card }]}
              onPress={handleDownloadExtension}
              onPressIn={() => setShowTooltip(true)}
              onPressOut={() => setShowTooltip(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="download" size={20} color={colors.primary} />
            </TouchableOpacity>
            {showTooltip && (
              <View style={[styles.tooltip, { backgroundColor: colors.text }]}>
                <Text style={[styles.tooltipText, { color: colors.background }]}>
                  Download Extension
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.card }]}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tooltipContainer: {
    position: 'relative',
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tooltip: {
    position: 'absolute',
    top: -35,
    left: -20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default HomeHeader;