import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface VerificationResult {
  isFake: boolean;
  confidence: number;
  explanation: string;
  sources?: string[];
}

interface MessageBubbleProps {
  text: string;
  isUser: boolean;
  verificationResult?: VerificationResult;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  isUser,
  verificationResult,
}) => {
  const { colors } = useTheme();

  const handleSourcePress = (url: string) => {
    // Add https:// if not present
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch(err =>
      console.error('Error opening URL:', err)
    );
  };

  if (isUser) {
    return (
      <View style={[styles.messageBubble, styles.userBubble, { backgroundColor: colors.primary }]}>
        <Text style={[styles.messageText, { color: '#fff' }]}>{text}</Text>
      </View>
    );
  }

  if (verificationResult) {
    return (
      <View style={[styles.messageBubble, styles.botBubble, { backgroundColor: colors.card }]}>
        <View style={styles.verificationHeader}>
          <Ionicons 
            name={verificationResult.isFake ? 'alert-circle' : 'checkmark-circle'}
            size={24}
            color={verificationResult.isFake ? '#ff3b30' : '#34c759'}
          />
          <Text style={[
            styles.verificationTitle,
            { color: verificationResult.isFake ? '#ff3b30' : '#34c759' }
          ]}>
            {verificationResult.isFake ? 'Potentially False' : 'Likely True'}
          </Text>
        </View>
        
        <Text style={[styles.confidenceText, { color: colors.text }]}>
          Confidence: {verificationResult.confidence}%
        </Text>
        
        <Text style={[styles.messageText, { color: colors.text, marginBottom: 12 }]}>
          {verificationResult.explanation}
        </Text>

        {verificationResult.sources && verificationResult.sources.length > 0 && (
          <View style={styles.sourcesContainer}>
            <Text style={[styles.sourcesTitle, { color: colors.text }]}>Sources:</Text>
            {verificationResult.sources.map((source, index) => (
              <Text 
                key={index} 
                style={[styles.sourceText, { color: colors.primary }]}
                onPress={() => handleSourcePress(source)}
              >
                • {source}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.messageBubble, styles.botBubble, { backgroundColor: colors.card }]}>
      <Text style={[styles.messageText, { color: colors.text }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 18,
    marginVertical: 6,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  botBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  confidenceText: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sourcesTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 2,
    textDecorationLine: 'underline',
  },
});

export default MessageBubble;
