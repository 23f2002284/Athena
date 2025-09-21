import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../services/apiClient';

interface HomeHeaderProps {
  onNotificationPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ onNotificationPress }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadExtension = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web platform, use the new auto-installer
        Alert.alert(
          'Install Athena Extension',
          '🚀 Install the Athena browser extension with one click!\n\n' +
          '✨ Features:\n' +
          '• Real-time fact-checking on any website\n' +
          '• Right-click context menu integration\n' +
          '• Keyboard shortcuts (Ctrl+Shift+F)\n' +
          '• Page content analysis\n' +
          '• Source verification with confidence scores\n' +
          '• Privacy-focused design',
          [
            {
              text: 'Auto Install 🚀',
              onPress: () => {
                try {
                  // Create an HTML installer page with embedded instructions
                  const installerHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Athena Extension Auto-Installer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 10px;
        }
        .install-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px 5px;
        }
        .install-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .steps {
            counter-reset: step-counter;
        }
        .step {
            margin: 20px 0;
            padding-left: 40px;
            position: relative;
            counter-increment: step-counter;
        }
        .step::before {
            content: counter(step-counter);
            position: absolute;
            left: 0;
            top: 0;
            background: #667eea;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔍</div>
            <div class="title">Athena Extension Installer</div>
            <div class="subtitle">One-click browser extension installation</div>
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <button class="install-btn" onclick="downloadExtension()">
                📦 Download Extension
            </button>
        </div>

        <div class="steps">
            <div class="step">Click the download button above to get the extension ZIP file</div>
            <div class="step">Extract the ZIP file to a folder on your computer</div>
            <div class="step">Open Chrome → Extensions (chrome://extensions/)</div>
            <div class="step">Enable "Developer mode" (top right toggle)</div>
            <div class="step">Click "Load unpacked" and select the extracted folder</div>
            <div class="step">Pin Athena to your toolbar and start fact-checking!</div>
        </div>
    </div>

    <script>
        function downloadExtension() {
            const apiUrl = '${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/download-extension';
            const link = document.createElement('a');
            link.href = apiUrl;
            link.download = 'athena-extension.zip';
            link.click();
        }
    </script>
</body>
</html>`;

                  // Open the installer in a new window
                  const newWindow = window.open('', '_blank');
                  if (newWindow) {
                    newWindow.document.write(installerHTML);
                    newWindow.document.close();
                  } else {
                    Alert.alert(
                      'Popup Blocked',
                      'Please allow popups for this site and try again.'
                    );
                  }
                } catch (error) {
                  console.error('Error opening auto-installer:', error);
                  Alert.alert(
                    'Error',
                    'Unable to open auto-installer. Please try the manual download option.'
                  );
                }
              }
            },
            {
              text: 'Manual Download 📦',
              onPress: async () => {
                setIsDownloading(true);
                try {
                  console.log('Starting manual extension download...');

                  // Use the API client to download the extension
                  const blob = await api.downloadExtension();

                  // Create a URL for the blob
                  const url = window.URL.createObjectURL(blob);

                  // Create a temporary anchor to trigger download
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'athena-browser-extension.zip';
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  // Clean up the URL object
                  window.URL.revokeObjectURL(url);

                  console.log('Extension download initiated successfully');

                  // Show installation instructions
                  setTimeout(() => {
                    Alert.alert(
                      'Manual Installation Guide',
                      '📦 Download started!\n\n' +
                      'Installation Steps:\n' +
                      '1. Extract the downloaded ZIP file\n' +
                      '2. Open Chrome → Extensions (chrome://extensions/)\n' +
                      '3. Enable "Developer mode" (top right toggle)\n' +
                      '4. Click "Load unpacked" and select the extracted folder\n' +
                      '5. Pin Athena to your toolbar\n\n' +
                      '🚀 Start fact-checking on any website!',
                      [{ text: 'Got it!' }]
                    );
                  }, 500);

                } catch (downloadError) {
                  console.error('Download failed:', downloadError);

                  const error = downloadError as Error;
                  let errorMessage = 'Download failed. ';

                  if (error.message?.includes('Network')) {
                    errorMessage += 'Please check your internet connection.';
                  } else if (error.message?.includes('timeout')) {
                    errorMessage += 'Server timeout. Please try again.';
                  } else {
                    errorMessage += 'Server may be temporarily unavailable.';
                  }

                  Alert.alert(
                    'Download Error',
                    errorMessage + '\n\n' +
                    'Alternative options:\n' +
                    '• Try the Auto Install option\n' +
                    '• Visit: ' + `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/install`,
                    [
                      {
                        text: 'Try Auto Install',
                        onPress: () => {
                          const installerUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/install`;
                          window.open(installerUrl, '_blank');
                        }
                      },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                } finally {
                  setIsDownloading(false);
                }
              }
            },
            {
              text: 'Learn More ℹ️',
              onPress: () => {
                Alert.alert(
                  'Athena Browser Extension',
                  '🔍 Powerful Features:\n\n' +
                  '• Instant fact-checking on any website\n' +
                  '• Right-click context menu integration\n' +
                  '• Keyboard shortcuts for quick access\n' +
                  '• Automatic page content analysis\n' +
                  '• Source verification with confidence scores\n' +
                  '• Fact-check history and export\n' +
                  '• Offline functionality after installation\n\n' +
                  '🔒 Privacy & Security:\n' +
                  '• No data collection or tracking\n' +
                  '• All processing on your server\n' +
                  '• Open source and transparent\n' +
                  '• Secure, encrypted communication\n\n' +
                  '💻 Browser Support:\n' +
                  '• Chrome, Edge, Brave browsers\n' +
                  '• Works on all websites\n' +
                  '• Cross-platform compatibility',
                  [
                    {
                      text: 'Install Now',
                      onPress: () => {
                        const installerUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/install`;
                        window.open(installerUrl, '_blank');
                      }
                    }
                  ]
                );
              }
            },
            { text: 'Maybe Later', style: 'cancel' }
          ]
        );
      } else {
        // For mobile platforms, show appropriate message
        Alert.alert(
          'Desktop Extension Available',
          '🖥️ The Athena browser extension is designed for desktop browsers.\n\n' +
          '📱 On mobile, you can:\n' +
          '• Use this app for fact-checking\n' +
          '• Copy/paste content to verify\n' +
          '• Access the same AI-powered analysis\n' +
          '• View detailed source verification\n\n' +
          '💻 To get the browser extension:\n' +
          'Visit this app on your computer for one-click installation.',
          [{ text: 'Understood' }]
        );
      }
    } catch (error) {
      console.error('Extension installation error:', error);
      setIsDownloading(false);
      Alert.alert(
        'Error',
        'Unable to start installation. Please ensure the backend server is running and try again.',
        [
          {
            text: 'Try Direct Link',
            onPress: () => {
              const installerUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/install`;
              window.open(installerUrl, '_blank');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
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
              style={[
                styles.downloadButton,
                { backgroundColor: colors.card },
                isDownloading && { opacity: 0.6 }
              ]}
              onPress={handleDownloadExtension}
              onPressIn={() => !isDownloading && setShowTooltip(true)}
              onPressOut={() => setShowTooltip(false)}
              activeOpacity={0.7}
              disabled={isDownloading}
            >
              <Ionicons
                name={isDownloading ? "hourglass" : "download"}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
            {showTooltip && !isDownloading && (
              <View style={[styles.tooltip, { backgroundColor: colors.text }]}>
                <Text style={[styles.tooltipText, { color: colors.background }]}>
                  Install Extension
                </Text>
              </View>
            )}
            {isDownloading && (
              <View style={[styles.tooltip, { backgroundColor: colors.primary }]}>
                <Text style={[styles.tooltipText, { color: colors.background }]}>
                  Processing...
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