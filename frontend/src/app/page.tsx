'use client';

import { AuthProvider } from '../components/auth/auth-provider';
import { useAtom } from 'jotai';
import { authAtom } from '../stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function HomeContent() {
  const [authState] = useAtom(authAtom);
  const router = useRouter();

  useEffect(() => {
    if (!authState.isLoading) {
      if (authState.isAuthenticated) {
        router.push('/playground');
      } else {
        router.push('/login');
      }
    }
  }, [authState.isAuthenticated, authState.isLoading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
