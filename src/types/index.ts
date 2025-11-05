export enum UserRole {
  ADMIN = "admin",
  EDITOR = "editor",
  GUEST_AUTHOR = "guest_author",
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorEmail?: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  excerpt?: string;
}

export interface MediaItem {
  key: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: number;
  uploadedBy: string;
}

export interface ApiResponse<T = any> {
  statusCode: number;
  body: T;
  headers?: Record<string, string>;
}

export interface AuthRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  published?: boolean;
  tags?: string[];
  excerpt?: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  published?: boolean;
  tags?: string[];
  excerpt?: string;
}
