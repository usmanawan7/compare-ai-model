import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comparison, ComparisonDocument } from '../database/schemas/comparison.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Comparison.name) private comparisonModel: Model<ComparisonDocument>,
  ) {}

  async getRawComparisons(userId: string) {
    console.log('AnalyticsService: Searching for comparisons with userId:', userId);
    const comparisons = await this.comparisonModel.find({ userId }).sort({ createdAt: -1 });
    console.log('AnalyticsService: Found comparisons:', comparisons.length);
    
    // Also check all comparisons to see what userIds exist
    const allComparisons = await this.comparisonModel.find({}).sort({ createdAt: -1 }).limit(5);
    console.log('AnalyticsService: Sample of all comparisons:', allComparisons.map(comp => ({
      id: comp._id,
      userId: comp.userId,
      sessionId: comp.sessionId,
      hasResults: !!comp.results,
      resultsSize: comp.results?.size || 0,
    })));
    
    return comparisons;
  }

  async getUserAnalytics(userId: string) {
    try {
      console.log('AnalyticsService: Getting analytics for user:', userId);
      
      // Get all comparisons for the user
      const comparisons = await this.comparisonModel.find({ userId }).sort({ createdAt: -1 });
      console.log('AnalyticsService: Found comparisons:', comparisons.length);
      
      // Debug: Log sample comparison data
      if (comparisons.length > 0) {
        const sampleComparison = comparisons[0];
        console.log('AnalyticsService: Sample comparison data:', {
          sessionId: sampleComparison.sessionId,
          prompt: sampleComparison.prompt?.substring(0, 50) + '...',
          resultsSize: sampleComparison.results?.size || 0,
          resultsKeys: sampleComparison.results ? Array.from(sampleComparison.results.keys()) : [],
          sampleResult: sampleComparison.results ? Array.from(sampleComparison.results.values())[0] : null,
        });
      }

      // Calculate basic metrics using aggregated data
      const totalComparisons = comparisons.length;
      const totalTokens = this.calculateTotalTokensFromAggregated(comparisons);
      const totalCost = this.calculateTotalCostFromAggregated(comparisons);
      const averageResponseTime = this.calculateAverageResponseTimeFromAggregated(comparisons);

      // Get model usage statistics
      const modelUsage = this.calculateModelUsage(comparisons);

      // Get most used model
      const mostUsedModel = modelUsage.length > 0 ? modelUsage[0].name : 'None';

      // Get time-based statistics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const comparisonsThisWeek = comparisons.filter(
        comp => new Date(comp.createdAt) >= oneWeekAgo
      ).length;

      const comparisonsThisMonth = comparisons.filter(
        comp => new Date(comp.createdAt) >= oneMonthAgo
      ).length;

      // Get daily usage for the past week
      const dailyUsage = this.calculateDailyUsage(comparisons, oneWeekAgo);

      // Get recent activity
      const recentActivity = this.getRecentActivity(comparisons);

      const result = {
        totalComparisons,
        totalTokens,
        totalCost,
        averageResponseTime,
        mostUsedModel,
        comparisonsThisWeek,
        comparisonsThisMonth,
        modelUsage,
        dailyUsage,
        recentActivity,
      };

      console.log('AnalyticsService: Returning analytics result:', result);
      return result;
    } catch (error) {
      console.error('AnalyticsService: Error getting user analytics:', error);
      throw new Error('Failed to fetch analytics data');
    }
  }

  private calculateTotalTokensFromAggregated(comparisons: ComparisonDocument[]): number {
    let totalTokens = 0;
    try {
      comparisons.forEach(comparison => {
        if (comparison.totalTokens) {
          totalTokens += comparison.totalTokens;
          console.log('Added aggregated tokens:', comparison.totalTokens, 'total so far:', totalTokens);
        }
      });
    } catch (error) {
      console.error('Error calculating total tokens from aggregated data:', error);
    }
    console.log('Final total tokens from aggregated data:', totalTokens);
    return totalTokens;
  }

  private calculateTotalCostFromAggregated(comparisons: ComparisonDocument[]): number {
    let totalCost = 0;
    try {
      comparisons.forEach(comparison => {
        if (comparison.totalCost) {
          totalCost += comparison.totalCost;
          console.log('Added aggregated cost:', comparison.totalCost, 'total so far:', totalCost);
        }
      });
    } catch (error) {
      console.error('Error calculating total cost from aggregated data:', error);
    }
    console.log('Final total cost from aggregated data:', totalCost);
    return Math.round(totalCost * 1000000) / 1000000; // Round to 6 decimal places
  }

  private calculateAverageResponseTimeFromAggregated(comparisons: ComparisonDocument[]): number {
    if (comparisons.length === 0) return 0;

    let totalTime = 0;
    let validComparisons = 0;

    try {
      comparisons.forEach(comparison => {
        if (comparison.averageResponseTime && comparison.averageResponseTime > 0) {
          totalTime += comparison.averageResponseTime;
          validComparisons++;
          console.log('Added aggregated response time:', comparison.averageResponseTime, 'total so far:', totalTime, 'count:', validComparisons);
        }
      });
    } catch (error) {
      console.error('Error calculating average response time from aggregated data:', error);
    }

    const avgTime = validComparisons > 0 ? Math.round((totalTime / validComparisons) * 10) / 10 : 0;
    console.log('Final average response time from aggregated data:', avgTime);
    return avgTime;
  }

  private calculateTotalTokens(comparisons: ComparisonDocument[]): number {
    let totalTokens = 0;
    try {
      comparisons.forEach(comparison => {
        if (comparison.results) {
          // Handle Mongoose Map properly
          for (const [key, result] of comparison.results.entries()) {
            console.log('Processing result for key:', key, 'result:', result);
            if (result && result.tokens && result.tokens.total_tokens) {
              totalTokens += result.tokens.total_tokens;
              console.log('Added tokens:', result.tokens.total_tokens, 'total so far:', totalTokens);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error calculating total tokens:', error);
    }
    console.log('Final total tokens:', totalTokens);
    return totalTokens;
  }

  private calculateTotalCost(comparisons: ComparisonDocument[]): number {
    let totalCost = 0;
    try {
      comparisons.forEach(comparison => {
        if (comparison.results) {
          // Handle Mongoose Map properly
          for (const [key, result] of comparison.results.entries()) {
            console.log('Processing cost for key:', key, 'result:', result);
            // Use the costEstimateUsd if available, otherwise calculate from tokens
            if (result && result.costEstimateUsd) {
              totalCost += result.costEstimateUsd;
              console.log('Added cost:', result.costEstimateUsd, 'total so far:', totalCost);
            } else if (result && result.tokens && result.tokens.total_tokens) {
              // Fallback: Rough estimate: $0.002 per 1K tokens
              const estimatedCost = (result.tokens.total_tokens / 1000) * 0.002;
              totalCost += estimatedCost;
              console.log('Added estimated cost:', estimatedCost, 'total so far:', totalCost);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error calculating total cost:', error);
    }
    console.log('Final total cost:', totalCost);
    return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
  }

  private calculateAverageResponseTime(comparisons: ComparisonDocument[]): number {
    if (comparisons.length === 0) return 0;

    let totalTime = 0;
    let validComparisons = 0;

    comparisons.forEach(comparison => {
      if (comparison.results) {
        // Handle Mongoose Map properly
        for (const [key, result] of comparison.results.entries()) {
          console.log('Processing response time for key:', key, 'result:', result);
          if (result && result.timeTakenMs && result.timeTakenMs > 0) {
            const duration = result.timeTakenMs / 1000; // Convert to seconds
            if (duration > 0 && duration < 300) { // Filter out unrealistic times
              totalTime += duration;
              validComparisons++;
              console.log('Added response time:', duration, 'total so far:', totalTime, 'count:', validComparisons);
            }
          }
        }
      }
    });

    const avgTime = validComparisons > 0 ? Math.round((totalTime / validComparisons) * 10) / 10 : 0;
    console.log('Final average response time:', avgTime);
    return avgTime;
  }

  private calculateModelUsage(comparisons: ComparisonDocument[]) {
    const modelCounts: { [key: string]: number } = {};

    comparisons.forEach(comparison => {
      if (comparison.results) {
        // Handle Mongoose Map properly
        for (const [key, result] of comparison.results.entries()) {
          console.log('Processing model usage for key:', key, 'result:', result);
          if (result) {
            // Use the key as the model name since result.model is undefined
            const modelName = key;
            modelCounts[modelName] = (modelCounts[modelName] || 0) + 1;
            console.log('Added model:', modelName, 'count:', modelCounts[modelName]);
          }
        }
      }
    });

    const totalUses = Object.values(modelCounts).reduce((sum, count) => sum + count, 0);
    console.log('Model usage counts:', modelCounts, 'total uses:', totalUses);
    
    return Object.entries(modelCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalUses > 0 ? Math.round((count / totalUses) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateDailyUsage(comparisons: ComparisonDocument[], startDate: Date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyCounts: { [key: string]: number } = {};

    // Initialize all days with 0
    days.forEach(day => {
      dailyCounts[day] = 0;
    });

    comparisons.forEach(comparison => {
      const comparisonDate = new Date(comparison.createdAt);
      if (comparisonDate >= startDate) {
        const dayName = days[comparisonDate.getDay()];
        dailyCounts[dayName]++;
      }
    });

    return days.map(day => ({
      day,
      comparisons: dailyCounts[day],
    }));
  }

  private getRecentActivity(comparisons: ComparisonDocument[]) {
    return comparisons.slice(0, 10).map(comparison => {
      const timeAgo = this.getTimeAgo(new Date(comparison.createdAt));
      const modelCount = comparison.results ? comparison.results.size : 0;
      
      // Get the list of models used
      const modelsUsed: string[] = [];
      if (comparison.results) {
        // Handle Mongoose Map properly
        for (const [key, result] of comparison.results.entries()) {
          if (result && result.model) {
            modelsUsed.push(result.model);
          }
        }
      }
      
      const modelsText = modelsUsed.length > 0 
        ? ` (${modelsUsed.join(', ')})` 
        : '';
      
      return {
        time: timeAgo,
        action: `Compared ${modelCount} model${modelCount !== 1 ? 's' : ''}${modelsText}`,
        prompt: comparison.prompt.length > 60 
          ? `${comparison.prompt.substring(0, 60)}...` 
          : comparison.prompt,
      };
    });
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }
}
