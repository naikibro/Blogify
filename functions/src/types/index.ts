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
  publishedStatus?: string; // String version for GSI: "true" or "false"
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  excerpt?: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface MediaItem {
  key: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: number;
  uploadedBy: string;
}

export interface ApiResponse<T = unknown> {
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
  mediaUrl?: string;
  mediaType?: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  published?: boolean;
  tags?: string[];
  excerpt?: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface VirusDetection {
  id: string;
  s3Key: string;
  bucket: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  detectedAt: number;
  threatType: string;
  threatName: string;
  userId?: string;
  userEmail?: string;
  status: "detected" | "quarantined" | "resolved";
}

export interface SecurityMetrics {
  totalFiles: number;
  totalScanned: number;
  threatsDetected: number;
  threatsByType: Record<string, number>;
  recentThreats: VirusDetection[];
  scanRate: number; // percentage
}
