import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { User } from '../database/schemas/user.schema';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: JwtService;
  let emailService: EmailService;

  const mockUser = {
    _id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    isEmailVerified: true,
    verificationCode: '123456',
    verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    lastLoginAt: null,
    save: jest.fn(),
    toObject: jest.fn(),
  };

  const MockUserConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  // Make the mock model callable as a constructor
  Object.setPrototypeOf(mockUserModel, MockUserConstructor);
  mockUserModel.constructor = MockUserConstructor;
  
  // Make the mock model itself callable as a constructor
  const mockUserModelConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
  
  // Add static methods to the constructor
  (mockUserModelConstructor as any).findOne = mockUserModel.findOne;
  (mockUserModelConstructor as any).create = mockUserModel.create;
  
  Object.setPrototypeOf(mockUserModel, mockUserModelConstructor);

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);

    // Override the userModel with our mock that has both methods and constructor
    (service as any).userModel = mockUserModelConstructor;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationCode', () => {
    const sendCodeDto = {
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should send verification code to existing user', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockEmailService.sendVerificationCode.mockResolvedValue(true);

      const result = await service.sendVerificationCode(sendCodeDto);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationCode).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        'Test User'
      );
      expect(result).toEqual({ message: 'Verification code sent to your email' });
    });

    it('should create new user and send verification code', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockEmailService.sendVerificationCode.mockResolvedValue(true);

      const result = await service.sendVerificationCode(sendCodeDto);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUserModelConstructor).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        verificationCode: expect.any(String),
        verificationCodeExpires: expect.any(Date),
        isEmailVerified: false,
      });
      expect(mockEmailService.sendVerificationCode).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        'Test User'
      );
      expect(result).toEqual({ message: 'Verification code sent to your email' });
    });

    it('should throw BadRequestException when email sending fails', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockEmailService.sendVerificationCode.mockResolvedValue(false);

      await expect(service.sendVerificationCode(sendCodeDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('verifyCode', () => {
    const verifyCodeDto = {
      email: 'test@example.com',
      code: '123456',
    };

    it('should verify code and return JWT token', async () => {
      const userWithMatchingCode = { ...mockUser, verificationCode: '123456' };
      mockUserModel.findOne.mockResolvedValue(userWithMatchingCode);
      mockUser.save.mockResolvedValue(userWithMatchingCode);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.verifyCode(verifyCodeDto);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id',
        email: 'test@example.com',
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        message: 'Email verified and logged in successfully',
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          isEmailVerified: true,
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.verifyCode(verifyCodeDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when verification code is invalid', async () => {
      const userWithWrongCode = { ...mockUser, verificationCode: 'wrong-code' };
      mockUserModel.findOne.mockResolvedValue(userWithWrongCode);

      await expect(service.verifyCode(verifyCodeDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when verification code is expired', async () => {
      const userWithExpiredCode = {
        ...mockUser,
        verificationCodeExpires: new Date(Date.now() - 1000), // 1 second ago
      };
      mockUserModel.findOne.mockResolvedValue(userWithExpiredCode);

      await expect(service.verifyCode(verifyCodeDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      code: '123456',
    };

    it('should login user with valid credentials', async () => {
      const userWithMatchingCode = { ...mockUser, verificationCode: '123456' };
      mockUserModel.findOne.mockResolvedValue(userWithMatchingCode);
      mockUser.save.mockResolvedValue(userWithMatchingCode);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id',
        email: 'test@example.com',
      });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          isEmailVerified: true,
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when email not verified', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      mockUserModel.findOne.mockResolvedValue(unverifiedUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user when email is verified', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockUser.toObject.mockReturnValue({
        _id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        isEmailVerified: true,
      });

      const result = await service.validateUser('test@example.com');

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual({
        _id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        isEmailVerified: true,
      });
    });

    it('should return null when user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com');

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toBeNull();
    });

    it('should return null when email not verified', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      mockUserModel.findOne.mockResolvedValue(unverifiedUser);

      const result = await service.validateUser('test@example.com');

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toBeNull();
    });
  });
});
