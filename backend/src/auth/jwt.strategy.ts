import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-here';
    console.log('JWT Strategy - JWT Secret configured:', jwtSecret ? 'Yes' : 'No');
    console.log('JWT Strategy - Using secret:', jwtSecret);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy - validating payload:', payload);
    const user = await this.authService.validateUser(payload.email);
    if (!user) {
      console.log('JWT Strategy - user not found for email:', payload.email);
      throw new UnauthorizedException();
    }
    console.log('JWT Strategy - user found:', { id: user._id, email: user.email });
    const result = {
      id: user._id.toString(), // Convert ObjectId to string
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
    };
    console.log('JWT Strategy - returning user:', result);
    return result;
  }
}
