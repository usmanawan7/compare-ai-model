'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatHistoryItem, ModelResult } from '@/services/chat-history.service';
import { Clock, DollarSign, Hash, CheckCircle, XCircle, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  historyItem: ChatHistoryItem | null;
}

export function ResultPopup({ isOpen, onClose, historyItem }: ResultPopupProps) {
  if (!historyItem) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return 'N/A';
    return `$${cost.toFixed(6)}`;
  };

  const formatTokens = (tokens?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) => {
    if (!tokens) return 'N/A';
    return `${tokens.total_tokens.toLocaleString()} (${tokens.prompt_tokens}+${tokens.completion_tokens})`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Model Comparison Results</span>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {historyItem.modelCount} models
              </Badge>
              <Badge variant="outline">
                {new Date(historyItem.createdAt).toLocaleString()}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{historyItem.prompt}</p>
              </div>
            </CardContent>
          </Card>

          {/* Model Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(historyItem.results).map(([modelName, result]) => {
              const modelResult = result as ModelResult;
              const hasError = !!modelResult.error;
              
              return (
                <Card key={modelName} className={`${hasError ? 'border-red-200' : 'border-green-200'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center space-x-2">
                        {hasError ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className="truncate">{modelName}</span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(modelResult.response)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Response */}
                    <div className="max-h-64 overflow-y-auto">
                      {hasError ? (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                          <strong>Error:</strong> {modelResult.error}
                        </div>
                      ) : (
                        <div className="model-response text-sm">
                          <ReactMarkdown>{modelResult.response}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Time</span>
                        </div>
                        <span>{formatTime(modelResult.timeTakenMs)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Hash className="h-3 w-3" />
                          <span>Tokens</span>
                        </div>
                        <span>{formatTokens(modelResult.tokens)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>Cost</span>
                        </div>
                        <span>{formatCost(modelResult.costEstimateUsd)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {historyItem.modelCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Models</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {Object.values(historyItem.results).filter(r => !(r as ModelResult).error).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(
                      Object.values(historyItem.results)
                        .filter(r => !(r as ModelResult).error)
                        .reduce((sum, r) => sum + (r as ModelResult).timeTakenMs, 0) / 
                      Object.values(historyItem.results).filter(r => !(r as ModelResult).error).length
                    )}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {Object.values(historyItem.results)
                      .filter(r => !(r as ModelResult).error)
                      .reduce((sum, r) => sum + ((r as ModelResult).tokens?.total_tokens || 0), 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Tokens</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
