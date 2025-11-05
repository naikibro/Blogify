import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { BlogPost, CreatePostRequest, UpdatePostRequest } from "../../types";
import { CognitoUser } from "../../utils/cognito";
import { dynamoClient } from "../../utils/dynamodb";
import { PostService } from "../PostService";

// Mock the DynamoDB client
jest.mock("../../utils/dynamodb", () => ({
  dynamoClient: {
    send: jest.fn(),
  },
}));

describe("PostService", () => {
  let postService: PostService;
  let mockUser: CognitoUser;

  beforeEach(() => {
    postService = new PostService();
    mockUser = {
      userId: "user-123",
      email: "test@example.com",
      role: "guest_author",
    };
    jest.clearAllMocks();
  });

  describe("createPost", () => {
    const mockPostRequest: CreatePostRequest = {
      title: "Test Post",
      content: "This is a test post content",
      tags: ["test", "blog"],
    };

    it("should create a post successfully", async () => {
      (dynamoClient.send as jest.Mock).mockResolvedValue({});

      const result = await postService.createPost(mockPostRequest, mockUser);

      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: expect.any(String),
            Item: expect.objectContaining({
              title: mockPostRequest.title,
              content: mockPostRequest.content,
              authorId: mockUser.userId,
              authorEmail: mockUser.email,
              published: "false", // Stored as string for GSI compatibility
              publishedStatus: "false",
            }),
          }),
        })
      );

      expect(result.id).toBeDefined();
      expect(result.title).toBe(mockPostRequest.title);
      expect(result.authorId).toBe(mockUser.userId);
      expect(result.published).toBe(false);
    });

    it("should create a published post when published is true", async () => {
      const publishedRequest: CreatePostRequest = {
        ...mockPostRequest,
        published: true,
      };

      (dynamoClient.send as jest.Mock).mockResolvedValue({});

      const result = await postService.createPost(publishedRequest, mockUser);

      expect(result.published).toBe(true);
      expect(result.publishedStatus).toBe("true");
    });

    it("should auto-generate excerpt when not provided", async () => {
      (dynamoClient.send as jest.Mock).mockResolvedValue({});

      const result = await postService.createPost(mockPostRequest, mockUser);

      expect(result.excerpt).toBe(mockPostRequest.content.substring(0, 200));
    });

    it("should use provided excerpt when available", async () => {
      const requestWithExcerpt: CreatePostRequest = {
        ...mockPostRequest,
        excerpt: "Custom excerpt",
      };

      (dynamoClient.send as jest.Mock).mockResolvedValue({});

      const result = await postService.createPost(requestWithExcerpt, mockUser);

      expect(result.excerpt).toBe("Custom excerpt");
    });

    it("should handle empty tags array", async () => {
      const requestWithoutTags: CreatePostRequest = {
        title: "Test",
        content: "Content",
      };

      (dynamoClient.send as jest.Mock).mockResolvedValue({});

      const result = await postService.createPost(requestWithoutTags, mockUser);

      expect(result.tags).toEqual([]);
    });

    it("should throw error when DynamoDB operation fails", async () => {
      const error = new Error("DynamoDB error");
      (dynamoClient.send as jest.Mock).mockRejectedValue(error);

      await expect(
        postService.createPost(mockPostRequest, mockUser)
      ).rejects.toThrow("DynamoDB error");
    });
  });

  describe("getPostById", () => {
    it("should return a post when found", async () => {
      // DynamoDB stores published as string
      const mockDynamoPost = {
        id: "post-123",
        title: "Test Post",
        content: "Content",
        authorId: "user-123",
        published: "false", // Stored as string in DynamoDB
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const expectedPost: BlogPost = {
        ...mockDynamoPost,
        published: false, // Converted to boolean for API
      };

      (dynamoClient.send as jest.Mock).mockResolvedValue({
        Item: mockDynamoPost,
      });

      const result = await postService.getPostById("post-123");

      expect(result).toEqual(expectedPost);
      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: { id: "post-123" },
          }),
        })
      );
    });

    it("should return null when post not found", async () => {
      (dynamoClient.send as jest.Mock).mockResolvedValue({});

      const result = await postService.getPostById("non-existent");

      expect(result).toBeNull();
    });

    it("should handle DynamoDB errors", async () => {
      const error = new Error("DynamoDB error");
      (dynamoClient.send as jest.Mock).mockRejectedValue(error);

      await expect(postService.getPostById("post-123")).rejects.toThrow(
        "DynamoDB error"
      );
    });
  });

  describe("listPosts", () => {
    // DynamoDB returns published as string, but API converts to boolean
    const mockDynamoPosts = [
      {
        id: "post-1",
        title: "Post 1",
        content: "Content 1",
        authorId: "user-123",
        published: "true", // Stored as string in DynamoDB
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: "post-2",
        title: "Post 2",
        content: "Content 2",
        authorId: "user-123",
        published: "false", // Stored as string in DynamoDB
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];
    // `mockPosts` was declared but not used, so it's removed to satisfy the linter.

    it("should list posts by author", async () => {
      (dynamoClient.send as jest.Mock).mockResolvedValue({
        Items: mockDynamoPosts, // DynamoDB returns strings
      });

      const result = await postService.listPosts({
        authorId: "user-123",
        limit: 20,
      });

      expect(result.posts).toHaveLength(2);
      // Verify both posts are present with correct published values (order may vary)
      const publishedValues = result.posts.map((p) => p.published);
      expect(publishedValues).toContain(true);
      expect(publishedValues).toContain(false);
      expect(dynamoClient.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    });

    it("should list published posts using GSI", async () => {
      const publishedDynamoPosts = mockDynamoPosts.filter(
        (p) => p.published === "true"
      );
      (dynamoClient.send as jest.Mock).mockResolvedValue({
        Items: publishedDynamoPosts, // DynamoDB returns strings
      });

      const result = await postService.listPosts({
        published: "true",
        limit: 20,
      });

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].published).toBe(true); // Converted to boolean
    });

    it("should handle pagination with lastKey", async () => {
      (dynamoClient.send as jest.Mock).mockResolvedValue({
        Items: mockDynamoPosts, // DynamoDB returns strings
        LastEvaluatedKey: { id: "post-2", createdAt: 2000 },
      });

      const result = await postService.listPosts({
        limit: 20,
        lastKey: Buffer.from(JSON.stringify({ id: "post-1" })).toString(
          "base64"
        ),
      });

      expect(result.hasMore).toBe(true);
      expect(result.lastKey).toBeDefined();
    });

    it("should scan all posts when no filters provided", async () => {
      (dynamoClient.send as jest.Mock).mockResolvedValue({
        Items: mockDynamoPosts, // DynamoDB returns strings
      });

      const result = await postService.listPosts({ limit: 20 });

      expect(result.posts).toHaveLength(2);
      // Posts are sorted by createdAt descending, so post-2 (2000) comes before post-1 (1000)
      expect(result.posts[0].published).toBe(false); // post-2 has createdAt: 2000
      expect(result.posts[1].published).toBe(true); // post-1 has createdAt: 1000
      expect(dynamoClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
    });

    it("should respect limit parameter", async () => {
      (dynamoClient.send as jest.Mock).mockResolvedValue({
        Items: mockDynamoPosts.slice(0, 1), // DynamoDB returns strings
      });

      const result = await postService.listPosts({ limit: 1 });

      expect(result.posts).toHaveLength(1);
    });

    it("should cap limit at 100", async () => {
      (dynamoClient.send as jest.Mock).mockResolvedValue({
        Items: mockDynamoPosts, // DynamoDB returns strings
      });

      await postService.listPosts({ limit: 200 });

      const callArgs = (dynamoClient.send as jest.Mock).mock.calls[0][0];
      expect(callArgs.input.Limit).toBeLessThanOrEqual(100);
    });

    it("should handle invalid lastKey gracefully", async () => {
      (dynamoClient.send as jest.Mock).mockResolvedValue({
        Items: mockDynamoPosts, // DynamoDB returns strings
      });

      const result = await postService.listPosts({
        limit: 20,
        lastKey: "invalid-base64",
      });

      expect(result.posts).toHaveLength(2);
    });
  });

  describe("updatePost", () => {
    // DynamoDB stores published as string
    const existingDynamoPost = {
      id: "post-123",
      title: "Original Title",
      content: "Original content",
      authorId: "user-123",
      published: "false", // Stored as string in DynamoDB
      createdAt: 1000,
      updatedAt: 1000,
    };

    const existingPost: BlogPost = {
      ...existingDynamoPost,
      published: false, // Converted to boolean for API
    };

    it("should update post successfully", async () => {
      const updates: UpdatePostRequest = {
        title: "Updated Title",
        content: "Updated content",
      };

      const updatedDynamoPost = {
        ...existingDynamoPost,
        ...updates,
        published: existingDynamoPost.published, // Keep as string for DynamoDB
      };

      (dynamoClient.send as jest.Mock)
        .mockResolvedValueOnce({}) // Update command
        .mockResolvedValueOnce({ Item: updatedDynamoPost }); // Get command

      const result = await postService.updatePost("post-123", updates);

      expect(dynamoClient.send).toHaveBeenCalledTimes(2);
      expect(result.title).toBe(updates.title);
    });

    it("should update published status and publishedStatus field", async () => {
      const updates: UpdatePostRequest = {
        published: true,
      };

      const updatedDynamoPost = {
        ...existingDynamoPost,
        published: "true", // Stored as string in DynamoDB
        publishedStatus: "true",
      };

      (dynamoClient.send as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          Item: updatedDynamoPost,
        });

      const result = await postService.updatePost("post-123", updates);

      expect(result.published).toBe(true); // Converted to boolean
      expect(result.publishedStatus).toBe("true");
    });

    it("should auto-generate excerpt when content is updated", async () => {
      const newContent =
        "New content that is longer than 200 characters. ".repeat(10);
      const updates: UpdatePostRequest = {
        content: newContent,
      };

      (dynamoClient.send as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          Item: {
            ...existingDynamoPost,
            content: newContent,
            excerpt: newContent.substring(0, 200),
          },
        });

      const result = await postService.updatePost("post-123", updates);

      expect(result.excerpt).toBe(newContent.substring(0, 200));
    });

    it("should use provided excerpt when content is updated", async () => {
      const updates: UpdatePostRequest = {
        content: "New content",
        excerpt: "Custom excerpt",
      };

      (dynamoClient.send as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          Item: { ...existingDynamoPost, ...updates },
        });

      const result = await postService.updatePost("post-123", updates);

      expect(result.excerpt).toBe("Custom excerpt");
    });

    it("should throw error when post not found after update", async () => {
      const updates: UpdatePostRequest = { title: "New Title" };

      (dynamoClient.send as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}); // Post not found

      await expect(
        postService.updatePost("non-existent", updates)
      ).rejects.toThrow("Post not found after update");
    });

    it("should handle partial updates", async () => {
      const updates: UpdatePostRequest = {
        tags: ["new", "tags"],
      };

      (dynamoClient.send as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          Item: { ...existingDynamoPost, tags: updates.tags },
        });

      const result = await postService.updatePost("post-123", updates);

      expect(result.tags).toEqual(updates.tags);
      expect(result.title).toBe(existingPost.title); // Unchanged
    });
  });

  describe("deletePost", () => {
    it("should delete post successfully", async () => {
      (dynamoClient.send as jest.Mock).mockResolvedValue({});

      await postService.deletePost("post-123");

      expect(dynamoClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: { id: "post-123" },
          }),
        })
      );
    });

    it("should handle DynamoDB errors", async () => {
      const error = new Error("DynamoDB error");
      (dynamoClient.send as jest.Mock).mockRejectedValue(error);

      await expect(postService.deletePost("post-123")).rejects.toThrow(
        "DynamoDB error"
      );
    });
  });
});
