import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseModelService, ModelResponse, StreamingCallback } from './base-model.service';
import { AIModel } from '../database/schemas/session.schema';

@Injectable()
export class XAIService extends BaseModelService {
  readonly modelId = AIModel.XAI_GROK3_BETA;
  readonly modelName = 'grok-beta';

  private apiKey: string;

  constructor(private configService: ConfigService) {
    super();
    this.apiKey = this.configService.get<string>('apiKeys.xai');
    if (!this.apiKey) {
      this.logger.warn('xAI API key not found. Service will not be available.');
    }
  }

  async streamResponse(
    prompt: string,
    callback: StreamingCallback,
  ): Promise<ModelResponse> {
    if (!this.apiKey) {
      const error = 'xAI service not available - API key not configured';
      callback.onError(error);
      return { response: '', timeTakenMs: 0, error };
    }

    const startTime = Date.now();
    let fullResponse = '';
    let totalTokens = 0;

    try {
      // Mock implementation for xAI since we don't have real API access
      // In a real implementation, you would use the actual xAI API
      this.logger.log('Using mock xAI implementation');
      
      // Simulate streaming response
      const mockResponse = `This is a mock response from xAI's Grok model. The prompt was: "${prompt}". In a real implementation, this would be a streaming response from the actual xAI API.`;
      
      // Simulate character-by-character streaming
      for (let i = 0; i < mockResponse.length; i++) {
        const chunk = mockResponse[i];
        fullResponse += chunk;
        callback.onChunk(chunk);
        
        // Add small delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const timeTakenMs = Date.now() - startTime;
      totalTokens = Math.ceil(fullResponse.length / 4); // Rough token estimation
      const costEstimateUsd = this.calculateCostEstimate(totalTokens, 0.0001 / 1000); // Mock pricing

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
    } catch (error) {
      const errorMessage = this.formatError(error);
      this.logger.error(`xAI streaming error: ${errorMessage}`);
      callback.onError(errorMessage);
      return {
        response: '',
        timeTakenMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }
}
