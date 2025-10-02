import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { BaseModelService, ModelResponse, StreamingCallback } from './base-model.service';
import { AIModel, ModelMetadata } from '../database/schemas/session.schema';

@Injectable()
export class OpenAIService extends BaseModelService {
  readonly modelId = AIModel.OPENAI_GPT4O_MINI;
  readonly modelName = 'gpt-4o-mini';

  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('apiKeys.openai');
    if (!apiKey) {
      this.logger.warn('OpenAI API key not found. Service will not be available.');
      return;
    }
    this.openai = new OpenAI({ apiKey });
  }

  async streamResponse(
    prompt: string,
    callback: StreamingCallback,
  ): Promise<ModelResponse> {
    console.log('OpenAI streamResponse called with prompt:', prompt.substring(0, 50) + '...');
    
    if (!this.openai) {
      const error = 'OpenAI service not available - API key not configured';
      callback.onError(error);
      return { response: '', timeTakenMs: 0, error };
    }

    const startTime = Date.now();
    let fullResponse = '';
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      const stream = await this.openai.chat.completions.create({
        model: this.modelName,
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

        // Usage information is typically in the last chunk
        if (chunk.usage) {
          console.log('OpenAI chunk usage found:', chunk.usage);
          totalTokens = chunk.usage.total_tokens || 0;
          promptTokens = chunk.usage.prompt_tokens || 0;
          completionTokens = chunk.usage.completion_tokens || 0;
        }
      }

      // OpenAI streaming doesn't provide usage data, so we need to estimate
      // or make a separate call. For now, let's use estimation.
      console.log('OpenAI token check - totalTokens:', totalTokens, 'promptTokens:', promptTokens, 'completionTokens:', completionTokens);
      
      if (totalTokens === 0) {
        // Estimate tokens based on text length
        // Rough estimate: 1 token ≈ 4 characters for English text
        const promptTokenEstimate = Math.ceil(prompt.length / 4);
        const responseTokenEstimate = Math.ceil(fullResponse.length / 4);
        
        promptTokens = promptTokenEstimate;
        completionTokens = responseTokenEstimate;
        totalTokens = promptTokens + completionTokens;
        
        console.log('OpenAI token estimation:', {
          promptLength: prompt.length,
          responseLength: fullResponse.length,
          promptTokens,
          completionTokens,
          totalTokens,
        });
      }

      const timeTakenMs = Date.now() - startTime;
      const costEstimateUsd = this.calculateCostEstimate(totalTokens, 0.00015 / 1000); // GPT-4o-mini pricing

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

      console.log('OpenAI service returning response:', {
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
      this.logger.error(`OpenAI streaming error: ${errorMessage}`);
      callback.onError(errorMessage);
      return {
        response: '',
        timeTakenMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }
}
