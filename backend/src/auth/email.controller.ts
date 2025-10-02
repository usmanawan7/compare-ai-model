import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('test-connection')
  async testConnection() {
    const isConnected = await this.emailService.testConnection();
    return {
      success: isConnected,
      message: isConnected 
        ? 'Email service is connected and ready' 
        : 'Email service connection failed'
    };
  }

  @Post('test')
  @UseGuards(JwtAuthGuard)
  async sendTestEmail(@Body() body: { email: string }) {
    const { email } = body;
    const sent = await this.emailService.sendTestEmail(email);
    
    return {
      success: sent,
      message: sent 
        ? `Test email sent to ${email}` 
        : `Failed to send test email to ${email}`
    };
  }
}
