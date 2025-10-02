'use client';

import { LoginForm } from '@/components/auth/login-form';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAtom } from 'jotai';
import { authAtom } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function LoginContent() {
  const [authState] = useAtom(authAtom);
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated, redirect to playground
    if (authState.isAuthenticated) {
      router.push('/playground');
    }
  }, [authState.isAuthenticated, router]);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to playground...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Multi-Model AI Playground</h1>
          <p className="text-muted-foreground mt-2">Sign in to start comparing AI models</p>
        </div>
        <LoginForm onSuccess={() => router.push('/playground')} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginContent />
    </AuthProvider>
  );
}
