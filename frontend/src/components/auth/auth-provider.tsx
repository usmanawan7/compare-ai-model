'use client';

import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { authAtom } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useAtom(authAtom);

  useEffect(() => {
    const initializeAuth = () => {
      console.log('AuthProvider: Initializing auth...');
      const token = authService.getToken();
      console.log('AuthProvider: Token from service:', token);
      
      if (token) {
        // Restore user state from localStorage without validating token
        const userData = localStorage.getItem('user_data');
        console.log('AuthProvider: User data from localStorage:', userData);
        
        if (userData) {
          try {
            const user = JSON.parse(userData);
            console.log('AuthProvider: Parsed user:', user);
            setAuthState({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            console.log('AuthProvider: Set authenticated state');
            return;
          } catch (error) {
            console.error('AuthProvider: Failed to parse user data:', error);
          }
        } else {
          console.log('AuthProvider: No user data found in localStorage');
        }
      } else {
        console.log('AuthProvider: No token found');
      }
      
      // No token or invalid user data, set as not authenticated
      console.log('AuthProvider: Setting not authenticated state');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    };

    initializeAuth();
  }, [setAuthState]);

  return <>{children}</>;
}
