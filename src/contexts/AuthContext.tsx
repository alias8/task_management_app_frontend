import { createContext, type ReactNode, use, useState } from 'react';
import { userService } from '../services/userService';
import type { CreateUserRequest, LoginRequest } from '../types';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: CreateUserRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface JwtPayload {
  isAdmin: boolean;
  sub: string; // email
  orgId: string;
  userId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('authToken');
  const decoded: JwtPayload | null = token ? jwtDecode(token) : null;
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading] = useState(false);

  const login = async (credentials: LoginRequest) => {
    const response = await userService.login(credentials);
    localStorage.setItem('authToken', response.token);
    setIsAuthenticated(true);
    if (decoded) {
      setIsAdmin(decoded.isAdmin);
    }
  };

  const signup = async (userData: CreateUserRequest) => {
    await userService.createUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext
      value={{ isAuthenticated, isAdmin, login, signup, logout, loading }}
    >
      {children}
    </AuthContext>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = use(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
