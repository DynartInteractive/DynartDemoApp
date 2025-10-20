import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { apiClient } from '../api/client';
import { initGoogleAuth, signInWithGoogle, signOutGoogle } from '../auth/googleAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  permissions: string[];
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initGoogleAuth();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await apiClient.checkAuth();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        const { permissions } = await apiClient.getPermissions();
        setPermissions(permissions);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      if (Capacitor.isNativePlatform()) {
        // Mobile: Use native Google Sign In
        const idToken = await signInWithGoogle();
        const result = await apiClient.loginWithGoogle(idToken);
        setIsAuthenticated(true);
        setPermissions(result.user.permissions);
      } else {
        // Web: Redirect to backend OAuth flow
        window.location.href = '/api/login/google';
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    if (Capacitor.isNativePlatform()) {
      await signOutGoogle();
    }
    await apiClient.logout();
    setIsAuthenticated(false);
    setPermissions([]);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        permissions,
        loading,
        checkAuth,
        logout,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
