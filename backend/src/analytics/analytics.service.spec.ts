import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { Comparison } from '../database/schemas/comparison.schema';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let comparisonModel: any;

  const mockComparisonModel = {
    find: jest.fn(),
  };

  const mockComparisons = [
    {
      _id: 'comp1',
      userId: 'user-id',
      sessionId: 'session1',
      prompt: 'Test prompt 1',
      results: new Map([
        ['gpt-4', {
          model: 'gpt-4',
          content: 'Response 1',
          tokens: { total_tokens: 10 },
          costEstimateUsd: 0.001,
          timeTakenMs: 1000,
        }],
      ]),
      completedAt: new Date('2024-01-01'),
      totalTokens: 10,
      totalCost: 0.001,
      averageResponseTime: 1000,
    },
    {
      _id: 'comp2',
      userId: 'user-id',
      sessionId: 'session2',
      prompt: 'Test prompt 2',
      results: new Map([
        ['claude-3', {
          model: 'claude-3',
          content: 'Response 2',
          tokens: { total_tokens: 15 },
          costEstimateUsd: 0.002,
          timeTakenMs: 1500,
        }],
      ]),
      completedAt: new Date('2024-01-02'),
      totalTokens: 15,
      totalCost: 0.002,
      averageResponseTime: 1500,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getModelToken(Comparison.name),
          useValue: mockComparisonModel,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    comparisonModel = module.get(getModelToken(Comparison.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRawComparisons', () => {
    it('should return raw comparisons for user', async () => {
      const userId = 'user-id';

      // Mock the chained query methods - first call returns data, second call returns query with limit
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      
      mockComparisonModel.find
        .mockReturnValueOnce({ sort: jest.fn().mockResolvedValue(mockComparisons) }) // First call: find({ userId }).sort()
        .mockReturnValueOnce(mockQuery); // Second call: find({}).sort().limit()

      const result = await service.getRawComparisons(userId);

      expect(mockComparisonModel.find).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(mockComparisons);
    });
  });

  describe('getUserAnalytics', () => {
    beforeEach(() => {
      // Mock the chained query methods for getUserAnalytics
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      
      mockComparisonModel.find
        .mockReturnValueOnce({ sort: jest.fn().mockResolvedValue(mockComparisons) }) // First call: find({ userId }).sort()
        .mockReturnValueOnce(mockQuery); // Second call: find({}).sort().limit()
    });

    it('should return comprehensive analytics', async () => {
      const result = await service.getUserAnalytics('user-id');

      expect(result.totalComparisons).toBe(2);
      expect(result.totalTokens).toBe(25);
      expect(result.totalCost).toBe(0.003);
      expect(result.averageResponseTime).toBe(1250);
      expect(Array.isArray(result.modelUsage)).toBe(true);
      expect(result.modelUsage).toHaveLength(2);
      expect(result.modelUsage[0]).toHaveProperty('name');
      expect(result.modelUsage[0]).toHaveProperty('count');
      expect(result.modelUsage[0]).toHaveProperty('percentage');
      expect(result.dailyUsage).toBeDefined();
      expect(result.recentActivity).toBeDefined();
    });

  });

  describe('private calculation methods', () => {
    describe('calculateTotalTokensFromAggregated', () => {
      it('should calculate total tokens from aggregated data', () => {
        const result = service['calculateTotalTokensFromAggregated'](mockComparisons as any);
        expect(result).toBe(25);
      });

      it('should handle comparisons without totalTokens', () => {
        const comparisonsWithoutTokens = [
          { ...mockComparisons[0], totalTokens: undefined },
          { ...mockComparisons[1], totalTokens: undefined },
        ];
        const result = service['calculateTotalTokensFromAggregated'](comparisonsWithoutTokens as any);
        expect(result).toBe(0);
      });
    });

    describe('calculateTotalCostFromAggregated', () => {
      it('should calculate total cost from aggregated data', () => {
        const result = service['calculateTotalCostFromAggregated'](mockComparisons as any);
        expect(result).toBe(0.003);
      });
    });

    describe('calculateAverageResponseTimeFromAggregated', () => {
      it('should calculate average response time from aggregated data', () => {
        const result = service['calculateAverageResponseTimeFromAggregated'](mockComparisons as any);
        expect(result).toBe(1250);
      });

      it('should handle empty comparisons', () => {
        const result = service['calculateAverageResponseTimeFromAggregated']([]);
        expect(result).toBe(0);
      });
    });

    describe('calculateModelUsage', () => {
      it('should calculate model usage statistics', () => {
        const result = service['calculateModelUsage'](mockComparisons as any);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('count');
        expect(result[0]).toHaveProperty('percentage');
      });
    });

    describe('calculateDailyUsage', () => {
      it('should calculate daily usage for the past week', () => {
        const result = service['calculateDailyUsage'](mockComparisons as any, new Date());
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(7);
      });
    });

    describe('getRecentActivity', () => {
      it('should return recent activity', () => {
        const result = service['getRecentActivity'](mockComparisons as any);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
      });
    });

    describe('getTimeAgo', () => {
      it('should return "Just now" for recent dates', () => {
        const now = new Date();
        const result = service['getTimeAgo'](now);
        expect(result).toBe('Just now');
      });

      it('should return minutes ago for recent dates', () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const result = service['getTimeAgo'](fiveMinutesAgo);
        expect(result).toBe('5 minutes ago');
      });

      it('should return hours ago for older dates', () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const result = service['getTimeAgo'](twoHoursAgo);
        expect(result).toBe('2 hours ago');
      });

      it('should return days ago for very old dates', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const result = service['getTimeAgo'](threeDaysAgo);
        expect(result).toBe('3 days ago');
      });
    });
  });
});
