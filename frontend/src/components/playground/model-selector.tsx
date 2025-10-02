import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// Model definitions matching the backend
export enum AIModel {
  // OpenAI Models
  OPENAI_GPT4O = 'openai-gpt4o',
  OPENAI_GPT4O_MINI = 'openai-gpt4o-mini',

  // Anthropic Models
  ANTHROPIC_CLAUDE35_SONNET = 'anthropic-claude35-sonnet',
  ANTHROPIC_CLAUDE35_HAIKU = 'anthropic-claude35-haiku',
  ANTHROPIC_CLAUDE37_SONNET = 'anthropic-claude37-sonnet',
  ANTHROPIC_CLAUDE4_SONNET = 'anthropic-claude4-sonnet',
  ANTHROPIC_CLAUDE4_OPUS = 'anthropic-claude4-opus',
  
  // xAI Models
  XAI_GROK3_BETA = 'xai-grok3-beta',
  XAI_GROK3_MINI_BETA = 'xai-grok3-mini-beta',
  XAI_GROK4 = 'xai-grok4',
  XAI_GROK2 = 'xai-grok2',
}

// Model metadata for UI and documentation
export const ModelMetadata = {
  [AIModel.OPENAI_GPT4O]: {
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Most capable GPT-4 model, great for complex tasks',
    contextWindow: 128000,
    costPer1kTokens: 0.01,
  },
  [AIModel.OPENAI_GPT4O_MINI]: {
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Faster, cost-effective version of GPT-4o',
    contextWindow: 128000,
    costPer1kTokens: 0.00015,
  },

  [AIModel.ANTHROPIC_CLAUDE35_SONNET]: {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and speed for most tasks',
    contextWindow: 200000,
    costPer1kTokens: 0.003
  },
  [AIModel.ANTHROPIC_CLAUDE35_HAIKU]: {
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    description: 'Fastest Claude model for quick responses',
    contextWindow: 200000,
    costPer1kTokens: 0.00025
  },
  [AIModel.ANTHROPIC_CLAUDE37_SONNET]: {
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    description: 'Enhanced version with extended thinking capabilities',
    contextWindow: 200000,
    costPer1kTokens: 0.004
  },
  [AIModel.ANTHROPIC_CLAUDE4_SONNET]: {
    name: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    description: 'Latest Claude model with advanced reasoning',
    contextWindow: 200000,
    costPer1kTokens: 0.005
  },
  [AIModel.ANTHROPIC_CLAUDE4_OPUS]: {
    name: 'Claude 4 Opus',
    provider: 'Anthropic',
    description: 'Most powerful Claude model for complex tasks',
    contextWindow: 200000,
    costPer1kTokens: 0.015
  },
  [AIModel.XAI_GROK2]: {
    name: 'Grok 2',
    provider: 'xAI',
    description: 'Previous generation Grok model',
    contextWindow: 131072,
    costPer1kTokens: 0.002,
  },
  [AIModel.XAI_GROK3_BETA]: {
    name: 'Grok 3 Beta',
    provider: 'xAI',
    description: 'Advanced reasoning with superior mathematics and coding',
    contextWindow: 131072,
    costPer1kTokens: 0.002,
  },
  [AIModel.XAI_GROK3_MINI_BETA]: {
    name: 'Grok 3 Mini Beta',
    provider: 'xAI',
    description: 'Lightweight real-time language model',
    contextWindow: 131072,
    costPer1kTokens: 0.0002,
  },
  [AIModel.XAI_GROK4]: {
    name: 'Grok 4',
    provider: 'xAI',
    description: 'Latest Grok model with 10x more compute and advanced reasoning',
    contextWindow: 256000,
    costPer1kTokens: 0.002,
  },
};

export interface ModelProvider {
  id: string;
  name: string;
  models: Model[];
}

export interface Model {
  id: AIModel;
  name: string;
  description: string;
  contextWindow: number;
  costPer1kTokens: number;
  isSelected: boolean;
  onToggle: (id: AIModel) => void;
}

interface ModelProviderProps {
  provider: ModelProvider;
  maxModels?: number;
  selectedCount?: number;
}

export function ModelProviderComponent({ provider, maxModels = 3, selectedCount = 0 }: ModelProviderProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{provider.name}</span>
          <Badge variant="secondary">
            {provider.models.filter(m => m.isSelected).length} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {provider.models.map((model) => {
          const isDisabled = !model.isSelected && selectedCount >= maxModels;
          return (
            <div key={model.id} className={`flex items-start space-x-3 ${isDisabled ? 'opacity-50' : ''}`}>
              <Checkbox
                id={model.id}
                checked={model.isSelected}
                disabled={isDisabled}
                onCheckedChange={() => !isDisabled && model.onToggle(model.id)}
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={model.id}
                  className={`text-sm font-medium leading-none cursor-pointer ${isDisabled ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {model.name}
                  {isDisabled && (
                    <span className="ml-2 text-xs text-amber-600">(Max {maxModels} models)</span>
                  )}
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  {model.description}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                  <span>Context: {model.contextWindow.toLocaleString()} tokens</span>
                  <span>Cost: ${model.costPer1kTokens}/1k tokens</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface ModelSelectorProps {
  selectedModels: AIModel[];
  onModelToggle: (modelId: AIModel) => void;
  maxModels?: number;
}

export function ModelSelector({ selectedModels, onModelToggle, maxModels = 3 }: ModelSelectorProps) {
  // Group models by provider
  const providers: ModelProvider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      models: [
        AIModel.OPENAI_GPT4O,
        AIModel.OPENAI_GPT4O_MINI,
      ].map(modelId => ({
        id: modelId,
        name: ModelMetadata[modelId].name,
        description: ModelMetadata[modelId].description,
        contextWindow: ModelMetadata[modelId].contextWindow,
        costPer1kTokens: ModelMetadata[modelId].costPer1kTokens,
        isSelected: selectedModels.includes(modelId),
        onToggle: onModelToggle,
      })),
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      models: [
        AIModel.ANTHROPIC_CLAUDE35_SONNET,
        AIModel.ANTHROPIC_CLAUDE35_HAIKU,
        AIModel.ANTHROPIC_CLAUDE37_SONNET,
        AIModel.ANTHROPIC_CLAUDE4_SONNET,
        AIModel.ANTHROPIC_CLAUDE4_OPUS,
      ].map(modelId => ({
        id: modelId,
        name: ModelMetadata[modelId].name,
        description: ModelMetadata[modelId].description,
        contextWindow: ModelMetadata[modelId].contextWindow,
        costPer1kTokens: ModelMetadata[modelId].costPer1kTokens,
        isSelected: selectedModels.includes(modelId),
        onToggle: onModelToggle,
      })),
    },
    {
      id: 'xai',
      name: 'xAI',
      models: [
        AIModel.XAI_GROK2,
        AIModel.XAI_GROK3_BETA,
        AIModel.XAI_GROK3_MINI_BETA,
        AIModel.XAI_GROK4,
      ].map(modelId => ({
        id: modelId,
        name: ModelMetadata[modelId].name,
        description: ModelMetadata[modelId].description,
        contextWindow: ModelMetadata[modelId].contextWindow,
        costPer1kTokens: ModelMetadata[modelId].costPer1kTokens,
        isSelected: selectedModels.includes(modelId),
        onToggle: onModelToggle,
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Models</h3>
        <Badge variant="outline">
          {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <ModelProviderComponent 
            key={provider.id} 
            provider={provider} 
            maxModels={maxModels}
            selectedCount={selectedModels.length}
          />
        ))}
      </div>
    </div>
  );
}
