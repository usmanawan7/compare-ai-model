import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailEnabled = this.configService.get<string>('EMAIL_SERVICE_ENABLED') === 'true';
    
    if (!emailEnabled) {
      this.logger.warn('📧 Email service is disabled. Set EMAIL_SERVICE_ENABLED=true to enable.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
        port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });

      this.logger.log('📧 Email transporter initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize email transporter:', error);
    }
  }

  async sendVerificationCode(email: string, code: string, name?: string): Promise<boolean> {
    try {
      const emailEnabled = this.configService.get<string>('EMAIL_SERVICE_ENABLED') === 'true';
      
      if (!emailEnabled || !this.transporter) {
        // Fallback to console logging if email is disabled
        this.logger.log(`📧 [CONSOLE MODE] Verification code for ${email}: ${code}`);
        return true;
      }

      const emailContent = this.generateEmailTemplate(code, name);
      const fromEmail = this.configService.get<string>('SMTP_USER') || 'noreply@yourapp.com';

      const mailOptions = {
        from: `"No-Reply - AI Playground" <${fromEmail}>`,
        to: email,
        subject: 'Your AI Playground Verification Code',
        html: emailContent,
        text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`📧 Verification code sent to ${email}. Message ID: ${info.messageId}`);
      
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send verification code to ${email}:`, error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('📧 No email transporter available');
        return false;
      }

      await this.transporter.verify();
      this.logger.log('📧 Email connection test successful');
      return true;
    } catch (error) {
      this.logger.error('❌ Email connection test failed:', error);
      return false;
    }
  }

  async sendTestEmail(to: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('📧 No email transporter available');
        return false;
      }

      const fromEmail = this.configService.get<string>('SMTP_USER') || 'noreply@yourapp.com';
      
      const mailOptions = {
        from: `"AI Playground Test" <${fromEmail}>`,
        to: to,
        subject: 'AI Playground - Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>🎉 Email Test Successful!</h2>
            <p>Your email service is working correctly.</p>
            <p>This is a test email from your AI Playground backend.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Multi-Model AI Playground Team
            </p>
          </div>
        `,
        text: 'Email test successful! Your email service is working correctly.',
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`📧 Test email sent to ${to}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send test email to ${to}:`, error);
      return false;
    }
  }

  private generateEmailTemplate(code: string, name?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🤖 AI Playground</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Multi-Model AI Comparison Platform</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Welcome to AI Playground!</h2>
          ${name ? `<p style="color: #666; font-size: 16px;">Hello <strong>${name}</strong>,</p>` : '<p style="color: #666; font-size: 16px;">Hello,</p>'}
          
          <p style="color: #666; font-size: 16px;">Your verification code is:</p>
          
          <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 25px 0; border-radius: 8px; border: 2px dashed #667eea;">
            ${code}
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              ⏰ <strong>This code will expire in 10 minutes.</strong>
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Multi-Model AI Playground Team<br>
            <a href="#" style="color: #667eea; text-decoration: none;">Visit our platform</a>
          </p>
        </div>
      </div>
    `;
  }
}
