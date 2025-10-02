import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get('cors.origin'),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  const port = configService.get('port');
  await app.listen(port);
  
  console.log(`🚀 Multi-Model AI Playground Backend running on port ${port}`);
  console.log(`📡 WebSocket server ready for real-time streaming`);
  console.log(`🔗 CORS enabled for origins: ${configService.get('cors.origin').join(', ')}`);
}

bootstrap();
