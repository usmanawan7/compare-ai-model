import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SendVerificationCodeDto, VerifyCodeDto, LoginDto } from '../common/dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendVerificationCode', () => {
    it('should call authService.sendVerificationCode with correct parameters', async () => {
      const dto: SendVerificationCodeDto = {
        email: 'test@example.com',
        name: 'Test User',
      };
      const expectedResult = { message: 'Verification code sent to your email' };

      mockAuthService.sendVerificationCode.mockResolvedValue(expectedResult);

      const result = await controller.sendVerificationCode(dto);

      expect(authService.sendVerificationCode).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyCode', () => {
    it('should call authService.verifyCode with correct parameters', async () => {
      const dto: VerifyCodeDto = {
        email: 'test@example.com',
        code: '123456',
      };
      const expectedResult = {
        message: 'Email verified and logged in successfully',
        access_token: 'jwt-token',
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          name: 'Test User',
          isEmailVerified: true,
        },
      };

      mockAuthService.verifyCode.mockResolvedValue(expectedResult);

      const result = await controller.verifyCode(dto);

      expect(authService.verifyCode).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        code: '123456',
      };
      const expectedResult = {
        access_token: 'jwt-token',
        user: {
          id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          name: 'Test User',
          isEmailVerified: true,
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getProfile', () => {
    it('should return user from request', () => {
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };
      const mockRequest = { user: mockUser };

      const result = controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });

  describe('getMe', () => {
    it('should return user info with success message', () => {
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };
      const mockRequest = { user: mockUser };

      const result = controller.getMe(mockRequest);

      expect(result).toEqual({
        user: mockUser,
        message: 'User authenticated successfully',
      });
    });
  });
});
