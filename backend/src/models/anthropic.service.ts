import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { BaseModelService, ModelResponse, StreamingCallback } from './base-model.service';
import { AIModel } from '../database/schemas/session.schema';

@Injectable()
export class AnthropicService extends BaseModelService {
  readonly modelId = AIModel.ANTHROPIC_CLAUDE35_SONNET;
  readonly modelName = 'claude-3-5-sonnet-20241022';

  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('apiKeys.anthropic');
    if (!apiKey) {
      this.logger.warn('Anthropic API key not found. Service will not be available.');
      return;
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  async streamResponse(
    prompt: string,
    callback: StreamingCallback,
  ): Promise<ModelResponse> {
    if (!this.anthropic) {
      const error = 'Anthropic service not available - API key not configured';
      callback.onError(error);
      return { response: '', timeTakenMs: 0, error };
    }

    const startTime = Date.now();
    let fullResponse = '';
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      const stream = await this.anthropic.messages.create({
        model: this.modelName,
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
            promptTokens = usage.input_tokens || 0;
            completionTokens = usage.output_tokens || 0;
            totalTokens = promptTokens + completionTokens;
          }
        }
      }

      // If no usage was captured, estimate tokens
      if (totalTokens === 0) {
        // Rough estimate: 4 chars per token
        totalTokens = Math.ceil((prompt.length + fullResponse.length) / 4);
        promptTokens = Math.ceil(prompt.length / 4);
        completionTokens = Math.ceil(fullResponse.length / 4);
        
        console.log('Anthropic token estimation:', {
          promptLength: prompt.length,
          responseLength: fullResponse.length,
          promptTokens,
          completionTokens,
          totalTokens,
        });
      }

      const timeTakenMs = Date.now() - startTime;
      const costEstimateUsd = this.calculateCostEstimate(totalTokens, 0.003 / 1000); // Claude 3.5 Sonnet pricing

      const response: ModelResponse = {
        response: fullResponse,
        tokens: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
        timeTakenMs,
        costEstimateUsd,
      };

      console.log('Anthropic service returning response:', {
        model: this.modelName,
        responseLength: fullResponse.length,
        tokens: response.tokens,
        costEstimateUsd: response.costEstimateUsd,
        timeTakenMs: response.timeTakenMs,
      });

      callback.onComplete(response);
      return response;
    } catch (error) {
      const errorMessage = this.formatError(error);
      this.logger.error(`Anthropic streaming error: ${errorMessage}`);
      
      // If it's an authentication error, provide a mock response with estimated tokens
      if (errorMessage.includes('authentication_error') || errorMessage.includes('invalid x-api-key')) {
        const mockResponse = `I'm sorry, but I'm unable to respond right now due to authentication issues. This is a mock response from Anthropic Claude. The prompt was: "${prompt}".`;
        
        // Estimate tokens for the mock response
        const promptTokens = Math.ceil(prompt.length / 4);
        const completionTokens = Math.ceil(mockResponse.length / 4);
        const totalTokens = promptTokens + completionTokens;
        const timeTakenMs = Date.now() - startTime;
        const costEstimateUsd = this.calculateCostEstimate(totalTokens, 0.003 / 1000);
        
        const mockResult = {
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
        
        console.log('Anthropic mock response due to auth error:', mockResult);
        callback.onComplete(mockResult);
        return mockResult;
      }
      
      callback.onError(errorMessage);
      return {
        response: '',
        timeTakenMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }
}
