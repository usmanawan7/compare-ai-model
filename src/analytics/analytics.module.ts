import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Comparison, ComparisonSchema } from '../database/schemas/comparison.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comparison.name, schema: ComparisonSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
