'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { authAtom } from '../../stores/auth.store';
import { webSocketService, WebSocketModelStream, WebSocketModelComplete, WebSocketComparisonComplete } from '../../services/websocket.service';
import { ModelColumn } from './model-column';
import { PromptInput } from './prompt-input';
import { ConnectionStatus } from './connection-status';
import { ModelSelector, AIModel, ModelMetadata } from './model-selector';

export interface ModelState {
  isTyping: boolean;
  isStreaming: boolean;
  isComplete: boolean;
  hasError: boolean;
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

export interface ModelStates {
  [modelName: string]: ModelState;
}

const initialModelState: ModelState = {
  isTyping: false,
  isStreaming: false,
  isComplete: false,
  hasError: false,
  response: '',
  timeTakenMs: 0,
};

// Helper function to convert model ID to formatted name
const getModelName = (modelId: AIModel): string => {
  const metadata = ModelMetadata[modelId];
  return `${metadata.provider}-${metadata.name}`;
};

// Helper function to convert formatted name back to model ID
const getModelIdFromName = (modelName: string): AIModel | null => {
  for (const [modelId, metadata] of Object.entries(ModelMetadata)) {
    const formattedName = `${metadata.provider}-${metadata.name}`;
    if (formattedName === modelName) {
      return modelId as AIModel;
    }
  }
  return null;
};

export function Playground() {
  const [authState] = useAtom(authAtom);
  const [sessionId, setSessionId] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modelStates, setModelStates] = useState<ModelStates>({});
  const [selectedModels, setSelectedModels] = useState<AIModel[]>([
    AIModel.OPENAI_GPT4O_MINI,
    AIModel.ANTHROPIC_CLAUDE35_SONNET,
    AIModel.XAI_GROK3_BETA
  ]);
  const [isComparisonComplete, setIsComparisonComplete] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<'selection' | 'comparison'>('selection');

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = webSocketService.connect();

    // Create a new session
    webSocketService.createSession('Multi-Model AI Playground Session');

    // Set up event listeners
    webSocketService.onSessionCreated((data) => {
      setSessionId(data.sessionId);
      webSocketService.joinSession(data.sessionId);
    });

    webSocketService.onJoinedSession((data) => {
      console.log('Joined session:', data.sessionId);
    });

    webSocketService.onPromptReceived((data) => {
      console.log('Prompt received:', data);
      setIsSubmitting(true);
      setIsComparisonComplete(false);
      
      // Reset model states using formatted names
      const newModelStates: ModelStates = {};
      selectedModels.forEach(modelId => {
        const modelName = getModelName(modelId);
        newModelStates[modelName] = { ...initialModelState };
      });
      setModelStates(newModelStates);
    });

    webSocketService.onModelTyping((data) => {
      console.log('Model typing:', data);
      setModelStates(prev => ({
        ...prev,
        [data.model]: {
          ...prev[data.model],
          isTyping: data.isTyping,
        }
      }));
    });

    webSocketService.onModelStream((data: WebSocketModelStream) => {
      console.log('Model stream:', data);
      setModelStates(prev => ({
        ...prev,
        [data.model]: {
          ...prev[data.model],
          isTyping: false,
          isStreaming: true,
          response: prev[data.model]?.response + data.chunk || data.chunk,
        }
      }));
    });

    webSocketService.onModelComplete((data: WebSocketModelComplete) => {
      console.log('Model complete:', data);
      setModelStates(prev => ({
        ...prev,
        [data.model]: {
          ...prev[data.model],
          isTyping: false,
          isStreaming: false,
          isComplete: true,
          hasError: !!data.error,
          response: data.finalResponse,
          tokens: data.tokens,
          timeTakenMs: data.timeTakenMs,
          costEstimateUsd: data.costEstimateUsd,
          error: data.error,
        }
      }));
    });

    webSocketService.onComparisonComplete((data: WebSocketComparisonComplete) => {
      console.log('Comparison complete:', data);
      setIsSubmitting(false);
      setIsComparisonComplete(true);
    });

    webSocketService.onError((error) => {
      console.error('WebSocket error:', error);
      setIsSubmitting(false);
    });

