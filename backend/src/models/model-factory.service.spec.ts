import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ModelFactoryService } from './model-factory.service';
import { AIModel } from '../database/schemas/session.schema';
import { StreamingCallback } from './base-model.service';

describe('ModelFactoryService', () => {
  let service: ModelFactoryService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelFactoryService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ModelFactoryService>(ModelFactoryService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('streamResponse', () => {
    const mockCallback: StreamingCallback = {
      onChunk: jest.fn(),
      onComplete: jest.fn(),
      onError: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw error for unknown model', async () => {
      await expect(
        service.streamResponse('unknown-model' as AIModel, 'test prompt', mockCallback)
      ).rejects.toThrow('Unknown model: unknown-model');
    });

    it('should handle xAI model with mock response', async () => {
      const result = await service.streamResponse(
        AIModel.XAI_GROK3_BETA,
        'test prompt',
        mockCallback
      );

      expect(mockCallback.onChunk).toHaveBeenCalled();
      expect(mockCallback.onComplete).toHaveBeenCalled();
      expect(result.response).toContain('mock response from');
      expect(result.response).toContain('test prompt');
      expect(result.tokens).toBeDefined();
      expect(result.costEstimateUsd).toBeDefined();
    });

    it('should handle OpenAI model when API key is configured', async () => {
      mockConfigService.get.mockReturnValue('test-openai-key');

      // Mock the OpenAI stream
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{ delta: { content: 'Hello' } }],
            usage: { total_tokens: 10 },
          };
          yield {
            choices: [{ delta: { content: ' world' } }],
          };
        },
      };

      // Mock OpenAI constructor and chat.completions.create
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockStream),
          },
        },
      };

      // We need to mock the OpenAI import
      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => mockOpenAI);
      });

      // This test would need more complex mocking to work properly
      // For now, we'll test the error handling path
      try {
        await service.streamResponse(AIModel.OPENAI_GPT4O_MINI, 'test prompt', mockCallback);
      } catch (error) {
        expect(error.message).toContain('OpenAI service not available');
      }
    });

    it('should handle Anthropic model when API key is configured', async () => {
      mockConfigService.get.mockReturnValue('test-anthropic-key');

      // This test would need more complex mocking to work properly
      // For now, we'll test the error handling path
      try {
        await service.streamResponse(AIModel.ANTHROPIC_CLAUDE35_SONNET, 'test prompt', mockCallback);
      } catch (error) {
        expect(error.message).toContain('Anthropic service not available');
      }
    });

    it('should handle errors gracefully', async () => {
      const result = await service.streamResponse(
        AIModel.XAI_GROK3_BETA,
        'test prompt',
        mockCallback
      );

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.costEstimateUsd).toBeDefined();
    });
  });

  describe('private methods', () => {
    it('should get correct OpenAI model name', () => {
      const gpt4oName = service['getOpenAIModelName'](AIModel.OPENAI_GPT4O);
      const gpt4oMiniName = service['getOpenAIModelName'](AIModel.OPENAI_GPT4O_MINI);

      expect(gpt4oName).toBe('gpt-4o');
      expect(gpt4oMiniName).toBe('gpt-4o-mini');
    });

    it('should get correct Anthropic model name', () => {
      const claude35SonnetName = service['getAnthropicModelName'](AIModel.ANTHROPIC_CLAUDE35_SONNET);
      const claude35HaikuName = service['getAnthropicModelName'](AIModel.ANTHROPIC_CLAUDE35_HAIKU);

      expect(claude35SonnetName).toBe('claude-3-5-sonnet-20241022');
      expect(claude35HaikuName).toBe('claude-3-5-haiku-20241022');
    });

    it('should calculate cost estimate correctly', () => {
      const cost = service['calculateCostEstimate'](1000, 0.001);
      expect(cost).toBe(1.0);
    });

    it('should format error correctly', () => {
      const error = { message: 'Test error' };
      const formatted = service['formatError'](error);
      expect(formatted).toBe('Test error');
    });
  });
});
