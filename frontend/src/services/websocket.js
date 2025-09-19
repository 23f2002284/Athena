export const setupWebSocket = (onMessage) => {
  // Use your machine's IP address instead of localhost for mobile testing
  const ws = new WebSocket('ws://localhost:8000/ws');
  
  ws.onopen = () => {
    console.log('WebSocket Connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket Error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket Disconnected');  
  };

  return ws;
};
