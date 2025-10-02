'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

export function PromptInput({ 
  prompt, 
  onPromptChange, 
  onSubmit, 
  isSubmitting, 
  disabled = false 
}: PromptInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt here... (Cmd/Ctrl + Enter to submit)"
          className="min-h-[120px] resize-none pr-12"
          disabled={disabled || isSubmitting}
        />
        <Button
          onClick={onSubmit}
          disabled={!prompt.trim() || isSubmitting || disabled}
          size="icon"
          className="absolute bottom-3 right-3 h-8 w-8"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {prompt.length} characters
        </span>
        <span>
          Press Cmd/Ctrl + Enter to submit
        </span>
      </div>
    </div>
  );
}
