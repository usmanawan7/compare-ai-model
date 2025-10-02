import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { SubmitPromptDto, ComparisonResultDto, ModelResponseDto } from '../common/dto/playground.dto';
import { PlaygroundGateway } from '../websocket/playground.gateway';
import { ModelFactoryService } from '../models/model-factory.service';
import { Comparison, ComparisonDocument } from '../database/schemas/comparison.schema';
import { Session, SessionDocument, AIModel, ModelMetadata } from '../database/schemas/session.schema';

@Injectable()
export class PlaygroundService {
  private readonly logger = new Logger(PlaygroundService.name);

  constructor(
    @InjectModel(Comparison.name) private comparisonModel: Model<ComparisonDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private readonly modelFactory: ModelFactoryService,
  ) {}

  async submitPromptWithStreaming(
    sessionId: string,
    submitPromptDto: SubmitPromptDto,
    gateway: PlaygroundGateway,
    userId?: string,
    userEmail?: string,
  ): Promise<ComparisonResultDto> {
    const { prompt, models = [AIModel.OPENAI_GPT4O_MINI, AIModel.ANTHROPIC_CLAUDE35_SONNET, AIModel.XAI_GROK3_BETA] } = submitPromptDto;
    
    this.logger.log(`🚀 Starting concurrent streaming for session ${sessionId} with models: ${models.join(', ')}`);
    this.logger.log(`🚀 User info received: userId=${userId}, userEmail=${userEmail}`);

    // Create or update session
    await this.ensureSessionExists(sessionId, models);

    const results: Record<string, any> = {};
    const startTime = Date.now();

    // Start all model streams concurrently
    const streamPromises = models.map(async (modelId) => {
      const metadata = ModelMetadata[modelId];
      if (!metadata) {
        this.logger.warn(`Model metadata not found for: ${modelId}`);
        return;
      }

      const modelName = `${metadata.provider}-${metadata.name}`;
      
      try {
        // Emit typing indicator
        gateway.emitModelTyping(sessionId, modelName);

        // Stream response
        const result = await this.modelFactory.streamResponse(modelId, prompt, {
          onChunk: (chunk: string) => {
            // Calculate progress (rough estimation)
            const progress = {
              current: chunk.length,
              total: 1000, // Rough estimate
            };
            gateway.emitModelStream(sessionId, modelName, chunk, progress);
          },
          onComplete: (response: any) => {
            results[modelName] = {
              model: modelName,
              modelId,
              ...response,
            };
            
            gateway.emitModelComplete(sessionId, modelName, {
              finalResponse: response.response,
              tokens: response.tokens,
              timeTakenMs: response.timeTakenMs,
              costEstimateUsd: response.costEstimateUsd,
              error: response.error,
            });
          },
          onError: (error: string) => {
            results[modelName] = {
              model: modelName,
              modelId,
              response: '',
              timeTakenMs: 0,
              error,
            };
            gateway.emitModelComplete(sessionId, modelName, {
              finalResponse: '',
              timeTakenMs: 0,
              error,
            });
          },
        });

        return { modelName, result };
      } catch (error) {
        this.logger.error(`Error streaming from ${modelName}: ${error.message}`);
        const errorResult = {
          model: modelName,
          modelId,
          response: '',
          timeTakenMs: 0,
          error: error.message,
        };
        results[modelName] = errorResult;
        gateway.emitModelComplete(sessionId, modelName, {
          finalResponse: '',
          timeTakenMs: 0,
          error: error.message,
        });
        return { modelName, result: errorResult };
      }
    });

    // Wait for all streams to complete
    await Promise.all(streamPromises);

    const completedAt = new Date().toISOString();
    const totalTime = Date.now() - startTime;

    // Calculate aggregated metrics for this prompt
    let totalTokens = 0;
    let totalCost = 0;
    let totalResponseTime = 0;
    let validResults = 0;

    Object.values(results).forEach((result: any) => {
      if (result && result.tokens && result.tokens.total_tokens) {
        totalTokens += result.tokens.total_tokens;
      }
      if (result && result.costEstimateUsd) {
        totalCost += result.costEstimateUsd;
      }
      if (result && result.timeTakenMs && result.timeTakenMs > 0) {
        totalResponseTime += result.timeTakenMs;
        validResults++;
      }
    });

    const averageResponseTime = validResults > 0 ? totalResponseTime / validResults : 0;

    // Save comparison to database
    console.log('Saving comparison to database:', {
      sessionId,
      prompt: prompt.substring(0, 50) + '...',
      userId,
      userEmail,
      resultsCount: Object.keys(results).length,
      totalTokens,
      totalCost,
      averageResponseTime
    });
    
    const comparison = new this.comparisonModel({
      sessionId,
      prompt,
      results,
      completedAt: new Date(),
      userId,
      userEmail,
      totalTokens,
      totalCost,
      averageResponseTime,
    });

    await comparison.save();
    console.log('Comparison saved successfully with ID:', comparison._id);

    const comparisonResult: ComparisonResultDto = {
      sessionId,
      prompt,
      results,
      createdAt: new Date().toISOString(),
      completedAt,
    };

    // Emit final completion event
    gateway.emitComparisonComplete(sessionId, comparisonResult);

    this.logger.log(`✅ All models completed for session ${sessionId} in ${totalTime}ms`);
    return comparisonResult;
  }

  private async ensureSessionExists(sessionId: string, selectedModels: AIModel[]): Promise<void> {
    const existingSession = await this.sessionModel.findOne({ sessionId });
    if (!existingSession) {
      const session = new this.sessionModel({
        sessionId,
        selectedModels,
        name: `Session ${new Date().toLocaleString()}`,
        isActive: true,
        lastActivity: new Date(),
      });
      await session.save();
      this.logger.log(`📝 Created new session: ${sessionId}`);
    } else {
      // Update last activity and selected models
      existingSession.lastActivity = new Date();
      existingSession.selectedModels = selectedModels;
      await existingSession.save();
    }
  }

  async getSessionHistory(sessionId: string): Promise<ComparisonResultDto[]> {
    const comparisons = await this.comparisonModel
      .find({ sessionId })
      .sort({ completedAt: -1 })
      .limit(50);

    return comparisons.map(comp => ({
      sessionId: comp.sessionId,
      prompt: comp.prompt,
      results: Object.fromEntries(comp.results) as Record<string, ModelResponseDto>,
      createdAt: (comp as any).createdAt.toISOString(),
      completedAt: comp.completedAt.toISOString(),
    }));
  }

  async getAllHistory(): Promise<ComparisonResultDto[]> {
    const comparisons = await this.comparisonModel
      .find()
      .sort({ completedAt: -1 })
      .limit(100);

    return comparisons.map(comp => ({
      sessionId: comp.sessionId,
      prompt: comp.prompt,
      results: Object.fromEntries(comp.results) as Record<string, ModelResponseDto>,
      createdAt: (comp as any).createdAt.toISOString(),
      completedAt: comp.completedAt.toISOString(),
    }));
  }
}
