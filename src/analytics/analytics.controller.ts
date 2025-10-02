import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getUserAnalytics(@Request() req) {
    try {
      const userId = req.user.id;
      console.log('Analytics request for user:', userId);
      
      const analytics = await this.analyticsService.getUserAnalytics(userId);
      
      console.log('Analytics data:', {
        totalComparisons: analytics.totalComparisons,
        totalTokens: analytics.totalTokens,
        totalCost: analytics.totalCost,
        averageResponseTime: analytics.averageResponseTime,
        mostUsedModel: analytics.mostUsedModel,
        comparisonsThisWeek: analytics.comparisonsThisWeek,
        comparisonsThisMonth: analytics.comparisonsThisMonth,
        modelUsageCount: analytics.modelUsage.length,
        dailyUsageCount: analytics.dailyUsage.length,
        recentActivityCount: analytics.recentActivity.length,
      });

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      console.error('Error in analytics controller:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch analytics',
      };
    }
  }

  @Get('test')
  async testConnection(@Request() req) {
    return {
      success: true,
      message: 'Analytics service is working',
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
      } : 'No user found',
    };
  }

  @Get('debug')
  async debugData(@Request() req) {
    try {
      const userId = req.user.id;
      console.log('Debug request for user:', userId);
      
      // Get raw comparison data
      const comparisons = await this.analyticsService.getRawComparisons(userId);
      
      return {
        success: true,
        userId,
        totalComparisons: comparisons.length,
        sampleComparison: comparisons.length > 0 ? {
          id: comparisons[0]._id,
          sessionId: comparisons[0].sessionId,
          prompt: comparisons[0].prompt?.substring(0, 100) + '...',
          resultsSize: comparisons[0].results?.size || 0,
          resultsKeys: comparisons[0].results ? Array.from(comparisons[0].results.keys()) : [],
          sampleResult: comparisons[0].results ? Array.from(comparisons[0].results.values())[0] : null,
          createdAt: comparisons[0].createdAt,
          completedAt: comparisons[0].completedAt,
        } : null,
        allComparisons: comparisons.map(comp => ({
          id: comp._id,
          sessionId: comp.sessionId,
          resultsSize: comp.results?.size || 0,
          resultsKeys: comp.results ? Array.from(comp.results.keys()) : [],
        })),
      };
    } catch (error) {
      console.error('Error in debug endpoint:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch debug data',
      };
    }
  }
}
