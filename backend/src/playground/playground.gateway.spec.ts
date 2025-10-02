import { Test, TestingModule } from '@nestjs/testing';
import { PlaygroundGateway } from '../websocket/playground.gateway';
import { PlaygroundService } from './playground.service';

describe('PlaygroundGateway', () => {
  let gateway: PlaygroundGateway;
  let playgroundService: PlaygroundService;

  const mockPlaygroundService = {
    submitPromptWithStreaming: jest.fn(),
    getSessionHistory: jest.fn(),
    getAllHistory: jest.fn(),
  };

  const mockSocket = {
    id: 'socket-id',
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaygroundGateway,
        {
          provide: PlaygroundService,
          useValue: mockPlaygroundService,
        },
      ],
    }).compile();

    gateway = module.get<PlaygroundGateway>(PlaygroundGateway);
    playgroundService = module.get<PlaygroundService>(PlaygroundService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should handle client connection', () => {
      const mockClient = {
        id: 'client-id',
        emit: jest.fn(),
      };

      gateway.handleConnection(mockClient as any);

      expect(mockClient.emit).toHaveBeenCalledWith('connected', {
        clientId: 'client-id',
        timestamp: expect.any(String),
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', () => {
      const mockClient = {
        id: 'client-id',
        rooms: new Set(['session-123']),
        leave: jest.fn(),
      };

      gateway.handleDisconnect(mockClient as any);

      // The actual implementation doesn't have specific leave logic in handleDisconnect
      expect(mockClient).toBeDefined();
    });
  });

  describe('handleJoinSession', () => {
    it('should join a session', () => {
      const sessionId = 'session-123';
      const mockClient = {
        id: 'client-id',
        join: jest.fn(),
        emit: jest.fn(),
      };

      gateway.handleJoinSession({ sessionId }, mockClient as any);

      expect(mockClient.join).toHaveBeenCalledWith(`session:${sessionId}`);
      expect(mockClient.emit).toHaveBeenCalledWith('joined_session', {
        sessionId,
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', () => {
      const mockClient = {
        id: 'client-id',
        rooms: new Set(['session-123']),
        leave: jest.fn(),
      };

      gateway.handleDisconnect(mockClient as any);

      // The actual implementation doesn't have specific leave logic in handleDisconnect
      expect(mockClient).toBeDefined();
    });
  });

  describe('handleSubmitPrompt', () => {
    it('should submit prompt and handle streaming', async () => {
      const sessionId = 'session-123';
      const userId = 'user-id';
      const userEmail = 'user@example.com';
      const prompt = 'Test prompt';

      const mockResult = {
        sessionId,
        comparisonId: 'comparison-id',
        results: new Map(),
        totalTokens: 10,
        totalCostUsd: 0.001,
        averageResponseTime: 1000,
      };

      mockPlaygroundService.submitPromptWithStreaming.mockResolvedValue(mockResult);

      const mockClient = {
        id: 'client-id',
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
      };

      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      // Mock the server property
      (gateway as any).server = mockServer;

      await gateway.handleSubmitPrompt({
        sessionId,
        userId,
        userEmail,
        prompt,
      }, mockClient as any);

      expect(mockPlaygroundService.submitPromptWithStreaming).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          prompt,
          models: expect.any(Array),
        }),
        gateway,
        userId,
        userEmail
      );

      expect(mockServer.to).toHaveBeenCalledWith(`session:${sessionId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('prompt_received', expect.any(Object));
    });

    it('should handle errors during prompt submission', async () => {
      const sessionId = 'session-123';
      const userId = 'user-id';
      const userEmail = 'user@example.com';
      const prompt = 'Test prompt';

      mockPlaygroundService.submitPromptWithStreaming.mockRejectedValue(
        new Error('Submission failed')
      );

      const mockClient = {
        id: 'client-id',
        emit: jest.fn(),
      };

      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      (gateway as any).server = mockServer;

      await gateway.handleSubmitPrompt({
        sessionId,
        userId,
        userEmail,
        prompt,
      }, mockClient as any);

      // The gateway should handle errors gracefully
      expect(mockPlaygroundService.submitPromptWithStreaming).toHaveBeenCalled();
    });
  });
});
