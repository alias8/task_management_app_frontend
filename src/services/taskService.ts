import apiClient from './api';
import { Task, CreateTaskRequest, UpdateTaskRequest, PaginatedResponse } from '../types';

export const taskService = {
  getAllTasks: async (page = 0, size = 10): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get<PaginatedResponse<Task>>('/api/tasks', {
      params: { page, size, sort: 'createdAt,desc' },
    });
    return response.data;
  },

  getTaskById: async (id: string): Promise<Task> => {
    const response = await apiClient.get<Task>(`/api/tasks/${id}`);
    return response.data;
  },

  createTask: async (task: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post<Task>('/api/tasks', task);
    return response.data;
  },

  updateTask: async (id: string, task: UpdateTaskRequest): Promise<Task> => {
    const response = await apiClient.put<Task>(`/api/tasks/${id}`, task);
    return response.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/tasks/${id}`);
  },
};
