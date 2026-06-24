import { createContext, type ReactNode, use, useEffect, useState } from 'react';
import { userService } from '../services/userService';
import type { CreateUserRequest, LoginRequest } from '../types';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string;
  orgId: string;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: CreateUserRequest) => Promise<void>;
  logout: () => void;
}

interface JwtPayload {
  isAdmin: boolean;
  sub: string; // email
  orgId: string;
  userId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [decodedToken, setDecodedToken] = useState<JwtPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDecodedToken(decoded);
      } catch (error) {
        console.error('Invalid token in localStorage:', error);
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await userService.login(credentials);
    localStorage.setItem('authToken', response.token);
    const decoded: JwtPayload | null = jwtDecode(response.token) ?? null;
    setDecodedToken(decoded);
  };

  const signup = async (userData: CreateUserRequest) => {
    await userService.createUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setDecodedToken(null);
  };

  return (
    <AuthContext
      value={{
        isAuthenticated: !!decodedToken,
        isAdmin: decodedToken?.isAdmin ?? false,
        orgId: decodedToken?.orgId ?? '',
        userId: decodedToken?.userId ?? '',
        loading,
        login,
        signup,
        logout,
      }}
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
