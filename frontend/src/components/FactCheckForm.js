import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ScrollView } from 'react-native';
import { startFactCheck } from '../services/api';
import { setupWebSocket } from '../services/websocket';

const FactCheckForm = () => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [log, setLog] = useState('');

  useEffect(() => {
    const ws = setupWebSocket((message) => {
      console.log('Received message:', message);
      
      // Handle different message types
      switch (message.type) {
        case 'progress':
          setStatus(message.data.message || 'Processing...');
          break;
        case 'claim':
          setResults(prev => [...prev, { type: 'claim', ...message.data }]);
          break;
        case 'result':
          setResults(prev => [...prev, { type: 'result', ...message.data }]);
          setIsLoading(false);
          setStatus('Completed');
          break;
        case 'educational':
          setResults(prev => [...prev, { type: 'educational', ...message.data }]);
          break;
        case 'sources':
          setResults(prev => [...prev, { type: 'sources', ...message.data }]);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
      
      // Update log
      setLog(prev => `${prev}\n${JSON.stringify(message, null, 2)}`);
    });

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setResults([]);
    setStatus('Starting fact check...');
    setLog('');
    
    try {
      await startFactCheck(text);
      // The WebSocket will handle the response
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error occurred');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Fact Check Information</Text>
      
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Enter text to fact-check"
        placeholderTextColor="#888"
        multiline
        numberOfLines={4}
      />
      
      <Button
        title={isLoading ? "Processing..." : "Check Facts"}
        onPress={handleSubmit}
        disabled={isLoading}
        color="#007AFF"
      />
      
      <Text style={styles.status}>Status: {status}</Text>
      
      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.resultType}>{result.type.toUpperCase()}:</Text>
            <Text style={styles.resultText}>
              {JSON.stringify(result, null, 2)}
            </Text>
          </View>
        ))}
      </ScrollView>
      
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Logs:</Text>
          <ScrollView style={styles.debugLogs}>
            <Text style={styles.debugText}>{log}</Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  status: {
    marginVertical: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  resultsContainer: {
    flex: 1,
    marginTop: 15,
  },
  resultItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  resultType: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  resultText: {
    color: '#444',
  },
  debugContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  debugLogs: {
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
  },
});

export default FactCheckForm;
