'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService, SendCodeRequest, VerifyCodeRequest } from '@/services/auth.service';
import { useAtom } from 'jotai';
import { authAtom } from '@/stores/auth.store';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [authState, setAuthState] = useAtom(authAtom);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data: SendCodeRequest = { email };
      if (name.trim()) data.name = name.trim();

      await authService.sendVerificationCode(data);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data: VerifyCodeRequest = { email, code };
      const response = await authService.verifyCode(data);

      if (response.access_token && response.user) {
        // Save token to auth service (which saves to localStorage)
        authService.setToken(response.access_token);
        
        // Save user data to localStorage for persistence
        console.log('LoginForm: Saving user data to localStorage:', response.user);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        console.log('LoginForm: User data saved to localStorage');
        
        setAuthState({
          user: response.user,
          token: response.access_token,
          isAuthenticated: true,
          isLoading: false,
        });
        console.log('LoginForm: Auth state set');
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };


  const resetForm = () => {
    setStep('email');
    setEmail('');
    setName('');
    setCode('');
    setError('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome to AI Playground</CardTitle>
        <CardDescription>
          {step === 'email' && 'Enter your email to get started'}
          {step === 'code' && 'Check your email for the verification code'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name (Optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label htmlFor="verify-code" className="block text-sm font-medium mb-1">
                Verification Code
              </label>
              <input
                id="verify-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                placeholder="123456"
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                We sent a 6-digit code to {email}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </Button>
            </div>
          </form>
        )}

      </CardContent>
    </Card>
  );
}
