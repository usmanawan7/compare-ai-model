import { Injectable, Logger } from '@nestjs/common';
import { AIModel } from '../database/schemas/session.schema';

export interface ModelResponse {
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

export interface StreamingCallback {
  onChunk: (chunk: string) => void;
  onComplete: (response: ModelResponse) => void;
  onError: (error: string) => void;
}

@Injectable()
export abstract class BaseModelService {
  protected readonly logger = new Logger(this.constructor.name);

  abstract readonly modelId: AIModel;
  abstract readonly modelName: string;

  abstract streamResponse(
    prompt: string,
    callback: StreamingCallback,
  ): Promise<ModelResponse>;

  protected calculateCostEstimate(tokens: number, costPerToken: number): number {
    return tokens * costPerToken;
  }

  protected formatError(error: any): string {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }
}
