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
} from "@aws-sdk/lib-dynamodb";
import { success, error } from "../utils/response";
import { getAuthUser } from "../utils/auth";
import { CreatePostRequest, UpdatePostRequest, BlogPost } from "../types";

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

    if (!title || !content) {
      return error("Title and content are required", 400);
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
  } catch (err: any) {
    return error(err.message || "Failed to create post", 500);
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
  } catch (err: any) {
    return error(err.message || "Failed to get post", 500);
  }
};

export const list = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const published = event.queryStringParameters?.published;
    const authorId = event.queryStringParameters?.authorId;

    let result;
    if (authorId) {
      result = await dynamoClient.send(
        new QueryCommand({
          TableName: POSTS_TABLE,
          IndexName: "authorId-createdAt-index",
          KeyConditionExpression: "authorId = :authorId",
          ExpressionAttributeValues: { ":authorId": authorId },
          ScanIndexForward: false,
        })
      );
    } else {
      result = await dynamoClient.send(
        new ScanCommand({
          TableName: POSTS_TABLE,
        })
      );
    }

    let posts = (result.Items || []) as BlogPost[];

    if (published === "true") {
      posts = posts.filter((post) => post.published);
    }

    posts.sort((a, b) => b.createdAt - a.createdAt);

    return success({ posts, count: posts.length });
  } catch (err: any) {
    return error(err.message || "Failed to list posts", 500);
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
    if (post.authorId !== user.userId && user.role !== "admin") {
      return error("Forbidden", 403);
    }

    const body: UpdatePostRequest = JSON.parse(event.body || "{}");
    const updates: any = { updatedAt: Date.now() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) {
      updates.content = body.content;
      if (!body.excerpt) {
        updates.excerpt = body.content.substring(0, 200);
      }
    }
    if (body.published !== undefined) updates.published = body.published;
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
      {} as Record<string, any>
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
  } catch (err: any) {
    return error(err.message || "Failed to update post", 500);
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
    if (post.authorId !== user.userId && user.role !== "admin") {
      return error("Forbidden", 403);
    }

    await dynamoClient.send(
      new DeleteCommand({
        TableName: POSTS_TABLE,
        Key: { id },
      })
    );

    return success({ message: "Post deleted successfully" });
  } catch (err: any) {
    return error(err.message || "Failed to delete post", 500);
  }
};
