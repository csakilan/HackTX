// API Service to connect Frontend to Backend
// Backend runs on http://localhost:8787

const BACKEND_URL = 'http://localhost:8787';

export const api = {
  // Health check
  async healthCheck(): Promise<string> {
    const response = await fetch(`${BACKEND_URL}/health`);
    return await response.text();
  },

  // Ask race engineer a question
  async askQuestion(question: string): Promise<{ question: string; answer: string; raceTime: number }> {
    const response = await fetch(`${BACKEND_URL}/ask?q=${encodeURIComponent(question)}`);
    return await response.json();
  },

  // Classify message severity
  async classifySeverity(message: string): Promise<{ message: string; severity: "high" | "medium" | "low" }> {
    const response = await fetch(`${BACKEND_URL}/classify-severity?message=${encodeURIComponent(message)}`);
    return await response.json();
  },

  // Refine engineer message (remove filler, fix errors)
  async refineMessage(message: string): Promise<{ original: string; refined: string }> {
    const response = await fetch(`${BACKEND_URL}/refine-message?message=${encodeURIComponent(message)}`);
    return await response.json();
  },

  // Control race (start, stop, reset)
  async controlRace(action: 'start' | 'stop' | 'reset'): Promise<string> {
    const response = await fetch(`${BACKEND_URL}/control/${action}`, {
      method: 'POST',
    });
    return await response.text();
  },

  // Connect to WebSocket for live race data
  connectWebSocket(
    onSession: (data: any) => void,
    onTick: (data: any) => void,
    onError?: (error: Event) => void
  ): WebSocket {
    const ws = new WebSocket(`ws://localhost:8787/ws`);

    ws.onopen = () => {
      console.log('✅ Connected to race simulation backend');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'session') {
        onSession(data);
      } else if (data.type === 'tick') {
        onTick(data);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log('🔌 Disconnected from race simulation backend');
    };

    return ws;
  },
};
