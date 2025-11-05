/**
 * Shared type definitions for API
 */

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  published: boolean;
  authorId: string;
  authorEmail: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  published?: boolean;
  tags?: string[];
  mediaUrl?: string;
  mediaType?: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  published?: boolean;
  tags?: string[];
  mediaUrl?: string;
  mediaType?: string;
}

export interface PostsListResponse {
  posts: BlogPost[];
  count: number;
}

export interface MediaUploadResponse {
  uploadUrl: string;
  mediaUrl: string;
  key: string;
  expiresIn: number;
}

export interface MediaDownloadResponse {
  downloadUrl: string;
  expiresIn: number;
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
  scanRate: number;
}

export interface DetectionsResponse {
  detections: VirusDetection[];
  count: number;
}
