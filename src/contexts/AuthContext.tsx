import { createContext, useContext, useState, ReactNode } from 'react';
import { userService } from '../services/userService';
import { LoginRequest, CreateUserRequest } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: CreateUserRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('authToken');
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading] = useState(false);

  const login = async (credentials: LoginRequest) => {
    const response = await userService.login(credentials);
    localStorage.setItem('authToken', response.token);
    setIsAuthenticated(true);
  };

  const signup = async (userData: CreateUserRequest) => {
    await userService.createUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext value={{ isAuthenticated, login, signup, logout, loading }}>
      {children}
    </AuthContext>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
