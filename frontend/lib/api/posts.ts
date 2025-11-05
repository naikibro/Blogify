import { request } from "./request";
import {
  BlogPost,
  CreatePostRequest,
  UpdatePostRequest,
  PostsListResponse,
} from "./types";

/**
 * Blog posts API endpoints
 */
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
