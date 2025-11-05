import { config } from "./config";

const API_BASE_URL = config.NEXT_PUBLIC_API_URL;

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

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("idToken") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth endpoints
export const authApi = {
  register: async (
    email: string,
    password: string,
    role?: string
  ): Promise<AuthResponse> => {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, ...(role && { role }) }),
    });
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
};

// Posts endpoints
export const postsApi = {
  create: async (data: CreatePostRequest): Promise<BlogPost> => {
    return request<BlogPost>("/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  get: async (id: string): Promise<BlogPost> => {
    return request<BlogPost>(`/posts/${id}`);
  },

  list: async (
    published?: boolean,
    authorId?: string
  ): Promise<PostsListResponse> => {
    const params = new URLSearchParams();
    if (published !== undefined) {
      params.append("published", String(published));
    }
    if (authorId) {
      params.append("authorId", authorId);
    }
    const query = params.toString();
    return request<PostsListResponse>(`/posts${query ? `?${query}` : ""}`);
  },

  update: async (id: string, data: UpdatePostRequest): Promise<BlogPost> => {
    return request<BlogPost>(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return request<void>(`/posts/${id}`, {
      method: "DELETE",
    });
  },
};

// Media endpoints
export const mediaApi = {
  /**
   * Upload a file using presigned URL pattern (recommended AWS approach)
   * 1. Get presigned URL from backend
   * 2. Upload directly to S3
   * 3. Return media information
   */
  upload: async (
    file: File
  ): Promise<{ mediaUrl: string; mediaType: string; key: string }> => {
    // Step 1: Get presigned URL from backend
    const uploadResponse = await request<MediaUploadResponse>("/media/upload", {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });

    // Step 2: Upload file directly to S3 using presigned URL
    const uploadToS3Response = await fetch(uploadResponse.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadToS3Response.ok) {
      throw new Error(
        `Failed to upload file to S3: ${uploadToS3Response.statusText}`
      );
    }

    // Step 3: Return media information
    return {
      mediaUrl: uploadResponse.mediaUrl,
      mediaType: file.type,
      key: uploadResponse.key,
    };
  },

  getDownloadUrl: async (key: string): Promise<MediaDownloadResponse> => {
    return request<MediaDownloadResponse>(`/media/${key}`);
  },
};

// Security endpoints (Admin only)
export const securityApi = {
  getDashboard: async (): Promise<SecurityMetrics> => {
    return request<SecurityMetrics>("/security/dashboard");
  },

  getDetections: async (userId?: string): Promise<DetectionsResponse> => {
    const params = userId ? `?userId=${userId}` : "";
    return request<DetectionsResponse>(`/security/detections${params}`);
  },
};
