import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { AIModel } from '../../database/schemas/session.schema';

export class SubmitPromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsArray()
  @IsEnum(AIModel, { each: true })
  models?: AIModel[];
}

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  name?: string;
}

export class ModelResponseDto {
  model: string;
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

export class ComparisonResultDto {
  sessionId: string;
  prompt: string;
  results: Record<string, ModelResponseDto>;
  createdAt: string;
  completedAt: string;
}
