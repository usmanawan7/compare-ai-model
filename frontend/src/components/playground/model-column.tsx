'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ModelState } from './playground';
import { Clock, DollarSign, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ModelColumnProps {
  modelName: string;
  modelState: ModelState;
  hasPrompt: boolean;
  isSubmitting: boolean;
}

export function ModelColumn({ modelName, modelState, hasPrompt, isSubmitting }: ModelColumnProps) {
  const {
    isTyping,
    isStreaming,
    isComplete,
    hasError,
    response,
    tokens,
    timeTakenMs,
    costEstimateUsd,
    error,
  } = modelState;

  const getModelDisplayName = (name: string) => {
    const parts = name.split('-');
    const provider = parts[0];
    const model = parts.slice(1).join(' ');
    
    return {
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
      model: model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    };
  };

  const { provider, model } = getModelDisplayName(modelName);

  const getStatusBadge = () => {
    if (hasError) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Error
      </Badge>;
    }
    
    if (isComplete) {
      return <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Complete
      </Badge>;
    }
    
    if (isStreaming) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Streaming
      </Badge>;
    }
    
    if (isTyping) {
      return <Badge variant="outline" className="flex items-center gap-1">
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
        Typing...
      </Badge>;
    }
    
    if (isSubmitting) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Processing
      </Badge>;
    }
    
    if (hasPrompt) {
      return <Badge variant="outline" className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Ready
      </Badge>;
    }
    
    return <Badge variant="outline">Waiting</Badge>;
  };

  const getProgress = () => {
    if (isComplete) return 100;
    if (isStreaming && response) {
      // Rough progress estimation based on response length
      return Math.min((response.length / 1000) * 100, 90);
    }
    if (isTyping) return 10;
    return 0;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{provider}</CardTitle>
            <p className="text-sm text-muted-foreground">{model}</p>
          </div>
          {getStatusBadge()}
        </div>
        
        {/* Progress bar */}
        {(isTyping || isStreaming) && (
          <div className="mt-3">
            <Progress value={getProgress()} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Metrics */}
        {(isComplete || hasError) && (
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{(timeTakenMs / 1000).toFixed(1)}s</span>
            </div>
            {tokens && (
              <div className="text-muted-foreground">
                {tokens.total_tokens.toLocaleString()} tokens
              </div>
            )}
            {costEstimateUsd && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                <span>${costEstimateUsd.toFixed(6)}</span>
              </div>
            )}
          </div>
        )}

        {/* Response Content */}
        <div className="flex-1 min-h-[300px]">
          {hasError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive text-sm">{error}</p>
              </div>
            </div>
          ) : response ? (
            <div className="model-response h-full overflow-y-auto">
              <ReactMarkdown
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  pre: ({ children, ...props }) => (
                    <pre {...props} className="bg-muted border border-border rounded-lg p-4 overflow-x-auto text-sm">
                      {children}
                    </pre>
                  ),
                  code: ({ children, className, ...props }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code {...props} className="bg-muted text-foreground px-1 py-0.5 rounded text-sm">
                        {children}
                      </code>
                    ) : (
                      <code {...props} className={className}>
                        {children}
                      </code>
                    );
                  },
                  p: ({ children, ...props }) => (
                    <p {...props} className="text-foreground leading-relaxed mb-3">
                      {children}
                    </p>
                  ),
                  h1: ({ children, ...props }) => (
                    <h1 {...props} className="text-xl font-bold text-foreground mb-3 mt-4">
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 {...props} className="text-lg font-semibold text-foreground mb-2 mt-3">
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 {...props} className="text-base font-medium text-foreground mb-2 mt-2">
                      {children}
                    </h3>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul {...props} className="list-disc list-inside text-foreground mb-3 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol {...props} className="list-decimal list-inside text-foreground mb-3 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li {...props} className="text-foreground">
                      {children}
                    </li>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote {...props} className="border-l-4 border-l-primary bg-muted/30 pl-4 py-2 my-3 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {response}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  {hasPrompt ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <span className="text-2xl">🤖</span>
                  )}
                </div>
                <p className="text-sm">
                  {hasPrompt 
                    ? (isSubmitting ? "Waiting for response..." : "Ready to respond...")
                    : "Waiting for prompt..."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
