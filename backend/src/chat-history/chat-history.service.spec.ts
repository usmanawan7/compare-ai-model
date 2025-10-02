import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatHistoryService } from './chat-history.service';
import { Comparison } from '../database/schemas/comparison.schema';

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;
  let comparisonModel: any;

  const MockComparisonConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));

  const mockComparisonModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
  };

  // Make the mock model callable as a constructor
  Object.setPrototypeOf(mockComparisonModel, MockComparisonConstructor);
  mockComparisonModel.constructor = MockComparisonConstructor;
  
  // Create a constructor that can be called with 'new'
  const mockComparisonModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'test-id',
    save: jest.fn().mockResolvedValue({ ...data, _id: 'test-id' }),
  }));
  
  // Add static methods to the constructor
  (mockComparisonModelConstructor as any).find = mockComparisonModel.find;
  (mockComparisonModelConstructor as any).findById = mockComparisonModel.findById;
  (mockComparisonModelConstructor as any).findByIdAndDelete = mockComparisonModel.findByIdAndDelete;
  (mockComparisonModelConstructor as any).deleteMany = mockComparisonModel.deleteMany;
  (mockComparisonModelConstructor as any).create = mockComparisonModel.create;

  const mockComparison = {
    _id: '507f1f77bcf86cd799439011',
    sessionId: 'test-session',
    prompt: 'Test prompt',
    results: new Map([
      ['gpt-4', {
        model: 'gpt-4',
        content: 'Test response',
        tokens: { total_tokens: 10 },
        costEstimateUsd: 0.001,
        timeTakenMs: 1000,
      }],
    ]),
    completedAt: new Date(),
    createdAt: new Date(),
    userId: 'user-id',
    userEmail: 'user@example.com',
    totalTokens: 10,
    totalCostUsd: 0.001,
    averageResponseTime: 1000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatHistoryService,
        {
          provide: getModelToken(Comparison.name),
          useValue: mockComparisonModel,
        },
      ],
    }).compile();

    service = module.get<ChatHistoryService>(ChatHistoryService);
    comparisonModel = module.get(getModelToken(Comparison.name));

    // Override the comparisonModel with our mock that has both methods and constructor
    (service as any).comparisonModel = mockComparisonModelConstructor;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserHistory', () => {
    it('should return user history', async () => {
      const userId = 'user-id';
      const mockComparisons = [mockComparison];

      mockComparisonModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockComparisons),
        }),
      });

      const result = await service.getUserHistory(userId);

      expect(mockComparisonModel.find).toHaveBeenCalledWith({ userId });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '507f1f77bcf86cd799439011',
        sessionId: 'test-session',
        prompt: 'Test prompt',
        completedAt: expect.any(String),
        createdAt: expect.any(String),
        modelCount: 1,
        models: ['gpt-4'],
        results: {
          'gpt-4': {
            model: 'gpt-4',
            content: 'Test response',
            tokens: { total_tokens: 10 },
            costEstimateUsd: 0.001,
            timeTakenMs: 1000,
          },
        },
        totalTokens: 10,
        totalCost: 0,
        averageResponseTime: 1000,
      });
    });

    it('should return empty array when no comparisons found', async () => {
      const userId = 'user-id';

      mockComparisonModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.getUserHistory(userId);

      expect(mockComparisonModel.find).toHaveBeenCalledWith({ userId });
      expect(result).toEqual([]);
    });
  });

  describe('getHistoryItem', () => {
    it('should return history item for valid user', async () => {
      const id = '507f1f77bcf86cd799439011';
      const userId = 'user-id';

      mockComparisonModel.findById.mockResolvedValue(mockComparison);

      const result = await service.getHistoryItem(id, userId);

      expect(mockComparisonModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        sessionId: 'test-session',
        prompt: 'Test prompt',
        completedAt: expect.any(String),
        createdAt: expect.any(String),
        modelCount: 1,
        models: ['gpt-4'],
        results: {
          'gpt-4': {
            model: 'gpt-4',
            content: 'Test response',
            tokens: { total_tokens: 10 },
            costEstimateUsd: 0.001,
            timeTakenMs: 1000,
          },
        },
        totalTokens: 10,
        totalCost: 0,
        averageResponseTime: 1000,
      });
    });

    it('should throw NotFoundException when comparison not found', async () => {
      const id = '507f1f77bcf86cd799439011';
      const userId = 'user-id';

      mockComparisonModel.findById.mockResolvedValue(null);

      await expect(
        service.getHistoryItem(id, userId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own comparison', async () => {
      const id = '507f1f77bcf86cd799439011';
      const userId = 'different-user-id';

      mockComparisonModel.findById.mockResolvedValue(mockComparison);

      await expect(
        service.getHistoryItem(id, userId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteHistoryItem', () => {
    it('should delete history item for valid user', async () => {
      const id = '507f1f77bcf86cd799439011';
      const userId = 'user-id';

      mockComparisonModel.findById.mockResolvedValue(mockComparison);
      mockComparisonModel.findByIdAndDelete.mockResolvedValue(mockComparison);

      const result = await service.deleteHistoryItem(id, userId);

      expect(mockComparisonModel.findById).toHaveBeenCalledWith(id);
      expect(mockComparisonModel.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual({ message: 'History item deleted successfully' });
    });

    it('should throw NotFoundException when comparison not found', async () => {
      const id = '507f1f77bcf86cd799439011';
      const userId = 'user-id';

      mockComparisonModel.findById.mockResolvedValue(null);

      await expect(
        service.deleteHistoryItem(id, userId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own comparison', async () => {
      const id = '507f1f77bcf86cd799439011';
      const userId = 'different-user-id';

      mockComparisonModel.findById.mockResolvedValue(mockComparison);

      await expect(
        service.deleteHistoryItem(id, userId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteAllUserHistory', () => {
    it('should delete all user history', async () => {
      const userId = 'user-id';
      const deleteResult = { deletedCount: 5 };

      mockComparisonModel.deleteMany.mockResolvedValue(deleteResult);

      const result = await service.deleteAllUserHistory(userId);

      expect(mockComparisonModel.deleteMany).toHaveBeenCalledWith({ userId });
      expect(result).toEqual({
        message: 'All history deleted successfully',
        deletedCount: 5,
      });
    });
  });

  describe('createTestData', () => {
    it('should create test data', async () => {
      const prompt = 'Test prompt';
      const userId = 'user-id';
      const userEmail = 'user@example.com';

      const mockTestComparison = {
        _id: 'test-id',
        sessionId: 'test-session-123',
        prompt,
        results: new Map(),
        completedAt: new Date(),
        userId,
        userEmail,
        totalTokens: 0,
        totalCostUsd: 0,
        averageResponseTime: 0,
      };

      mockComparisonModel.create.mockResolvedValue(mockTestComparison);

      const result = await service.createTestData(prompt, userId, userEmail);

      expect(mockComparisonModelConstructor).toHaveBeenCalledWith({
        sessionId: expect.stringContaining('test-session-'),
        prompt,
        results: expect.any(Map),
        completedAt: expect.any(Date),
        userId,
        userEmail,
      });

      expect(result).toEqual({
        message: 'Test data created successfully',
        id: 'test-id',
      });
    });
  });

  describe('mapToHistoryItem', () => {
    it('should map comparison to history item correctly', () => {
      const result = service['mapToHistoryItem'](mockComparison as any);

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        sessionId: 'test-session',
        prompt: 'Test prompt',
        completedAt: expect.any(String),
        createdAt: expect.any(String),
        modelCount: 1,
        models: ['gpt-4'],
        results: {
          'gpt-4': {
            model: 'gpt-4',
            content: 'Test response',
            tokens: { total_tokens: 10 },
            costEstimateUsd: 0.001,
            timeTakenMs: 1000,
          },
        },
        totalTokens: 10,
        totalCost: 0,
        averageResponseTime: 1000,
      });
    });
  });
});
