// Singleton WebSocket manager
class WebSocketManager {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyListeners(data.type, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('⚠️ WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 3000 * this.reconnectAttempts);
    }
  }

  subscribe(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(callback);
    
    // Auto-connect jika belum
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    return () => this.unsubscribe(type, callback);
  }

  unsubscribe(type: string, callback: (data: any) => void) {
    this.listeners.get(type)?.delete(callback);
  }

  private notifyListeners(type: string, data: any) {
    this.listeners.get(type)?.forEach(callback => callback(data));
    this.listeners.get('*')?.forEach(callback => callback(data));
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}

export const wsManager = new WebSocketManager();

// Sound alerts
export const playNotificationSound = (type: 'new_order' | 'assigned' | 'completed' | 'alert') => {
  const sounds = {
    new_order: '/sounds/new-order.mp3',
    assigned: '/sounds/assigned.mp3',
    completed: '/sounds/success.mp3',
    alert: '/sounds/alert.mp3'
  };

  const audio = new Audio(sounds[type]);
  audio.volume = 0.5;
  audio.play().catch(err => console.log('Audio play failed:', err));
};