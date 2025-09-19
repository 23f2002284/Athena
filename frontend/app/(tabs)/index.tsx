import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, useColorScheme } from 'react-native';
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
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentPollTimeout, setCurrentPollTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const hasReceivedResultRef = React.useRef(false);

  // Set up WebSocket connection with reconnection logic
  React.useEffect(() => {
    let websocket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = () => {
      const wsUrl = `ws://${process.env.EXPO_PUBLIC_API_BASE_URL?.replace('http://', '') || 'localhost:8000'}/ws`;
      console.log('Connecting to WebSocket at:', wsUrl);
      websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setWs(websocket);
        reconnectAttempts = 0; // Reset attempts on successful connection
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

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  // Cleanup polling on component unmount
  React.useEffect(() => {
    return () => {
      if (currentPollTimeout) {
        clearTimeout(currentPollTimeout);
      }
    };
  }, [currentPollTimeout]);

  const handleWebSocketResult = (data: any) => {
    // Prevent duplicate results for the same query
    if (hasReceivedResultRef.current) {
      console.log('Already received result for this query, ignoring duplicate');
      return;
    }

    console.log('Processing result:', data);

    // Check if still processing
    if (data.verdict === 'Processing' || data.response?.includes('processing')) {
      console.log('Still processing, ignoring intermediate result');
      return; // Don't show processing state as a result
    }

    // Use structured data from backend if available, otherwise parse response string
    let verdict = data.verdict || 'Unknown';
    let confidence = data.confidence !== undefined ? data.confidence : 50;
    let explanation = data.detailed_explanation || '';

    // If we have structured data, use it directly
    if (data.verdict && data.confidence !== undefined && data.detailed_explanation) {
      verdict = data.verdict;
      confidence = data.confidence;
      explanation = data.detailed_explanation;
    } else if (data.response && !data.verdict) {
      // Fallback to parsing response string
      const responseLines = data.response.split('\n');

      // Extract verdict from first line
      if (responseLines[0]) {
        verdict = responseLines[0].trim();
      }

      // Extract confidence from second line
      const confidenceMatch = data.response.match(/Confidence:\s*(\d+)%/);
      if (confidenceMatch) {
        confidence = parseInt(confidenceMatch[1]);
      }

      // Extract explanation (everything after confidence line)
      const explanationStart = data.response.indexOf('\n\n');
      if (explanationStart > -1) {
        explanation = data.response.substring(explanationStart + 2).trim();
        // Remove "Sources verified:" line if present
        explanation = explanation.replace(/\n\nSources verified:.*$/, '').trim();
      }
    }

    // Transform backend response to match our VerificationResult interface
    const result: VerificationResult = {
      claim: data.claim || messages[messages.length - 1]?.text || 'Fact-check analysis',
      verdict: {
        status: verdict.toLowerCase().includes('false') || verdict.toLowerCase().includes('refuted') ? 'refuted' :
                verdict.toLowerCase().includes('true') || verdict.toLowerCase().includes('supported') ? 'supported' :
                verdict.toLowerCase().includes('conflicting') ? 'conflicting' : 'insufficient',
        percentage: confidence,
        color: verdict.toLowerCase().includes('false') || verdict.toLowerCase().includes('refuted') ? '#FF4444' :
               verdict.toLowerCase().includes('true') || verdict.toLowerCase().includes('supported') ? '#00C851' :
               verdict.toLowerCase().includes('conflicting') ? '#FF9800' : '#9C27B0'
      },
      sources: Array.isArray(data.sources) && data.sources.length > 0 && data.sources[0] !== "No specific sources found" ?
        data.sources.map((source: any) => {
          if (typeof source === 'string') {
            // Skip generic "No sources" messages
            if (source.includes('No') && source.includes('sources')) {
              return null;
            }
            // Handle simple string sources
            return {
              id: `source-${Math.random()}`,
              title: source,
              url: source.startsWith('http') ? source : `https://${source}`,
              domain: source.replace(/^https?:\/\//, '').split('/')[0],
              isReliable: true
            };
          } else {
            // Handle structured source objects from backend
            return {
              id: source.id || `source-${Math.random()}`,
              title: source.title || source.domain || 'Source',
              url: source.url || '#',
              domain: source.domain || 'unknown',
              isReliable: source.isReliable !== false
            };
          }
        }).filter((s: any) => s !== null) : [],
      processedAnswer: explanation || data.detailed_explanation || 'Analysis complete',
      summary: data.summary || {
        supported: verdict.toLowerCase().includes('true') ? 1 : 0,
        refuted: verdict.toLowerCase().includes('false') ? 1 : 0,
        insufficient: (!verdict.toLowerCase().includes('true') && !verdict.toLowerCase().includes('false')) ? 1 : 0,
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

    // Remove any existing bot messages for this query before adding new one
    setMessages(prev => {
      // Find last user message index manually (compatible with older ES versions)
      let lastUserMessageIndex = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].isUser) {
          lastUserMessageIndex = i;
          break;
        }
      }

      if (lastUserMessageIndex >= 0) {
        // Keep messages up to and including the last user message
        return [...prev.slice(0, lastUserMessageIndex + 1), botMessage];
      }
      return [...prev, botMessage];
    });

    setVerificationResult(result);
    setShowResults(true);
    setIsLoading(false);
    hasReceivedResultRef.current = true; // Mark that we've received a result

    // Auto-scroll to bottom when new message is added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleVerifyNews = useCallback(async (messageText: string) => {
    // Clear any existing polling before starting new request
    if (currentPollTimeout) {
      clearTimeout(currentPollTimeout);
      setCurrentPollTimeout(null);
    }

    // Reset result tracking for new query
    hasReceivedResultRef.current = false;
    const queryId = `query-${Date.now()}`;
    setCurrentQueryId(queryId);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setShowResults(false);
    setVerificationResult(null);

    // Auto-scroll to bottom when user message is added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Call the actual fact-check API
      const apiUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/fact-check`;
      console.log('Making fact-check request to:', apiUrl);
      console.log('Request body:', { text: messageText, pipeline: 'fact' });

      const response = await fetch(apiUrl, {
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

      // Optimized polling with exponential backoff
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts max
      let pollTimeout: NodeJS.Timeout;

      const pollForResults = async (): Promise<boolean> => {
        // Check if we already have a result
        if (hasReceivedResultRef.current) {
          console.log('Result already received, stopping polling');
          return true;
        }

        try {
          const pollUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/fact-check-result`;
          console.log('Polling for results at:', pollUrl);
          const resultResponse = await fetch(pollUrl);
          console.log('Poll response status:', resultResponse.status);
          if (resultResponse.ok) {
            const data = await resultResponse.json();
            console.log('Poll data received:', JSON.stringify(data, null, 2));
            console.log('hasReceivedResultRef.current:', hasReceivedResultRef.current);
            // Check if we have a valid response with content
            if (data.response && data.response.trim() !== '') {
              // Check if this is still processing or a final result
              if (data.verdict === 'Processing' || data.response?.includes('processing')) {
                console.log('Still processing response, continuing to poll...');
                return false; // Continue polling
              }

              // This is a final result
              console.log('Final result received, stopping polling');
              // Clear any existing timeout to prevent duplicate calls
              if (currentPollTimeout) {
                clearTimeout(currentPollTimeout);
                setCurrentPollTimeout(null);
              }
              handleWebSocketResult(data);
              return true;
            }
          }
        } catch (error) {
          console.error('Error polling results:', error);
        }
        return false;
      };

      // Poll with exponential backoff: 1s, 2s, 3s, 4s, 5s, then 5s intervals
      const scheduleNextPoll = () => {
        attempts++;
        const delay = Math.min(attempts * 1000, 5000); // Max 5 second delay

        pollTimeout = setTimeout(async () => {
          const hasResult = await pollForResults();

          if (hasResult) {
            // Success - stop polling
            setCurrentPollTimeout(null);
            return;
          } else if (attempts >= maxAttempts) {
            // Timeout - show error
            setIsLoading(false);
            setCurrentPollTimeout(null);
            Alert.alert('Timeout', 'The fact-check is taking longer than expected. Please try again.');
          } else {
            // Continue polling
            scheduleNextPoll();
          }
        }, delay);

        setCurrentPollTimeout(pollTimeout);
      };

      // Start polling
      scheduleNextPoll();

    } catch (error) {
      console.error('Error verifying news:', error);
      setIsLoading(false);
      Alert.alert(
        'Error',
        'Failed to verify the information. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  }, [currentPollTimeout]);

  const handleExamplePress = (example: string) => {
    handleVerifyNews(example);
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'No new notifications at this time.');
  };

  const handleCloseResults = () => {
    setShowResults(false);
    // Don't clear verificationResult - keep it for potential reopening
  };

  const handleVerificationResultPress = (message: Message) => {
    if (message.verificationResult) {
      // Reconstruct the VerificationResult from the message data
      const result: VerificationResult = {
        claim: message.text || 'Fact-check analysis',
        verdict: {
          status: message.verificationResult.isFake ? 'refuted' : 'supported',
          percentage: message.verificationResult.confidence,
          color: message.verificationResult.isFake ? '#FF4444' : '#00C851'
        },
        sources: (message.verificationResult.sources || []).map((source: string, index: number) => ({
          id: `source-${index}`,
          title: source,
          url: source.startsWith('http') ? source : `https://${source}`,
          domain: source.replace(/^https?:\/\//, '').split('/')[0],
          isReliable: true
        })),
        processedAnswer: message.verificationResult.explanation,
        summary: {
          supported: message.verificationResult.isFake ? 0 : 1,
          refuted: message.verificationResult.isFake ? 1 : 0,
          insufficient: 0,
          conflicting: 0
        },
        claimsAnalyzed: 1
      };

      setVerificationResult(result);
      setShowResults(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? "light" : "dark"} />

      <HomeHeader onNotificationPress={handleNotificationPress} />

      <KeyboardAvoidingView
        style={styles.contentWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { flexGrow: 1 }
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
                onVerificationPress={message.verificationResult ? () => handleVerificationResultPress(message) : undefined}
              />
            ))
          )}
        </ScrollView>

        {/* Enhanced Input at the bottom */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
          <EnhancedInput
            onSubmit={handleVerifyNews}
            isLoading={isLoading}
            placeholder="Enter text or paste link to fact-check..."
            multiline={false}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Verification Results Modal */}
      {verificationResult && (
        <VerificationResults
          result={verificationResult}
          onClose={handleCloseResults}
          visible={showResults}
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
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100, // Adjusted to prevent overlap with input
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 75 : 65, // Adjust for tab bar
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
