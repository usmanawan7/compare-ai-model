'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';

interface ModelProviderProps {
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  disabled?: boolean;
}

const availableModels = [
  {
    id: 'openai-gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast and efficient model for most tasks',
    color: 'bg-green-500',
  },
  {
    id: 'anthropic-claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Advanced reasoning and analysis',
    color: 'bg-orange-500',
  },
  {
    id: 'xai-grok-beta',
    name: 'Grok Beta',
    provider: 'xAI',
    description: 'Real-time information and wit',
    color: 'bg-purple-500',
  },
];

export function ModelProvider({ selectedModels, onModelsChange, disabled = false }: ModelProviderProps) {
  const handleModelToggle = (modelId: string) => {
    if (disabled) return;

    const isSelected = selectedModels.includes(modelId);
    if (isSelected) {
      // Don't allow deselecting if only one model is selected
      if (selectedModels.length === 1) return;
      onModelsChange(selectedModels.filter(id => id !== modelId));
    } else {
      onModelsChange([...selectedModels, modelId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Select Models to Compare</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose which AI models to include in your comparison (minimum 1, maximum 3)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableModels.map((model) => {
            const isSelected = selectedModels.includes(model.id);
            const isDisabled = disabled || (!isSelected && selectedModels.length >= 3);

            return (
              <div
                key={model.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : isDisabled
                    ? 'border-muted bg-muted/20 cursor-not-allowed opacity-50'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleModelToggle(model.id)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${model.color}`} />
                      <span className="font-medium">{model.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {model.provider}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {model.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          Selected: {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}
