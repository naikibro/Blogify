import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, error } from "../utils/response";
import { getAuthUser } from "../utils/auth";
import { CreatePostRequest, UpdatePostRequest } from "../types";
import { validateCreatePost, validateUpdatePost } from "../utils/validation";
import {
  canEditPost,
  canDeletePost,
  canPublishPost,
} from "../utils/authorization";
import { PostService } from "../services/PostService";

const postService = new PostService();

export const create = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const user = await getAuthUser(event);
    if (!user || !user.userId) {
      return error("Unauthorized", 401);
    }

    const body: CreatePostRequest = JSON.parse(event.body || "{}");

    // Validate input
    const validationErrors = validateCreatePost(body);
    if (validationErrors.length > 0) {
      return error(
        {
          message: "Validation failed",
          errors: validationErrors,
        },
        400
      );
    }

    // Check if user can publish posts
    if (body.published && !canPublishPost(user)) {
      return error(
        "You do not have permission to publish posts. Only admins and editors can publish.",
        403
      );
    }

    const post = await postService.createPost(body, user);
    return success(post, 201);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to create post";
    return error(errorMessage, 500);
  }
};

export const get = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return error("Post ID is required", 400);
    }

    const post = await postService.getPostById(id);
    if (!post) {
      return error("Post not found", 404);
    }

    return success(post);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to get post";
    return error(errorMessage, 500);
  }
};

export const list = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const limit = Math.min(
      parseInt(event.queryStringParameters?.limit || "20", 10),
      100
    );

    const result = await postService.listPosts({
      published: event.queryStringParameters?.published,
      authorId: event.queryStringParameters?.authorId,
      limit,
      lastKey: event.queryStringParameters?.lastKey,
    });

    return success(result);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to list posts";
    return error(errorMessage, 500);
  }
};

export const update = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const user = await getAuthUser(event);
    if (!user || !user.userId) {
      return error("Unauthorized", 401);
    }

    const id = event.pathParameters?.id;
    if (!id) {
      return error("Post ID is required", 400);
    }

    // Check if post exists and user can edit it
    const existing = await postService.getPostById(id);
    if (!existing) {
      return error("Post not found", 404);
    }

    // Check authorization using utility
    if (!canEditPost(user, existing)) {
      return error(
        "Forbidden: You do not have permission to edit this post",
        403
      );
    }

    const body: UpdatePostRequest = JSON.parse(event.body || "{}");

    // Validate input
    const validationErrors = validateUpdatePost(body);
    if (validationErrors.length > 0) {
      return error(
        {
          message: "Validation failed",
          errors: validationErrors,
        },
        400
      );
    }

    // Check if user can publish posts
    if (body.published && !canPublishPost(user)) {
      return error(
        "You do not have permission to publish posts. Only admins and editors can publish.",
        403
      );
    }

    const updated = await postService.updatePost(id, body);
    return success(updated);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to update post";
    return error(errorMessage, 500);
  }
};

export const deletePost = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const user = await getAuthUser(event);
    if (!user || !user.userId) {
      return error("Unauthorized", 401);
    }

    const id = event.pathParameters?.id;
    if (!id) {
      return error("Post ID is required", 400);
    }

    // Check if post exists and user can delete it
    const existing = await postService.getPostById(id);
    if (!existing) {
      return error("Post not found", 404);
    }

    // Check authorization using utility
    if (!canDeletePost(user, existing)) {
      return error(
        "Forbidden: You do not have permission to delete this post",
        403
      );
    }

    await postService.deletePost(id);
    return success({ message: "Post deleted successfully" });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to delete post";
    return error(errorMessage, 500);
  }
};
