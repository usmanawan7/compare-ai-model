'use client';

import { UserProfile } from '@/components/auth/user-profile';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAtom } from 'jotai';
import { authAtom } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

function ProfileContent() {
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
              <Link href="/playground">
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="ml-1">Back</span>
                </Button>
              </Link>
              <ThemeToggle />
            </div>
            <h1 className="text-2xl font-bold">User Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your account information</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between mb-4">
              <Link href="/playground">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Playground
                </Button>
              </Link>
              <ThemeToggle />
            </div>
            <h1 className="text-4xl font-bold">User Profile</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-2xl">
          <UserProfile />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ProfileContent />
    </AuthProvider>
  );
}
