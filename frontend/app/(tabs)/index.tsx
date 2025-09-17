import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@react-navigation/native';

// Import new mobile components
import EnhancedInput from '../../components/ui/EnhancedInput';
import VerificationResults from '../../components/ui/VerificationResults';

// Import existing components
import MessageBubble from '@app-components/home/MessageBubble';
import WelcomeScreen from '@app-components/home/WelcomeScreen';
import HomeHeader from '@app-components/home/HomeHeader';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  verificationResult?: {
    isFake: boolean;
    confidence: number;
    explanation: string;
    sources?: string[];
  };
}

interface VerificationResult {
  claim: string;
  verdict: {
    status: 'supported' | 'refuted' | 'insufficient' | 'conflicting';
    percentage: number;
    color: string;
  };
  sources: {
    id: string;
    title: string;
    url: string;
    domain: string;
    isReliable: boolean;
  }[];
  processedAnswer: string;
  summary: {
    supported: number;
    refuted: number;
    insufficient: number;
    conflicting: number;
  };
  claimsAnalyzed: number;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Set up WebSocket connection
  React.useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8000/ws');

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);

        if (data.type === 'result' || data.type === 'complete') {
          // Process the final result
          handleWebSocketResult(data.data);
        } else if (data.type === 'progress') {
          // Handle progress updates if needed
          console.log('Progress:', data.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  const handleWebSocketResult = (data: any) => {
    console.log('Processing result:', data);

    // Transform backend response to match our VerificationResult interface
    const result: VerificationResult = {
      claim: data.claim || data.text || '',
      verdict: {
        status: data.verdict?.toLowerCase() === 'false' || data.is_fake ? 'refuted' : 'supported',
        percentage: data.confidence ? Math.round(data.confidence * 100) : 85,
        color: data.verdict?.toLowerCase() === 'false' || data.is_fake ? '#FF4444' : '#00C851'
      },
      sources: data.sources || [],
      processedAnswer: data.explanation || data.processed_answer || 'Analysis complete',
      summary: data.summary || {
        supported: 0,
        refuted: 0,
        insufficient: 0,
        conflicting: 0
      },
      claimsAnalyzed: data.claims_analyzed || 1
    };

    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      text: result.processedAnswer,
      isUser: false,
      verificationResult: {
        isFake: result.verdict.status === 'refuted',
        confidence: result.verdict.percentage,
        explanation: result.processedAnswer,
        sources: result.sources.map((s: any) => s.url || s),
      },
    };

    setMessages(prev => [...prev, botMessage]);
    setVerificationResult(result);
    setShowResults(true);
    setIsLoading(false);
  };

  const handleVerifyNews = useCallback(async (messageText: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setShowResults(false);
    setVerificationResult(null);

    try {
      // Call the actual fact-check API
      const response = await fetch('http://localhost:8000/api/fact-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: messageText,
          pipeline: 'fact'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start fact-check');
      }

      const result = await response.json();
      console.log('Fact-check started:', result);

      // Poll for results
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      const pollForResults = async () => {
        try {
          const resultResponse = await fetch('http://localhost:8000/api/fact-check-result');
          if (resultResponse.ok) {
            const data = await resultResponse.json();
            if (data.status === 'complete' && data.result) {
              handleWebSocketResult(data.result);
              return true;
            }
          }
        } catch (error) {
          console.error('Error polling results:', error);
        }
        return false;
      };

      // Poll every second
      const pollInterval = setInterval(async () => {
        attempts++;
        const hasResult = await pollForResults();

        if (hasResult || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          if (attempts >= maxAttempts) {
            // Timeout - show error
            setIsLoading(false);
            Alert.alert('Timeout', 'The fact-check is taking longer than expected. Please try again.');
          }
        }
      }, 1000);

    } catch (error) {
      console.error('Error verifying news:', error);
      setIsLoading(false);
      Alert.alert(
        'Error',
        'Failed to verify the information. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  const handleExamplePress = (example: string) => {
    handleVerifyNews(example);
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'No new notifications at this time.');
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setVerificationResult(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.dark ? "light" : "dark"} />

      <HomeHeader onNotificationPress={handleNotificationPress} />

      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: 20 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <WelcomeScreen onExamplePress={handleExamplePress} />
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                text={message.text}
                isUser={message.isUser}
                verificationResult={message.verificationResult}
              />
            ))
          )}
        </ScrollView>

        {/* Enhanced Input at the bottom */}
        <View style={styles.inputWrapper}>
          <EnhancedInput
            onSubmit={handleVerifyNews}
            isLoading={isLoading}
            placeholder="Enter text or paste link to fact-check..."
            multiline={false}
          />
        </View>
      </View>

      {/* Verification Results Modal */}
      {showResults && verificationResult && (
        <VerificationResults
          result={verificationResult}
          onClose={handleCloseResults}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 120, // Add space for input
    flexGrow: 1,
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
});
