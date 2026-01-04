export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  userId: string;
  orgId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Task {
  taskId: string;
  orgId: string;
  userIdOfCreator: string;
  title: string;
  taskDescription: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  commentId: string;
  taskId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface Organization {
  orgId: string;
  name: string;
  createdAt?: string;
}

export interface CreateOrganizationRequest {
  name: string;
}

export interface LoginToken {
  token: string;
  expiry: number;
  type: string;
}

export interface CreateUserRequest {
  orgId: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  orgId: string;
  email: string;
  password: string;
}

export interface CreateTaskRequest {
  title: string;
  taskDescription?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  taskDescription?: string;
  status?: TaskStatus;
}

export interface AddCommentRequest {
  commentText: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
