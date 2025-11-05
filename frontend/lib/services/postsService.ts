import {
  postsApi,
  BlogPost,
  PostsListResponse,
  CreatePostRequest,
  UpdatePostRequest,
} from "../api";

/**
 * Posts service - handles business logic for blog posts
 */
export class PostsService {
  /**
   * Load published posts
   */
  async loadPublishedPosts(): Promise<BlogPost[]> {
    const response: PostsListResponse = await postsApi.list(true);
    return response.posts;
  }

  /**
   * Load posts by author
   */
  async loadPostsByAuthor(authorId: string): Promise<BlogPost[]> {
    const response: PostsListResponse = await postsApi.list(
      undefined,
      authorId
    );
    return response.posts;
  }

  /**
   * Load all posts (published and unpublished)
   */
  async loadAllPosts(): Promise<BlogPost[]> {
    const response: PostsListResponse = await postsApi.list();
    return response.posts;
  }

  /**
   * Get a single post by ID
   */
  async getPostById(id: string): Promise<BlogPost> {
    return await postsApi.get(id);
  }

  /**
   * Create a new post
   */
  async createPost(data: CreatePostRequest): Promise<BlogPost> {
    return await postsApi.create(data);
  }

  /**
   * Update an existing post
   */
  async updatePost(id: string, data: UpdatePostRequest): Promise<BlogPost> {
    return await postsApi.update(id, data);
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<void> {
    await postsApi.delete(id);
  }
}

// Export singleton instance
export const postsService = new PostsService();
