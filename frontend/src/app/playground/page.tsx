'use client';

import { Playground } from '@/components/playground/playground';
import { AuthProvider } from '@/components/auth/auth-provider';
import { useAtom } from 'jotai';
import { authAtom } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { User, History, BarChart3 } from 'lucide-react';

function PlaygroundContent() {
  const [authState] = useAtom(authAtom);
  const router = useRouter();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!authState.isLoading && !authState.isAuthenticated) {
      router.push('/login');
    }
  }, [authState.isAuthenticated, authState.isLoading, router]);

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

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Mobile Header */}
          <div className="block md:hidden mb-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">AI Playground</h1>
              <ThemeToggle />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Compare AI models in real-time
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                Welcome, {authState.user?.name || authState.user?.email}
              </span>
              <div className="flex items-center space-x-2">
                <Link href="/analytics">
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <BarChart3 className="h-3 w-3" />
                    <span className="hidden xs:inline ml-1">Analytics</span>
                  </Button>
                </Link>
                <Link href="/chat-history">
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <History className="h-3 w-3" />
                    <span className="hidden xs:inline ml-1">History</span>
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <User className="h-3 w-3" />
                    <span className="hidden xs:inline ml-1">Profile</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-4xl font-bold">Multi-Model AI Playground</h1>
                <p className="text-muted-foreground">Compare AI models in real-time with concurrent streaming</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {authState.user?.name || authState.user?.email}
                </span>
                <ThemeToggle />
                <Link href="/analytics">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/chat-history">
                  <Button variant="outline" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Playground */}
        <Playground />
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <AuthProvider>
      <PlaygroundContent />
    </AuthProvider>
  );
}
