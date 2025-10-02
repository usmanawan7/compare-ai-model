import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../database/schemas/user.schema';
import { EmailService } from './email.service';

export interface OAuthUser {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  provider: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateOAuthUser(oauthUser: OAuthUser): Promise<UserDocument> {
    const { email, googleId, provider } = oauthUser;
    
    // Try to find existing user by email first
    let user = await this.userModel.findOne({ email });
    
    if (user) {
      // Update existing user with Google OAuth info
      user.googleId = googleId;
      user.provider = provider;
      user.lastLoginAt = new Date();
      user.isEmailVerified = true;
      await user.save();
      
      this.logger.log(`Existing user ${email} logged in via ${provider}`);
      return user;
    }

    // Create new user
    const newUser = new this.userModel({
      email: oauthUser.email,
      name: oauthUser.name,
      avatar: oauthUser.avatar,
      isEmailVerified: true,
      lastLoginAt: new Date(),
      provider: oauthUser.provider,
      googleId: oauthUser.googleId,
    });

    const savedUser = await newUser.save();
    this.logger.log(`New user ${email} created via ${provider}`);
    
    return savedUser;
  }

  async validateUser(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId);
  }

  async generateJwtToken(user: UserDocument): Promise<string> {
    const payload = { 
      email: user.email, 
      sub: user._id,
      provider: user.provider 
    };
    return this.jwtService.sign(payload);
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: (user as any).createdAt,
    };
  }

  // Email verification methods
  async sendVerificationCode(email: string, name?: string) {
    try {
      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store verification code in user record (create or update)
      let user = await this.userModel.findOne({ email });
      
      if (!user) {
        // Create new user with verification code
        user = new this.userModel({
          email,
          name: name || null,
          isEmailVerified: false,
          verificationCode,
          verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          provider: 'email',
        });
        await user.save();
        this.logger.log(`New user ${email} created for email verification`);
      } else {
        // Update existing user with new verification code
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();
        this.logger.log(`Verification code updated for existing user ${email}`);
      }

      // Send verification email
      const emailSent = await this.emailService.sendVerificationCode(email, verificationCode, name);
      
      if (emailSent) {
        return {
          success: true,
          message: 'Verification code sent successfully',
        };
      } else {
        return {
          success: false,
          message: 'Failed to send verification code',
        };
      }
    } catch (error) {
      this.logger.error(`Failed to send verification code to ${email}:`, error);
      return {
        success: false,
        message: 'Failed to send verification code',
      };
    }
  }

  async verifyCode(email: string, code: string) {
    try {
      const user = await this.userModel.findOne({ 
        email, 
        verificationCode: code,
        verificationCodeExpires: { $gt: new Date() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired verification code',
        };
      }

      // Mark email as verified and clear verification code
      user.isEmailVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      user.lastLoginAt = new Date();
      await user.save();

      // Generate JWT token
      const token = await this.generateJwtToken(user);

      this.logger.log(`User ${email} verified successfully`);

      return {
        success: true,
        message: 'Email verified successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isEmailVerified: user.isEmailVerified,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to verify code for ${email}:`, error);
      return {
        success: false,
        message: 'Failed to verify code',
      };
    }
  }
}
