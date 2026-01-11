
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Define props for AuthProvider explicitly to help TypeScript with type inference.
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for user in localStorage on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await apiService.login(username, password);
      if (loggedInUser) {
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setUser(null);
      localStorage.removeItem('user');
      throw err; // Re-throw to allow component to handle specific errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    setError(null);
  }, []);

  // Explicitly type the value object to conform to AuthContextType
  const value: AuthContextType = useMemo(() => ({
    user,
    login,
    logout,
    isLoading,
    error,
  }), [user, login, logout, isLoading, error]);

  // Fix: Ensure the opening parenthesis for multi-line JSX immediately follows `return`
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
