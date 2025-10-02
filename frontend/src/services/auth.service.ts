import { User } from '../stores/auth.store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface SendCodeRequest {
  email: string;
  name?: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface LoginRequest {
  email: string;
  code: string;
}

export interface AuthResponse {
  message: string;
  user?: User;
  access_token?: string;
}

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      console.log('AuthService: Token loaded from localStorage:', this.token);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async sendVerificationCode(data: SendCodeRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyCode(data: VerifyCodeRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.access_token) {
      this.setToken(response.access_token);
    }

    return response;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  async getMe(): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>('/auth/me');
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      console.log('AuthService: Token saved to localStorage:', token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const authService = AuthService.getInstance();
