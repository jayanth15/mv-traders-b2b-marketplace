'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { User, authAPI, LoginRequest } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = Cookies.get('token');
        const savedUser = Cookies.get('user');

        if (token && savedUser) {
          // Try to parse saved user first
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Verify with server
          try {
            const currentUser = await authAPI.getCurrentUser();
            setUser(currentUser);
            Cookies.set('user', JSON.stringify(currentUser), { expires: 7 });
          } catch (error) {
            // If verification fails, clear auth
            console.error('Auth verification failed:', error);
            Cookies.remove('token');
            Cookies.remove('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        Cookies.remove('token');
        Cookies.remove('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      // Store token
      Cookies.set('token', response.access_token, { expires: 7 });
      
      // Get user info
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
      Cookies.set('user', JSON.stringify(currentUser), { expires: 7 });

      // Redirect based on organization type
      redirectToDashboard(currentUser);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    router.push('/login');
  };

  const redirectToDashboard = (user: User) => {
    switch (user.organization_type) {
      case 'AppOwner':
        router.push('/dashboard/app-owner');
        break;
      case 'Company':
        router.push('/dashboard/company');
        break;
      case 'Vendor':
        router.push('/dashboard/vendor');
        break;
      default:
        router.push('/dashboard');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
