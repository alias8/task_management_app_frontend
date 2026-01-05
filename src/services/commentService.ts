import apiClient from './api';
import type { AddCommentRequest, Comment, PaginatedResponse } from '../types';

export const commentService = {
  addComment: async (
    taskId: string,
    commentRequest: AddCommentRequest
  ): Promise<Comment> => {
    const response = await apiClient.post<Comment>(
      `/api/tasks/${taskId}/comments`,
      commentRequest
    );
    return response.data;
  },

  listComments: async (
    taskId: string,
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<Comment>> => {
    const response = await apiClient.get<PaginatedResponse<Comment>>(
      `/api/tasks/${taskId}/comments`,
      {
        params: { page, size, sort: 'createdAt,asc' },
      }
    );
    return response.data;
  },

  deleteComment: async (taskId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/api/tasks/${taskId}/comments/${commentId}`);
  },
};
