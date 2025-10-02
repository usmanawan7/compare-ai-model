import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../database/schemas/user.schema';
import { EmailService } from './email.service';
import { SendVerificationCodeDto, VerifyCodeDto, LoginDto } from '../common/dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async sendVerificationCode(dto: SendVerificationCodeDto): Promise<{ message: string }> {
    const { email, name } = dto;

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if user exists
    let user = await this.userModel.findOne({ email });

    if (user) {
      // Update existing user's verification code
      user.verificationCode = code;
      user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      if (name) user.name = name;
      await user.save();
    } else {
      // Create new user
      user = new this.userModel({
        email,
        name,
        verificationCode: code,
        verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        isEmailVerified: false,
      });
      await user.save();
    }

    // Send verification code via email
    const emailSent = await this.emailService.sendVerificationCode(email, code, name);
    
    if (!emailSent) {
      throw new BadRequestException('Failed to send verification code');
    }

    this.logger.log(`Verification code sent to ${email}`);
    
    return { message: 'Verification code sent to your email' };
  }

  async verifyCode(dto: VerifyCodeDto): Promise<{ message: string; user: any; access_token: string }> {
    const { email, code } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    // Mark email as verified and clear verification code
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token for immediate login
    const payload = { email: user.email, sub: user._id };
    const access_token = this.jwtService.sign(payload);

    this.logger.log(`Email verified and user logged in: ${email}`);

    return {
      message: 'Email verified and logged in successfully',
      access_token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async login(dto: LoginDto): Promise<{ access_token: string; user: any }> {
    const { email, code } = dto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    // Clear verification code and update last login
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const payload = { email: user.email, sub: user._id };
    const access_token = this.jwtService.sign(payload);

    this.logger.log(`User ${email} logged in successfully`);

    return {
      access_token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async validateUser(email: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (user && user.isEmailVerified) {
      const { verificationCode, verificationCodeExpires, ...result } = user.toObject();
      return result;
    }
    return null;
  }
}
