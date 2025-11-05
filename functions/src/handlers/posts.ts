import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { dynamoClient } from "../utils/dynamodb";
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  QueryCommandInput,
  ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { success, error } from "../utils/response";
import { getAuthUser } from "../utils/auth";
import { CreatePostRequest, UpdatePostRequest, BlogPost } from "../types";
import { validateCreatePost, validateUpdatePost } from "../utils/validation";
import {
  canEditPost,
  canDeletePost,
  canPublishPost,
} from "../utils/authorization";

const POSTS_TABLE = process.env.POSTS_TABLE || "";

export const create = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const user = await getAuthUser(event);
    if (!user || !user.userId) {
      return error("Unauthorized", 401);
    }

    const body: CreatePostRequest = JSON.parse(event.body || "{}");
    const {
      title,
      content,
      published = false,
      tags,
      excerpt,
      mediaUrl,
      mediaType,
    } = body;

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
    if (published && !canPublishPost(user)) {
      return error(
        "You do not have permission to publish posts. Only admins and editors can publish.",
        403
      );
    }

    const id = uuidv4();
    const now = Date.now();

    const post: BlogPost = {
      id,
      title,
      content,
      authorId: user.userId,
      authorEmail: user.email,
      published,
      publishedStatus: published ? "true" : "false", // For GSI
      createdAt: now,
      updatedAt: now,
      tags: tags || [],
      excerpt: excerpt || content.substring(0, 200),
      mediaUrl,
      mediaType,
    };

    await dynamoClient.send(
      new PutCommand({
        TableName: POSTS_TABLE,
        Item: post,
      })
    );

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

    const result = await dynamoClient.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { id },
      })
    );

    if (!result.Item) {
      return error("Post not found", 404);
    }

    return success(result.Item as BlogPost);
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
    const published = event.queryStringParameters?.published;
    const authorId = event.queryStringParameters?.authorId;

    // Pagination parameters
    const limit = Math.min(
      parseInt(event.queryStringParameters?.limit || "20", 10),
      100
    ); // Max 100 items per page
    const lastKey = event.queryStringParameters?.lastKey; // Cursor for pagination

    let result;
    let posts: BlogPost[] = [];

    if (authorId) {
      // Query by author using GSI
      const queryParams: QueryCommandInput = {
        TableName: POSTS_TABLE,
        IndexName: "authorId-createdAt-index",
        KeyConditionExpression: "authorId = :authorId",
        ExpressionAttributeValues: { ":authorId": authorId },
        ScanIndexForward: false,
        Limit: limit,
      };

      // Add FilterExpression for published status if specified
      if (published === "true" || published === "false") {
        queryParams.FilterExpression = "published = :published";
        queryParams.ExpressionAttributeValues = {
          ...queryParams.ExpressionAttributeValues,
          ":published": published === "true",
        };
      }

      // Add pagination cursor
      if (lastKey) {
        try {
          queryParams.ExclusiveStartKey = JSON.parse(
            Buffer.from(lastKey, "base64").toString()
          );
        } catch {
          // Invalid cursor, ignore
        }
      }

      result = await dynamoClient.send(new QueryCommand(queryParams));
      posts = (result.Items || []) as BlogPost[];
    } else if (published === "true" || published === "false") {
      // Use published GSI for efficient filtering
      const queryParams: QueryCommandInput = {
        TableName: POSTS_TABLE,
        IndexName: "published-createdAt-index",
        KeyConditionExpression: "publishedStatus = :publishedStatus",
        ExpressionAttributeValues: {
          ":publishedStatus": published === "true" ? "true" : "false",
        },
        ScanIndexForward: false,
        Limit: limit,
      };

      // Add pagination cursor
      if (lastKey) {
        try {
          queryParams.ExclusiveStartKey = JSON.parse(
            Buffer.from(lastKey, "base64").toString()
          );
        } catch {
          // Invalid cursor, ignore
        }
      }

      result = await dynamoClient.send(new QueryCommand(queryParams));
      posts = (result.Items || []) as BlogPost[];
    } else {
      // Scan all posts (use sparingly)
      const scanParams: ScanCommandInput = {
        TableName: POSTS_TABLE,
        Limit: limit,
      };

      // Add pagination cursor
      if (lastKey) {
        try {
          scanParams.ExclusiveStartKey = JSON.parse(
            Buffer.from(lastKey, "base64").toString()
          );
        } catch {
          // Invalid cursor, ignore
        }
      }

      result = await dynamoClient.send(new ScanCommand(scanParams));
      posts = (result.Items || []) as BlogPost[];

      // Sort by createdAt descending
      posts.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Build response with pagination info
    const response: {
      posts: BlogPost[];
      count: number;
      hasMore: boolean;
      lastKey?: string;
    } = {
      posts,
      count: posts.length,
      hasMore: false,
    };

    // Add pagination cursor if there are more items
    if (result.LastEvaluatedKey) {
      response.lastKey = Buffer.from(
        JSON.stringify(result.LastEvaluatedKey)
      ).toString("base64");
      response.hasMore = true;
    } else {
      response.hasMore = false;
    }

    return success(response);
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

    // Check if post exists and user owns it
    const existing = await dynamoClient.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { id },
      })
    );

    if (!existing.Item) {
      return error("Post not found", 404);
    }

    const post = existing.Item as BlogPost;

    // Check authorization using utility
    if (!canEditPost(user, post)) {
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

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) {
      updates.content = body.content;
      if (!body.excerpt) {
        updates.excerpt = body.content.substring(0, 200);
      }
    }
    if (body.published !== undefined) {
      // Check if user can publish posts
      if (body.published && !canPublishPost(user)) {
        return error(
          "You do not have permission to publish posts. Only admins and editors can publish.",
          403
        );
      }
      updates.published = body.published;
      updates.publishedStatus = body.published ? "true" : "false"; // Update GSI field
    }
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.excerpt !== undefined) updates.excerpt = body.excerpt;
    if (body.mediaUrl !== undefined) updates.mediaUrl = body.mediaUrl;
    if (body.mediaType !== undefined) updates.mediaType = body.mediaType;

    const updateExpression = Object.keys(updates)
      .map((key, index) => `${key} = :val${index}`)
      .join(", ");

    const expressionAttributeValues = Object.keys(updates).reduce(
      (acc, key, index) => {
        acc[`:val${index}`] = updates[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

    await dynamoClient.send(
      new UpdateCommand({
        TableName: POSTS_TABLE,
        Key: { id },
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    const updated = await dynamoClient.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { id },
      })
    );

    return success(updated.Item as BlogPost);
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

    // Check if post exists and user owns it
    const existing = await dynamoClient.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { id },
      })
    );

    if (!existing.Item) {
      return error("Post not found", 404);
    }

    const post = existing.Item as BlogPost;

    // Check authorization using utility
    if (!canDeletePost(user, post)) {
      return error(
        "Forbidden: You do not have permission to delete this post",
        403
      );
    }

    await dynamoClient.send(
      new DeleteCommand({
        TableName: POSTS_TABLE,
        Key: { id },
      })
    );

    return success({ message: "Post deleted successfully" });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to delete post";
    return error(errorMessage, 500);
  }
};
