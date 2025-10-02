import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { PlaygroundGateway } from './websocket/playground.gateway';
import { PlaygroundService } from './playground/playground.service';
import { ModelFactoryService } from './models/model-factory.service';
import { AuthModule } from './auth/auth.module';
import { ChatHistoryModule } from './chat-history/chat-history.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { Comparison, ComparisonSchema } from './database/schemas/comparison.schema';
import { Session, SessionSchema } from './database/schemas/session.schema';
import { User, UserSchema } from './database/schemas/user.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-playground',
      }),
    }),
    MongooseModule.forFeature([
      { name: Comparison.name, schema: ComparisonSchema },
      { name: Session.name, schema: SessionSchema },
      { name: User.name, schema: UserSchema },
            ]),
            AuthModule,
            ChatHistoryModule,
            AnalyticsModule,
          ],
  providers: [
    PlaygroundGateway,
    PlaygroundService,
    ModelFactoryService,
  ],
})
export class AppModule {}
