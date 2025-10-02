import { Test, TestingModule } from '@nestjs/testing';
import { BaseModelService, ModelResponse, StreamingCallback } from './base-model.service';
import { AIModel } from '../database/schemas/session.schema';

// Create a concrete implementation for testing
class TestModelService extends BaseModelService {
  readonly modelId = AIModel.OPENAI_GPT4O_MINI;
  readonly modelName = 'test-model';

  async streamResponse(prompt: string, callback: StreamingCallback): Promise<ModelResponse> {
    // Mock implementation
    const response = 'Test response';
    callback.onChunk('Test ');
    callback.onChunk('response');
    callback.onComplete({
      response,
      tokens: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      timeTakenMs: 1000,
      costEstimateUsd: 0.001,
    });
    return {
      response,
      tokens: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      timeTakenMs: 1000,
      costEstimateUsd: 0.001,
    };
  }
}

describe('BaseModelService', () => {
  let service: TestModelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestModelService],
    }).compile();

    service = module.get<TestModelService>(TestModelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have correct model properties', () => {
    expect(service.modelId).toBe(AIModel.OPENAI_GPT4O_MINI);
    expect(service.modelName).toBe('test-model');
  });

  describe('calculateCostEstimate', () => {
    it('should calculate cost correctly', () => {
      const tokens = 1000;
      const costPerToken = 0.001;
      const result = service['calculateCostEstimate'](tokens, costPerToken);
      expect(result).toBe(1.0);
    });

    it('should handle zero tokens', () => {
      const tokens = 0;
      const costPerToken = 0.001;
      const result = service['calculateCostEstimate'](tokens, costPerToken);
      expect(result).toBe(0);
    });
  });

  describe('formatError', () => {
    it('should format API error with response data', () => {
      const error = {
        response: {
          data: {
            error: {
              message: 'API Error',
            },
          },
        },
      };
      const result = service['formatError'](error);
      expect(result).toBe('API Error');
    });

    it('should format error with message', () => {
      const error = { message: 'Simple error' };
      const result = service['formatError'](error);
      expect(result).toBe('Simple error');
    });

    it('should return default message for unknown error', () => {
      const error = {};
      const result = service['formatError'](error);
      expect(result).toBe('Unknown error occurred');
    });
  });

  describe('streamResponse', () => {
    it('should call callback methods correctly', async () => {
      const mockCallback: StreamingCallback = {
        onChunk: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn(),
      };

      const result = await service.streamResponse('test prompt', mockCallback);

      expect(mockCallback.onChunk).toHaveBeenCalledWith('Test ');
      expect(mockCallback.onChunk).toHaveBeenCalledWith('response');
      expect(mockCallback.onComplete).toHaveBeenCalledWith({
        response: 'Test response',
        tokens: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        timeTakenMs: 1000,
        costEstimateUsd: 0.001,
      });
      expect(result).toEqual({
        response: 'Test response',
        tokens: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        timeTakenMs: 1000,
        costEstimateUsd: 0.001,
      });
    });
  });
});
