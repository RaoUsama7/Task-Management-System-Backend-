import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Record<string, Function[]> = {};

  // Connect to WebSocket
  connect(token: string): void {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    this.setupEventListeners();
  }

  // Disconnect from WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to events
  on(event: string, callback: Function): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);

    // If socket already exists, add the listener
    if (this.socket) {
      this.socket.on(event, (data: any) => callback(data));
    }
  }

  // Unsubscribe from events
  off(event: string, callback?: Function): void {
    if (!callback) {
      // Remove all callbacks for this event
      delete this.eventHandlers[event];
      if (this.socket) {
        this.socket.off(event);
      }
    } else {
      // Remove specific callback
      if (this.eventHandlers[event]) {
        this.eventHandlers[event] = this.eventHandlers[event].filter(
          (cb) => cb !== callback
        );
      }
    }
  }

  // Send event to server
  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }

  // Setup event listeners from stored handlers
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Setup connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Add stored event handlers
    Object.entries(this.eventHandlers).forEach(([event, callbacks]) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, (data: any) => callback(data));
      });
    });
  }
}

export default new WebSocketService(); 