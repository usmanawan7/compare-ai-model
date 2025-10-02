import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: false })
  name?: string;

  @Prop({ required: false })
  avatar?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ required: false })
  verificationCode?: string;

  @Prop({ required: false })
  verificationCodeExpires?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  lastLoginAt: Date;

  // OAuth provider
  @Prop({ required: false })
  googleId?: string;

  @Prop({ default: 'google' })
  provider: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
