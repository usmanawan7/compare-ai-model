import io, { Socket } from 'socket.io-client';

export interface WebSocketPromptReceived {
  sessionId: string;
  prompt: string;
  submittedBy: string;
  timestamp: string;
}

export interface WebSocketModelTyping {
  model: string;
  isTyping: boolean;
  timestamp: string;
}

export interface WebSocketModelStream {
  model: string;
  chunk: string;
  progress: {
    current: number;
    total: number;
  };
  timestamp: string;
}

export interface WebSocketModelComplete {
  model: string;
  finalResponse: string;
  tokens?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  timeTakenMs: number;
  costEstimateUsd?: number;
  error?: string;
  timestamp: string;
}

export interface WebSocketComparisonComplete {
  sessionId: string;
  prompt: string;
  results: Record<string, {
    response: string;
    tokens?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    timeTakenMs: number;
    costEstimateUsd?: number;
    error?: string;
  }>;
  createdAt: string;
  completedAt: string;
  timestamp: string;
}

export interface WebSocketError {
  sessionId: string;
  error: string;
  timestamp: string;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupConnectionHandlers();
    
    return this.socket;
  }

  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed after maximum attempts');
    });
  }

  createSession(name?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('create_session', { name });
    }
  }

  joinSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_session', { sessionId });
    }
  }

  submitPrompt(sessionId: string, prompt: string, models?: string[], userId?: string, userEmail?: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket: Submitting prompt with user info:', { 
        sessionId, 
        prompt: prompt.substring(0, 50) + '...', 
        models, 
        userId, 
        userEmail,
        hasUserId: !!userId,
        hasUserEmail: !!userEmail
      });
      this.socket.emit('submit_prompt', { sessionId, prompt, models, userId, userEmail });
    } else {
      console.error('WebSocket not connected!');
    }
  }

  // Event listeners
  onConnected(callback: (data: any) => void): void {
    this.socket?.on('connected', callback);
  }

  onSessionCreated(callback: (data: any) => void): void {
    this.socket?.on('session_created', callback);
  }

  onJoinedSession(callback: (data: any) => void): void {
    this.socket?.on('joined_session', callback);
  }

  onPromptReceived(callback: (data: WebSocketPromptReceived) => void): void {
    this.socket?.on('prompt_received', callback);
  }

  onModelTyping(callback: (data: WebSocketModelTyping) => void): void {
    this.socket?.on('model_typing', callback);
  }

  onModelStream(callback: (data: WebSocketModelStream) => void): void {
    this.socket?.on('model_stream', callback);
  }

  onModelComplete(callback: (data: WebSocketModelComplete) => void): void {
    this.socket?.on('model_complete', callback);
  }

  onComparisonComplete(callback: (data: WebSocketComparisonComplete) => void): void {
    this.socket?.on('comparison_complete', callback);
  }

  onError(callback: (error: WebSocketError) => void): void {
    this.socket?.on('prompt_error', callback);
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    id?: string;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      id: this.socket?.id
    };
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
