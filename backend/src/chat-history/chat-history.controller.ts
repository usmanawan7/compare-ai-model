import { Controller, Get, Post, Delete, Param, UseGuards, Request, Body } from '@nestjs/common';
import { ChatHistoryService } from './chat-history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat-history')
@UseGuards(JwtAuthGuard)
export class ChatHistoryController {
  constructor(private readonly chatHistoryService: ChatHistoryService) {}

  @Get('test')
  async test() {
    console.log('Test endpoint called');
    return { message: 'Chat history API is working!', timestamp: new Date().toISOString() };
  }

  @Get('debug')
  async debug(@Request() req) {
    console.log('Debug endpoint called');
    console.log('Request user:', req.user);
    return { 
      message: 'Debug info', 
      user: req.user,
      timestamp: new Date().toISOString() 
    };
  }

  @Post('test-data')
  async createTestData(@Body() body: { prompt: string }, @Request() req) {
    const userId = req.user.id;
    const userEmail = req.user.email;
    console.log('Creating test data for user:', { userId, userEmail, prompt: body.prompt });
    return this.chatHistoryService.createTestData(body.prompt, userId, userEmail);
  }

  @Get()
  async getUserHistory(@Request() req) {
    console.log('Chat History Controller - req.user:', req.user);
    console.log('Chat History Controller - req.user.id:', req.user?.id);
    const userId = req.user?.id;
    console.log('Getting history for authenticated user:', userId);
    return this.chatHistoryService.getUserHistory(userId);
  }

  @Get(':id')
  async getHistoryItem(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.chatHistoryService.getHistoryItem(id, userId);
  }

  @Delete(':id')
  async deleteHistoryItem(@Param('id') id: string, @Request() req) {
    console.log('Delete request - req.user:', req.user);
    console.log('Delete request - req.user.id:', req.user?.id);
    const userId = req.user?.id;
    if (!userId) {
      console.log('No user ID found in request');
      throw new Error('User not authenticated');
    }
    return this.chatHistoryService.deleteHistoryItem(id, userId);
  }

  @Delete()
  async deleteAllUserHistory(@Request() req) {
    const userId = req.user.id;
    return this.chatHistoryService.deleteAllUserHistory(userId);
  }
}
