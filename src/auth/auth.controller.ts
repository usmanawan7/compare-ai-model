import { Controller, Get, Post, UseGuards, Request, Res, HttpStatus, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    const user = req.user;
    const token = await this.authService.generateJwtToken(user);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=google`);
  }


  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req) {
    return this.authService.getUserProfile(req.user.id);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Request() req) {
    return {
      user: req.user,
      message: 'User authenticated successfully',
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout() {
    return {
      message: 'Logged out successfully',
    };
  }

  // Email verification endpoints
  @Post('send-code')
  async sendVerificationCode(@Body() body: { email: string; name?: string }) {
    const { email, name } = body;
    return this.authService.sendVerificationCode(email, name);
  }

  @Post('verify-code')
  async verifyCode(@Body() body: { email: string; code: string }) {
    const { email, code } = body;
    return this.authService.verifyCode(email, code);
  }
}
