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
    padding: 16,
    paddingTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  examplesContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
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
