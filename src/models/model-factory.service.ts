import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { BaseModelService, ModelResponse, StreamingCallback } from './base-model.service';
import { AIModel, ModelMetadata } from '../database/schemas/session.schema';

@Injectable()
export class ModelFactoryService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    const openaiKey = this.configService.get<string>('apiKeys.openai');
    const anthropicKey = this.configService.get<string>('apiKeys.anthropic');

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }
  }

  async streamResponse(
    modelId: AIModel,
    prompt: string,
    callback: StreamingCallback,
  ): Promise<ModelResponse> {
    const metadata = ModelMetadata[modelId];
    if (!metadata) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    const startTime = Date.now();
    let fullResponse = '';
    let totalTokens = 0;

    try {
      switch (metadata.provider) {
        case 'OpenAI':
          return await this.streamOpenAI(modelId, prompt, callback, startTime);
        case 'Anthropic':
          return await this.streamAnthropic(modelId, prompt, callback, startTime);
        case 'xAI':
          return await this.streamXAI(modelId, prompt, callback, startTime);
        default:
          throw new Error(`Unsupported provider: ${metadata.provider}`);
      }
    } catch (error) {
      const errorMessage = this.formatError(error);
      callback.onError(errorMessage);
      return {
        response: '',
        timeTakenMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  private async streamOpenAI(
    modelId: AIModel,
    prompt: string,
    callback: StreamingCallback,
    startTime: number,
  ): Promise<ModelResponse> {
    if (!this.openai) {
      throw new Error('OpenAI service not available - API key not configured');
    }

    const metadata = ModelMetadata[modelId];
    let fullResponse = '';
    let totalTokens = 0;

    const stream = await this.openai.chat.completions.create({
      model: this.getOpenAIModelName(modelId),
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        callback.onChunk(content);
      }

      if (chunk.usage) {
        totalTokens = chunk.usage.total_tokens || 0;
      }
    }

    // OpenAI streaming doesn't provide usage data, so estimate tokens
    if (totalTokens === 0) {
      const promptTokenEstimate = Math.ceil(prompt.length / 4);
      const responseTokenEstimate = Math.ceil(fullResponse.length / 4);
      totalTokens = promptTokenEstimate + responseTokenEstimate;
      
    }

    const timeTakenMs = Date.now() - startTime;
    const costEstimateUsd = this.calculateCostEstimate(totalTokens, metadata.costPer1kTokens / 1000);

    const response: ModelResponse = {
      response: fullResponse,
      tokens: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: Math.ceil(fullResponse.length / 4),
        total_tokens: totalTokens,
      },
      timeTakenMs,
      costEstimateUsd,
    };

    callback.onComplete(response);
    return response;
  }

  private async streamAnthropic(
    modelId: AIModel,
    prompt: string,
    callback: StreamingCallback,
    startTime: number,
  ): Promise<ModelResponse> {
    if (!this.anthropic) {
      // Provide mock response if API key not configured
      const metadata = ModelMetadata[modelId];
      const mockResponse = `I'm sorry, but I'm unable to respond right now due to authentication issues. This is a mock response from ${metadata.name}. The prompt was: "${prompt}".`;
      
      // Simulate streaming
      for (let i = 0; i < mockResponse.length; i++) {
        const chunk = mockResponse[i];
        callback.onChunk(chunk);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const timeTakenMs = Date.now() - startTime;
      const promptTokens = Math.ceil(prompt.length / 4);
      const completionTokens = Math.ceil(mockResponse.length / 4);
      const totalTokens = promptTokens + completionTokens;
      const costEstimateUsd = this.calculateCostEstimate(totalTokens, metadata.costPer1kTokens / 1000);
      
      const response: ModelResponse = {
        response: mockResponse,
        tokens: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
        timeTakenMs,
        costEstimateUsd,
        error: 'Authentication error - using mock response',
      };
      
      callback.onComplete(response);
      return response;
    }

    const metadata = ModelMetadata[modelId];
    let fullResponse = '';
    let totalTokens = 0;

    try {
      const stream = await this.anthropic.messages.create({
        model: this.getAnthropicModelName(modelId),
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        const content = (chunk.delta as any).text;
        if (content) {
          fullResponse += content;
          callback.onChunk(content);
        }
      }

      if (chunk.type === 'message_stop') {
        const usage = (chunk as any).usage;
        if (usage) {
          totalTokens = usage.input_tokens + usage.output_tokens;
        }
      }
    }

    // If no usage was captured, estimate tokens
    if (totalTokens === 0) {
      const promptTokenEstimate = Math.ceil(prompt.length / 4);
      const responseTokenEstimate = Math.ceil(fullResponse.length / 4);
      totalTokens = promptTokenEstimate + responseTokenEstimate;
      
    }

    const timeTakenMs = Date.now() - startTime;
    const costEstimateUsd = this.calculateCostEstimate(totalTokens, metadata.costPer1kTokens / 1000);

    const response: ModelResponse = {
      response: fullResponse,
      tokens: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: Math.ceil(fullResponse.length / 4),
        total_tokens: totalTokens,
      },
      timeTakenMs,
      costEstimateUsd,
    };

    callback.onComplete(response);
    return response;
    } catch (error) {
      // Handle authentication errors by providing mock response
      const errorMessage = this.formatError(error);
      if (errorMessage.includes('authentication_error') || errorMessage.includes('invalid x-api-key')) {
        const mockResponse = `I'm sorry, but I'm unable to respond right now due to authentication issues. This is a mock response from ${metadata.name}. The prompt was: "${prompt}".`;
        
        // Simulate streaming
        for (let i = 0; i < mockResponse.length; i++) {
          const chunk = mockResponse[i];
          callback.onChunk(chunk);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        const timeTakenMs = Date.now() - startTime;
        const promptTokens = Math.ceil(prompt.length / 4);
        const completionTokens = Math.ceil(mockResponse.length / 4);
        const totalTokens = promptTokens + completionTokens;
        const costEstimateUsd = this.calculateCostEstimate(totalTokens, metadata.costPer1kTokens / 1000);
        
        const response: ModelResponse = {
          response: mockResponse,
          tokens: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
          },
          timeTakenMs,
          costEstimateUsd,
          error: 'Authentication error - using mock response',
        };
        
        callback.onComplete(response);
        return response;
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  private async streamXAI(
    modelId: AIModel,
    prompt: string,
    callback: StreamingCallback,
    startTime: number,
  ): Promise<ModelResponse> {
    const metadata = ModelMetadata[modelId];
    let fullResponse = '';

    // Mock implementation for xAI since we don't have real API access
    const mockResponse = `This is a mock response from ${metadata.name}. The prompt was: "${prompt}". In a real implementation, this would be a streaming response from the actual xAI API.`;
    
    // Simulate character-by-character streaming
    for (let i = 0; i < mockResponse.length; i++) {
      const chunk = mockResponse[i];
      fullResponse += chunk;
      callback.onChunk(chunk);
      
      // Add small delay to simulate real streaming
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const timeTakenMs = Date.now() - startTime;
    const totalTokens = Math.ceil(fullResponse.length / 4); // Rough token estimation
    const costEstimateUsd = this.calculateCostEstimate(totalTokens, metadata.costPer1kTokens / 1000);

    const response: ModelResponse = {
      response: fullResponse,
      tokens: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: totalTokens - Math.ceil(prompt.length / 4),
        total_tokens: totalTokens,
      },
      timeTakenMs,
      costEstimateUsd,
    };

    callback.onComplete(response);
    return response;
  }

  private getOpenAIModelName(modelId: AIModel): string {
    switch (modelId) {
      case AIModel.OPENAI_GPT4O:
        return 'gpt-4o';
      case AIModel.OPENAI_GPT4O_MINI:
        return 'gpt-4o-mini';
      default:
        return 'gpt-4o-mini';
    }
  }

  private getAnthropicModelName(modelId: AIModel): string {
    switch (modelId) {
      case AIModel.ANTHROPIC_CLAUDE35_SONNET:
        return 'claude-3-5-sonnet-20241022';
      case AIModel.ANTHROPIC_CLAUDE35_HAIKU:
        return 'claude-3-5-haiku-20241022';
      case AIModel.ANTHROPIC_CLAUDE37_SONNET:
        return 'claude-3-7-sonnet-20241022';
      case AIModel.ANTHROPIC_CLAUDE4_SONNET:
        return 'claude-4-sonnet-20241022';
      case AIModel.ANTHROPIC_CLAUDE4_OPUS:
        return 'claude-4-opus-20241022';
      default:
        return 'claude-3-5-sonnet-20241022';
    }
  }

  private calculateCostEstimate(tokens: number, costPerToken: number): number {
    return tokens * costPerToken;
  }

  private formatError(error: any): string {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }
}
