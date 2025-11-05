import { postsService } from "../postsService";
import { postsApi } from "../../api/posts";
import {
  BlogPost,
  CreatePostRequest,
  UpdatePostRequest,
} from "../../api/types";

// Mock the API module
jest.mock("../../api/posts", () => ({
  postsApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("PostsService", () => {
  const mockPost: BlogPost = {
    id: "post-123",
    title: "Test Post",
    content: "Test content",
    excerpt: "Test excerpt",
    published: true,
    authorId: "user-123",
    authorEmail: "author@example.com",
    tags: ["test", "blog"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadPublishedPosts", () => {
    it("should load published posts successfully", async () => {
      const mockResponse = {
        posts: [mockPost],
        count: 1,
      };

      (postsApi.list as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postsService.loadPublishedPosts();

      expect(postsApi.list).toHaveBeenCalledTimes(1);
      expect(postsApi.list).toHaveBeenCalledWith(true);
      expect(result).toEqual([mockPost]);
    });

    it("should return empty array when no published posts exist", async () => {
      const mockResponse = {
        posts: [],
        count: 0,
      };

      (postsApi.list as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postsService.loadPublishedPosts();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it("should propagate API errors", async () => {
      const error = new Error("Failed to load posts");
      (postsApi.list as jest.Mock).mockRejectedValue(error);

      await expect(postsService.loadPublishedPosts()).rejects.toThrow(
        "Failed to load posts"
      );
    });
  });

  describe("loadPostsByAuthor", () => {
    it("should load posts by author successfully", async () => {
      const authorId = "user-123";
      const mockResponse = {
        posts: [mockPost],
        count: 1,
      };

      (postsApi.list as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postsService.loadPostsByAuthor(authorId);

      expect(postsApi.list).toHaveBeenCalledTimes(1);
      expect(postsApi.list).toHaveBeenCalledWith(undefined, authorId);
      expect(result).toEqual([mockPost]);
    });

    it("should handle empty author posts", async () => {
      const authorId = "user-456";
      const mockResponse = {
        posts: [],
        count: 0,
      };

      (postsApi.list as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postsService.loadPostsByAuthor(authorId);

      expect(result).toEqual([]);
    });

    it("should propagate API errors", async () => {
      const error = new Error("Failed to load author posts");
      (postsApi.list as jest.Mock).mockRejectedValue(error);

      await expect(postsService.loadPostsByAuthor("user-123")).rejects.toThrow(
        "Failed to load author posts"
      );
    });

    it("should handle invalid author ID", async () => {
      const error = new Error("Invalid author ID");
      (postsApi.list as jest.Mock).mockRejectedValue(error);

      await expect(postsService.loadPostsByAuthor("")).rejects.toThrow(
        "Invalid author ID"
      );
    });
  });

  describe("loadAllPosts", () => {
    it("should load all posts successfully", async () => {
      const mockResponse = {
        posts: [mockPost],
        count: 1,
      };

      (postsApi.list as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postsService.loadAllPosts();

      expect(postsApi.list).toHaveBeenCalledTimes(1);
      expect(postsApi.list).toHaveBeenCalledWith();
      expect(result).toEqual([mockPost]);
    });

    it("should return multiple posts", async () => {
      const mockPosts: BlogPost[] = [
        mockPost,
        { ...mockPost, id: "post-456", title: "Another Post" },
      ];
      const mockResponse = {
        posts: mockPosts,
        count: 2,
      };

      (postsApi.list as jest.Mock).mockResolvedValue(mockResponse);

      const result = await postsService.loadAllPosts();

      expect(result).toEqual(mockPosts);
      expect(result.length).toBe(2);
    });
  });

  describe("getPostById", () => {
    it("should get a post by ID successfully", async () => {
      (postsApi.get as jest.Mock).mockResolvedValue(mockPost);

      const result = await postsService.getPostById("post-123");

      expect(postsApi.get).toHaveBeenCalledTimes(1);
      expect(postsApi.get).toHaveBeenCalledWith("post-123");
      expect(result).toEqual(mockPost);
    });

    it("should throw error when post not found", async () => {
      const error = new Error("Post not found");
      (postsApi.get as jest.Mock).mockRejectedValue(error);

      await expect(postsService.getPostById("non-existent")).rejects.toThrow(
        "Post not found"
      );
    });

    it("should handle invalid post ID", async () => {
      const error = new Error("Invalid post ID");
      (postsApi.get as jest.Mock).mockRejectedValue(error);

      await expect(postsService.getPostById("")).rejects.toThrow(
        "Invalid post ID"
      );
    });
  });

  describe("createPost", () => {
    it("should create a post successfully", async () => {
      const createData: CreatePostRequest = {
        title: "New Post",
        content: "New content",
        published: false,
      };

      (postsApi.create as jest.Mock).mockResolvedValue(mockPost);

      const result = await postsService.createPost(createData);

      expect(postsApi.create).toHaveBeenCalledTimes(1);
      expect(postsApi.create).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockPost);
    });

    it("should create a post with all fields", async () => {
      const createData: CreatePostRequest = {
        title: "New Post",
        content: "New content",
        excerpt: "New excerpt",
        published: true,
        tags: ["tag1", "tag2"],
        mediaUrl: "https://example.com/media.jpg",
        mediaType: "image/jpeg",
      };

      (postsApi.create as jest.Mock).mockResolvedValue(mockPost);

      const result = await postsService.createPost(createData);

      expect(postsApi.create).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockPost);
    });

    it("should propagate validation errors", async () => {
      const createData: CreatePostRequest = {
        title: "",
        content: "Content",
        published: false,
      };
      const error = new Error("Title is required");
      (postsApi.create as jest.Mock).mockRejectedValue(error);

      await expect(postsService.createPost(createData)).rejects.toThrow(
        "Title is required"
      );
    });

    it("should handle network errors", async () => {
      const createData: CreatePostRequest = {
        title: "New Post",
        content: "Content",
        published: false,
      };
      const error = new Error("Network error");
      (postsApi.create as jest.Mock).mockRejectedValue(error);

      await expect(postsService.createPost(createData)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("updatePost", () => {
    it("should update a post successfully", async () => {
      const updateData: UpdatePostRequest = {
        title: "Updated Post",
        content: "Updated content",
      };
      const updatedPost = { ...mockPost, ...updateData };

      (postsApi.update as jest.Mock).mockResolvedValue(updatedPost);

      const result = await postsService.updatePost("post-123", updateData);

      expect(postsApi.update).toHaveBeenCalledTimes(1);
      expect(postsApi.update).toHaveBeenCalledWith("post-123", updateData);
      expect(result).toEqual(updatedPost);
    });

    it("should update a post with partial data", async () => {
      const updateData: UpdatePostRequest = {
        published: true,
      };
      const updatedPost = { ...mockPost, published: true };

      (postsApi.update as jest.Mock).mockResolvedValue(updatedPost);

      const result = await postsService.updatePost("post-123", updateData);

      expect(result.published).toBe(true);
    });

    it("should throw error when post not found", async () => {
      const updateData: UpdatePostRequest = {
        title: "Updated Title",
      };
      const error = new Error("Post not found");
      (postsApi.update as jest.Mock).mockRejectedValue(error);

      await expect(
        postsService.updatePost("non-existent", updateData)
      ).rejects.toThrow("Post not found");
    });

    it("should handle permission errors", async () => {
      const updateData: UpdatePostRequest = {
        title: "Updated Title",
      };
      const error = new Error("Permission denied");
      (postsApi.update as jest.Mock).mockRejectedValue(error);

      await expect(
        postsService.updatePost("post-123", updateData)
      ).rejects.toThrow("Permission denied");
    });
  });

  describe("deletePost", () => {
    it("should delete a post successfully", async () => {
      (postsApi.delete as jest.Mock).mockResolvedValue(undefined);

      await postsService.deletePost("post-123");

      expect(postsApi.delete).toHaveBeenCalledTimes(1);
      expect(postsApi.delete).toHaveBeenCalledWith("post-123");
    });

    it("should throw error when post not found", async () => {
      const error = new Error("Post not found");
      (postsApi.delete as jest.Mock).mockRejectedValue(error);

      await expect(postsService.deletePost("non-existent")).rejects.toThrow(
        "Post not found"
      );
    });

    it("should handle permission errors", async () => {
      const error = new Error("Permission denied");
      (postsApi.delete as jest.Mock).mockRejectedValue(error);

      await expect(postsService.deletePost("post-123")).rejects.toThrow(
        "Permission denied"
      );
    });

    it("should handle invalid post ID", async () => {
      const error = new Error("Invalid post ID");
      (postsApi.delete as jest.Mock).mockRejectedValue(error);

      await expect(postsService.deletePost("")).rejects.toThrow(
        "Invalid post ID"
      );
    });
  });
});
