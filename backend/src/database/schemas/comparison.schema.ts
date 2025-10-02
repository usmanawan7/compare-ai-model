import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ComparisonDocument = Comparison & Document;

const ModelResultSchema = new MongooseSchema({
  response: { type: String, required: true },
  tokens: {
    prompt_tokens: { type: Number },
    completion_tokens: { type: Number },
    total_tokens: { type: Number },
  },
  timeTakenMs: { type: Number, required: true },
  costEstimateUsd: { type: Number },
  error: { type: String },
}, { _id: false });

@Schema({ timestamps: true })
export class Comparison {
  @Prop({ required: true })
  sessionId: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ type: Map, of: ModelResultSchema })
  results: Map<string, any>;

  @Prop({ type: Date, default: Date.now })
  completedAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ required: false })
  userId?: string;

  @Prop({ required: false })
  userEmail?: string;

  // Prompt-level aggregated data
  @Prop({ type: Number, default: 0 })
  totalTokens?: number;

  @Prop({ type: Number, default: 0 })
  totalCost?: number;

  @Prop({ type: Number, default: 0 })
  averageResponseTime?: number;
}

export const ComparisonSchema = SchemaFactory.createForClass(Comparison);
