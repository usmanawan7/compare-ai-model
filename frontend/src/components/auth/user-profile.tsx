'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAtom } from 'jotai';
import { authAtom } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { Mail, User, Shield, LogOut, Settings, BarChart3, Zap } from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';

export function UserProfile() {
  const [authState, setAuthState] = useAtom(authAtom);
  const router = useRouter();
  const { analyticsData, loading: analyticsLoading, refreshAnalytics } = useAnalytics();

  const handleLogout = () => {
    authService.clearToken();
    localStorage.removeItem('user_data');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push('/login');
  };

  if (!authState.user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Account Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-foreground">{authState.user.email}</p>
              </div>
            </div>
            
            {authState.user.name && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Display Name</label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">{authState.user.name}</p>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Account Status</label>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge variant={authState.user.isEmailVerified ? "default" : "destructive"}>
                {authState.user.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Account Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Account Statistics</span>
            <Button 
              onClick={refreshAnalytics} 
              disabled={analyticsLoading}
              variant="outline" 
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">1</div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {analyticsLoading ? '...' : (analyticsData?.totalComparisons || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Comparisons</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {analyticsLoading ? '...' : (analyticsData?.modelUsage?.length || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Models Tested</div>
            </div>
          </div>
          
          {/* Additional Statistics */}
          {analyticsData && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {analyticsData.totalTokens.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Tokens</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  ${analyticsData.totalCost.toFixed(4)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