    return () => {
      webSocketService.removeAllListeners();
    };
  }, [selectedModels]);

  const handleSubmitPrompt = useCallback(() => {
    if (!prompt.trim() || !sessionId || isSubmitting) return;

    // Check if user is authenticated
    if (!authState.isAuthenticated || !authState.user) {
      alert('Please login to save your chat history');
      return;
    }

    console.log('Submitting prompt with user info:', { 
      sessionId, 
      prompt: prompt.substring(0, 50) + '...', 
      selectedModels,
      userId: authState.user?.id,
      userEmail: authState.user?.email,
      isAuthenticated: authState.isAuthenticated
    });
    
    webSocketService.submitPrompt(
      sessionId, 
      prompt, 
      selectedModels,
      authState.user?.id,
      authState.user?.email
    );
  }, [prompt, sessionId, selectedModels, isSubmitting, authState.user, authState.isAuthenticated]);

  const handleClearResults = useCallback(() => {
    setModelStates({});
    setIsComparisonComplete(false);
    setPrompt('');
  }, []);

  const handleStartComparison = useCallback(() => {
    if (selectedModels.length < 2) {
      alert('Please select at least 2 models to compare');
      return;
    }
    if (selectedModels.length > 3) {
      alert('You can select maximum 3 models for comparison');
      return;
    }
    setCurrentScreen('comparison');
  }, [selectedModels]);

  const handleBackToSelection = useCallback(() => {
    setCurrentScreen('selection');
    setModelStates({});
    setIsComparisonComplete(false);
    setPrompt('');
  }, []);

  if (currentScreen === 'selection') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-center mb-2">
              Multi-Model AI Playground
            </h1>
            <p className="text-center text-sm md:text-base text-muted-foreground mb-4">
              Select AI models to compare in real-time
            </p>
            <ConnectionStatus />
          </div>

          {/* Start Comparison Button */}
          <div className="flex flex-col items-center space-y-4 mb-8">
            <button
              onClick={handleStartComparison}
              disabled={selectedModels.length < 2 || selectedModels.length > 3}
              className="px-4 md:px-8 py-2 md:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-lg font-semibold w-full max-w-sm md:w-auto"
            >
              Start Comparison
            </button>
            
            {/* Validation Messages */}
            <div className="text-center text-sm text-muted-foreground">
              {selectedModels.length < 2 && (
                <p className="text-amber-600">⚠️ Select at least 2 models to compare</p>
              )}
              {selectedModels.length > 3 && (
                <p className="text-red-600">❌ Maximum 3 models allowed</p>
              )}
              {selectedModels.length >= 2 && selectedModels.length <= 3 && (
                <p className="text-green-600">✅ Ready to compare {selectedModels.length} models</p>
              )}
            </div>
          </div>

          {/* Model Selection */}
          <div className="mb-8">
            <ModelSelector
              selectedModels={selectedModels}
              onModelToggle={(modelId) => {
                setSelectedModels(prev => {
                  if (prev.includes(modelId)) {
                    // Remove model
                    return prev.filter(id => id !== modelId);
                  } else {
                    // Add model (but only if we haven't reached the limit of 3)
                    if (prev.length >= 3) {
                      alert('You can select maximum 3 models for comparison');
                      return prev;
                    }
                    return [...prev, modelId];
                  }
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBackToSelection}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Model Selection</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold">AI Model Comparison</h1>
              <p className="text-muted-foreground">
                {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
              </p>
              <div className="mt-2">
                {authState.isAuthenticated ? (
                  <span className="text-green-600 text-sm">✓ Chat history will be saved</span>
                ) : (
                  <span className="text-red-600 text-sm">⚠ Login to save chat history</span>
                )}
              </div>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
          <ConnectionStatus />
        </div>

        {/* Prompt Input */}
        <div className="mb-8">
          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleSubmitPrompt}
            isSubmitting={isSubmitting}
            disabled={!sessionId}
          />
        </div>

        {/* Model Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {selectedModels.map((modelId) => {
            const modelName = getModelName(modelId);
            return (
              <ModelColumn
                key={modelId}
                modelName={modelName}
                modelState={modelStates[modelName] || initialModelState}
                hasPrompt={!!prompt.trim()}
                isSubmitting={isSubmitting}
              />
            );
          })}
        </div>

        {/* Actions */}
        {isComparisonComplete && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleClearResults}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Clear Results
            </button>
            <button
              onClick={handleSubmitPrompt}
              disabled={!prompt.trim() || isSubmitting}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Compare Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
