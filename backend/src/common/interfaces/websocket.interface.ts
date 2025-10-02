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

export interface ModelStreamProgress {
  current: number;
  total: number;
  percentage: number;
}
