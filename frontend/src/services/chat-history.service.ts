import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ChatHistoryItem {
  id: string;
  sessionId: string;
  prompt: string;
  results: Record<string, any>;
  createdAt: string;
  completedAt: string;
  modelCount: number;
  models: string[];
  totalTokens?: number;
  totalCost?: number;
  averageResponseTime?: number;
}

export interface ModelResult {
  model: string;
  modelId: string;
  response: string;
  tokens?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  timeTakenMs: number;
  costEstimateUsd?: number;
  error?: string;
}

class ChatHistoryService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      console.log('ChatHistoryService: Token loaded from localStorage:', this.token ? 'Present' : 'Missing');
    }
  }

  // Method to update token when user logs in
  updateToken(token: string | null) {
    console.log('ChatHistoryService: Updating token:', token ? 'Present' : 'Null');
    this.token = token;
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders() {
    if (!this.token) {
      throw new Error('No authentication token available');
    }
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }


  async getHistory(): Promise<ChatHistoryItem[]> {
    const response = await axios.get<ChatHistoryItem[]>(`${API_URL}/chat-history`, {
      headers: this.getHeaders(),
    });
    
    return response.data;
  }

  async getHistoryItem(id: string): Promise<ChatHistoryItem> {
    const response = await axios.get<ChatHistoryItem>(`${API_URL}/chat-history/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async deleteHistoryItem(id: string): Promise<{ message: string }> {
    console.log('Frontend: Deleting history item:', id);
    console.log('Frontend: Token available:', !!this.token);
    console.log('Frontend: Headers:', this.getHeaders());
    
    const response = await axios.delete<{ message: string }>(`${API_URL}/chat-history/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  async deleteAllHistory(): Promise<{ message: string; deletedCount: number }> {
    const response = await axios.delete<{ message: string; deletedCount: number }>(`${API_URL}/chat-history`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }
}

export const chatHistoryService = new ChatHistoryService();
