import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatHistoryController } from './chat-history.controller';
import { ChatHistoryService } from './chat-history.service';
import { Comparison, ComparisonSchema } from '../database/schemas/comparison.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comparison.name, schema: ComparisonSchema },
    ]),
  ],
  controllers: [ChatHistoryController],
  providers: [ChatHistoryService],
  exports: [ChatHistoryService],
})
export class ChatHistoryModule {}
