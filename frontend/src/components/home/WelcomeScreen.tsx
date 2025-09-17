import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface WelcomeScreenProps {
  onExamplePress: (example: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onExamplePress }) => {
  const { colors } = useTheme();

  const examples = [
    "Is it true that chocolate is good for your heart?",
    "Did scientists prove that 5G causes COVID-19?",
    "Has a new study found that coffee prevents cancer?"
  ];

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
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to Athena
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
          Your AI-powered fact-checking assistant. Enter any news headline or claim below to verify its authenticity.
        </Text>
        
        <View style={styles.examplesContainer}>
          <Text style={[styles.examplesTitle, { color: colors.text }]}>
            Try an example:
          </Text>
          
          {examples.map((example, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.exampleButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.primary + '40',
                }
              ]}
              onPress={() => onExamplePress(example)}
              activeOpacity={0.8}
            >
              <View style={styles.exampleContent}>
                <Text style={styles.exampleIcon}>💡</Text>
                <Text style={[styles.exampleText, { color: colors.text }]}>
                  {example}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browser Extension Section */}
        <View style={styles.extensionSection}>
          <View style={[styles.extensionCard, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}>
            <View style={styles.extensionHeader}>
              <View style={[styles.extensionIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="extension-puzzle" size={24} color={colors.primary} />
              </View>
              <View style={styles.extensionInfo}>
                <Text style={[styles.extensionTitle, { color: colors.text }]}>
                  Browser Extension
                </Text>
                <Text style={[styles.extensionSubtitle, { color: colors.text, opacity: 0.7 }]}>
                  Fact-check on any website
                </Text>
              </View>
            </View>

            <Text style={[styles.extensionDescription, { color: colors.text, opacity: 0.8 }]}>
              Install our browser extension to verify information anywhere on the web. Works with Chrome, Edge, and Brave.
            </Text>

            <View style={styles.extensionFeatures}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={[styles.featureText, { color: colors.text, opacity: 0.7 }]}>
                  Select text to verify
                </Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🔍</Text>
                <Text style={[styles.featureText, { color: colors.text, opacity: 0.7 }]}>
                  Right-click fact-check
                </Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🌐</Text>
                <Text style={[styles.featureText, { color: colors.text, opacity: 0.7 }]}>
                  Works on all websites
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: colors.primary }]}
              onPress={handleDownloadExtension}
              activeOpacity={0.8}
            >
              <Ionicons name="download" size={18} color="white" />
              <Text style={styles.downloadButtonText}>
                Get Extension
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.text, opacity: 0.6 }]}>
          Powered by Athena - Your trusted fact-checking assistant
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  examplesContainer: {
    width: '100%',
    marginTop: 24,
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  exampleButton: {
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  exampleContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  exampleIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  exampleText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    flex: 1,
  },
  extensionSection: {
    width: '100%',
    marginTop: 32,
    marginBottom: 24,
  },
  extensionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  extensionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  extensionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  extensionInfo: {
    flex: 1,
  },
  extensionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  extensionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  extensionDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  extensionFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
