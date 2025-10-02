import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { SubmitPromptDto } from '../common/dto/playground.dto';
import { PlaygroundService } from '../playground/playground.service';
import { AIModel } from '../database/schemas/session.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PlaygroundGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PlaygroundGateway.name);

  constructor(private readonly playgroundService: PlaygroundService) {}

  afterInit(server: Server) {
    this.logger.log('🚀 Multi-Model AI Playground WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔗 Client connected: ${client.id}`);
    client.emit('connected', { 
      clientId: client.id, 
      timestamp: new Date().toISOString() 
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`👋 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('create_session')
  handleCreateSession(
    @MessageBody() data: { name?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sessionId = uuidv4();
    this.logger.log(`📝 Creating new session: ${sessionId}`);
    
    client.emit('session_created', { 
      sessionId,
      name: data.name || `Session ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('join_session')
  handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`🏠 Client ${client.id} joining session ${data.sessionId}`);
    client.join(`session:${data.sessionId}`);
    client.emit('joined_session', { sessionId: data.sessionId });
  }

  @SubscribeMessage('submit_prompt')
  async handleSubmitPrompt(
    @MessageBody() data: { sessionId: string; prompt: string; models?: AIModel[]; userId?: string; userEmail?: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`📨 Client ${client.id} submitting prompt for session ${data.sessionId}`);
    this.logger.log(`📨 User info: userId=${data.userId}, userEmail=${data.userEmail}`);
    this.logger.log(`📨 Full data received:`, JSON.stringify(data, null, 2));
    
    try {
      // Emit acknowledgment that prompt was received
      this.server.to(`session:${data.sessionId}`).emit('prompt_received', { 
        sessionId: data.sessionId, 
        prompt: data.prompt,
        submittedBy: client.id,
        timestamp: new Date().toISOString()
      });

      // Submit prompt with concurrent streaming
      const submitPromptDto: SubmitPromptDto = { 
        prompt: data.prompt,
        models: data.models || [AIModel.OPENAI_GPT4O_MINI, AIModel.ANTHROPIC_CLAUDE35_SONNET, AIModel.XAI_GROK3_BETA]
      };
      
      await this.playgroundService.submitPromptWithStreaming(
        data.sessionId, 
        submitPromptDto,
        this,
        data.userId,
        data.userEmail
      );
      
      this.logger.log(`✅ Streaming prompt comparison completed for session ${data.sessionId}`);
    } catch (error) {
      this.logger.error(`❌ Error processing prompt for session ${data.sessionId}: ${error.message}`);
      this.server.to(`session:${data.sessionId}`).emit('prompt_error', {
        sessionId: data.sessionId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Real-time streaming events

  emitModelTyping(sessionId: string, modelName: string) {
    this.logger.log(`💭 Model ${modelName} started typing for session ${sessionId}`);
    this.server.to(`session:${sessionId}`).emit('model_typing', {
      model: modelName,
      isTyping: true,
      timestamp: new Date().toISOString(),
    });
  }

  emitModelStream(sessionId: string, modelName: string, chunk: string, progress: { current: number; total: number }) {
    this.server.to(`session:${sessionId}`).emit('model_stream', {
      model: modelName,
      chunk,
      progress,
      timestamp: new Date().toISOString(),
    });
  }

  emitModelComplete(sessionId: string, modelName: string, data: {
    finalResponse: string;
    tokens?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    timeTakenMs: number;
    costEstimateUsd?: number;
    error?: string;
  }) {
    this.logger.log(`✅ Model ${modelName} finished streaming for session ${sessionId} in ${data.timeTakenMs}ms`);
    this.server.to(`session:${sessionId}`).emit('model_complete', {
      model: modelName,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  emitComparisonComplete(sessionId: string, data: any) {
    this.logger.log(`🎊 Emitting final completion for session ${sessionId}`);
    this.server.to(`session:${sessionId}`).emit('comparison_complete', {
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  // Utility methods
  emitToSession(sessionId: string, event: string, data: any) {
    this.server.to(`session:${sessionId}`).emit(event, data);
  }

  getSessionClientCount(sessionId: string): number {
    const room = this.server.sockets.adapter.rooms.get(`session:${sessionId}`);
    return room ? room.size : 0;
  }
}
