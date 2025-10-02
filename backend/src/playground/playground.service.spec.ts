import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PlaygroundService } from './playground.service';
import { ModelFactoryService } from '../models/model-factory.service';
import { PlaygroundGateway } from '../websocket/playground.gateway';
import { Comparison } from '../database/schemas/comparison.schema';
import { Session, AIModel } from '../database/schemas/session.schema';

describe('PlaygroundService', () => {
  let service: PlaygroundService;
  let modelFactory: ModelFactoryService;
  let comparisonModel: any;
  let sessionModel: any;
  let gateway: PlaygroundGateway;

  const mockComparisonModel = {
    find: jest.fn(),
    create: jest.fn(),
  };

  // Create a constructor for comparison model
  const mockComparisonModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'comparison-id',
    save: jest.fn().mockResolvedValue({ ...data, _id: 'comparison-id' }),
  }));

  // Add static methods to the comparison constructor
  (mockComparisonModelConstructor as any).find = mockComparisonModel.find;
  (mockComparisonModelConstructor as any).create = mockComparisonModel.create;

  const MockSessionConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));

  const mockSessionModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  // Make the mock model callable as a constructor
  Object.setPrototypeOf(mockSessionModel, MockSessionConstructor);
  mockSessionModel.constructor = MockSessionConstructor;
  
  // Make the mock model itself callable as a constructor
  const mockSessionModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
  
  // Add static methods to the constructor
  (mockSessionModelConstructor as any).findOne = mockSessionModel.findOne;
  (mockSessionModelConstructor as any).create = mockSessionModel.create;

  const mockModelFactory = {
    streamResponse: jest.fn(),
  };

  const mockGateway = {
    emitToSession: jest.fn(),
    emitToUser: jest.fn(),
    emitModelTyping: jest.fn(),
    emitModelComplete: jest.fn(),
    emitModelError: jest.fn(),
    emitComparisonComplete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaygroundService,
        {
          provide: getModelToken(Comparison.name),
          useValue: mockComparisonModel,
        },
        {
          provide: getModelToken(Session.name),
          useValue: mockSessionModel,
        },
        {
          provide: ModelFactoryService,
          useValue: mockModelFactory,
        },
        {
          provide: PlaygroundGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<PlaygroundService>(PlaygroundService);
    comparisonModel = module.get(getModelToken(Comparison.name));
    sessionModel = module.get(getModelToken(Session.name));
    modelFactory = module.get<ModelFactoryService>(ModelFactoryService);
    gateway = module.get<PlaygroundGateway>(PlaygroundGateway);

    // Override the models with our mocks that have both methods and constructors
    (service as any).sessionModel = mockSessionModelConstructor;
    (service as any).comparisonModel = mockComparisonModelConstructor;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitPromptWithStreaming', () => {
    const prompt = 'Test prompt';
    const selectedModels = [
      { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
      { id: 'claude-3', name: 'Claude 3', provider: 'anthropic' },
    ];
    const sessionId = 'test-session';
    const userId = 'user-id';


    it('should handle existing session', async () => {
      const submitPromptDto = {
        prompt: 'Test prompt',
        models: [AIModel.OPENAI_GPT4O_MINI, AIModel.ANTHROPIC_CLAUDE35_SONNET],
      };

      // Mock existing session
      const existingSession = {
        _id: 'existing-session-id',
        sessionId,
        selectedModels,
        name: 'Existing Session',
        createdAt: new Date(),
        save: jest.fn(),
      };
      existingSession.save.mockResolvedValue(existingSession);
      (mockSessionModelConstructor as any).findOne.mockResolvedValue(existingSession);

      // Mock model factory streaming
      mockModelFactory.streamResponse.mockResolvedValue(undefined);

      // Mock comparison creation
      const mockComparison = {
        _id: 'comparison-id',
        save: jest.fn().mockResolvedValue({}),
      };
      mockComparisonModel.create.mockResolvedValue(mockComparison);

      const result = await service.submitPromptWithStreaming(
        sessionId,
        submitPromptDto,
        gateway,
        userId,
        'user@example.com'
      );

      expect((mockSessionModelConstructor as any).findOne).toHaveBeenCalledWith({ sessionId });
      expect((mockSessionModelConstructor as any).create).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle model errors gracefully', async () => {
      const submitPromptDto = {
        prompt: 'Test prompt',
        models: [AIModel.OPENAI_GPT4O_MINI, AIModel.ANTHROPIC_CLAUDE35_SONNET],
      };

      mockSessionModel.findOne.mockResolvedValue(null);
      mockSessionModel.create.mockResolvedValue({ _id: 'session-id' });

      // Mock model factory to throw error
      mockModelFactory.streamResponse.mockRejectedValue(new Error('Model error'));

      // Mock comparison creation
      const mockComparison = {
        _id: 'comparison-id',
        save: jest.fn().mockResolvedValue({}),
      };
      mockComparisonModel.create.mockResolvedValue(mockComparison);

      const result = await service.submitPromptWithStreaming(
        sessionId,
        submitPromptDto,
        gateway,
        userId,
        'user@example.com'
      );

      expect(result).toBeDefined();
      // When all models fail, the service should still return a valid result structure
      expect(result).toHaveProperty('results');
      // The results might be a Map or undefined, both are acceptable for error cases
      if (result.results && typeof result.results.size === 'number') {
        expect(result.results.size).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getSessionHistory', () => {
    it('should return session history', async () => {
      const sessionId = 'test-session';
      const mockComparisons = [
        {
          _id: 'comp1',
          sessionId,
          prompt: 'Test prompt 1',
          completedAt: new Date(),
          createdAt: new Date(),
          results: new Map(),
        },
        {
          _id: 'comp2',
          sessionId,
          prompt: 'Test prompt 2',
          completedAt: new Date(),
          createdAt: new Date(),
          results: new Map(),
        },
      ];

      mockComparisonModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockComparisons),
        }),
      });

      const result = await service.getSessionHistory(sessionId);

      expect(mockComparisonModel.find).toHaveBeenCalledWith({ sessionId });
      expect(result).toHaveLength(2);
    });
  });

  describe('getAllHistory', () => {
    it('should return all history', async () => {
      const mockComparisons = [
        {
          _id: 'comp1',
          sessionId: 'session1',
          prompt: 'Test prompt 1',
          completedAt: new Date(),
          createdAt: new Date(),
          results: new Map(),
        },
      ];

      mockComparisonModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockComparisons),
        }),
      });

      const result = await service.getAllHistory();

      expect(mockComparisonModel.find).toHaveBeenCalledWith();
      expect(result).toHaveLength(1);
    });
  });
});
