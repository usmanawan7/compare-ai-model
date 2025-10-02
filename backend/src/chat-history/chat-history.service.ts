import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comparison, ComparisonDocument } from '../database/schemas/comparison.schema';

export interface ChatHistoryItem {
  id: string;
  sessionId: string;
  prompt: string;
  results: Record<string, any>;
  createdAt: string;
  completedAt: string;
  modelCount: number;
  models: string[];
  totalTokens?: number;
  totalCost?: number;
  averageResponseTime?: number;
}

@Injectable()
export class ChatHistoryService {
  private readonly logger = new Logger(ChatHistoryService.name);

  constructor(
    @InjectModel(Comparison.name) private comparisonModel: Model<ComparisonDocument>,
  ) {}

  async getUserHistory(userId: string): Promise<ChatHistoryItem[]> {
    console.log('Getting history for user:', userId);
    
    const comparisons = await this.comparisonModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log('Found comparisons for user:', comparisons.length);
    
    // Return empty array if no comparisons found for this user
    if (comparisons.length === 0) {
      console.log('No comparisons found for user, returning empty array');
      return [];
    }

    return comparisons.map(comp => this.mapToHistoryItem(comp));
  }

  async getHistoryItem(id: string, userId: string): Promise<ChatHistoryItem> {
    const comparison = await this.comparisonModel.findById(id);
    
    if (!comparison) {
      throw new NotFoundException('History item not found');
    }

    if (comparison.userId !== userId) {
      throw new ForbiddenException('Access denied to this history item');
    }

    return this.mapToHistoryItem(comparison);
  }

  async deleteHistoryItem(id: string, userId: string): Promise<{ message: string }> {
    console.log('DeleteHistoryItem called with:', { id, userId });
    
    const comparison = await this.comparisonModel.findById(id);
    console.log('Found comparison:', { 
      id: comparison?._id, 
      userId: comparison?.userId, 
      requestedUserId: userId 
    });
    
    if (!comparison) {
      console.log('Comparison not found');
      throw new NotFoundException('History item not found');
    }

    if (comparison.userId !== userId) {
      console.log('User ID mismatch:', { 
        comparisonUserId: comparison.userId, 
        requestedUserId: userId 
      });
      throw new ForbiddenException('Access denied to this history item');
    }

    await this.comparisonModel.findByIdAndDelete(id);
    
    this.logger.log(`Deleted history item ${id} for user ${userId}`);
    
    return { message: 'History item deleted successfully' };
  }

  async deleteAllUserHistory(userId: string): Promise<{ message: string; deletedCount: number }> {
    const result = await this.comparisonModel.deleteMany({ userId });
    
    this.logger.log(`Deleted ${result.deletedCount} history items for user ${userId}`);
    
    return { 
      message: 'All history deleted successfully',
      deletedCount: result.deletedCount 
    };
  }

  async createTestData(prompt: string, userId: string, userEmail: string): Promise<{ message: string; id: string }> {
    console.log('Creating test data for:', { prompt, userId, userEmail });
    
    const testComparison = new this.comparisonModel({
      sessionId: 'test-session-' + Date.now(),
      prompt,
      results: new Map([
        ['OpenAI-GPT4o-Mini', {
          model: 'OpenAI-GPT-4o Mini',
          modelId: 'openai-gpt4o-mini',
          response: 'This is a test response from GPT-4o Mini.',
          tokens: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
          timeTakenMs: 1200,
          costEstimateUsd: 0.0001
        }],
        ['Anthropic-Claude35-Sonnet', {
          model: 'Anthropic-Claude 3.5 Sonnet',
          modelId: 'anthropic-claude35-sonnet',
          response: 'This is a test response from Claude 3.5 Sonnet.',
          tokens: { prompt_tokens: 10, completion_tokens: 12, total_tokens: 22 },
          timeTakenMs: 1500,
          costEstimateUsd: 0.0002
        }]
      ]),
      completedAt: new Date(),
      userId,
      userEmail,
    });

    await testComparison.save();
    console.log('Test comparison created with ID:', testComparison._id);
    
    return {
      message: 'Test data created successfully',
      id: testComparison._id.toString()
    };
  }

  private mapToHistoryItem(comp: ComparisonDocument): ChatHistoryItem {
    const results = Object.fromEntries(comp.results);
    const models = Object.keys(results);
    
    return {
      id: comp._id.toString(),
      sessionId: comp.sessionId,
      prompt: comp.prompt,
      results,
      createdAt: (comp as any).createdAt.toISOString(),
      completedAt: comp.completedAt.toISOString(),
      modelCount: models.length,
      models,
      totalTokens: comp.totalTokens || 0,
      totalCost: comp.totalCost || 0,
      averageResponseTime: comp.averageResponseTime || 0,
    };
  }
}
