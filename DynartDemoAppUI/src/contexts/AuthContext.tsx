import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

interface AuthContextType {
  isAuthenticated: boolean;
  permissions: string[];
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  const logout = () => {
    apiClient.logout();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, permissions, loading, checkAuth, logout }}>
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
