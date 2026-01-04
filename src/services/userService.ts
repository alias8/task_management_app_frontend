import apiClient from './api';
import type {
  CreateUserRequest,
  LoginRequest,
  LoginToken,
  User,
} from '../types';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/api/users');
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/api/users/${id}`);
    return response.data;
  },

  createUser: async (user: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/api/users', user);
    return response.data;
  },

  login: async (credentials: LoginRequest): Promise<LoginToken> => {
    const response = await apiClient.post<LoginToken>(
      '/api/users/login',
      credentials
    );
    return response.data;
  },

  getCurrentUser: async (): Promise<{ email: string; message: string }> => {
    const response = await apiClient.get<{ email: string; message: string }>(
      '/api/users/me'
    );
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },
};
