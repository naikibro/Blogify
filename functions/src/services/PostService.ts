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
import { BlogPost, CreatePostRequest, UpdatePostRequest } from "../types";
import { CognitoUser } from "../utils/cognito";

const POSTS_TABLE = process.env.POSTS_TABLE || "";

export interface ListPostsOptions {
  published?: string;
  authorId?: string;
  limit?: number;
  lastKey?: string;
}

export interface ListPostsResult {
  posts: BlogPost[];
  count: number;
  hasMore: boolean;
  lastKey?: string;
}

export class PostService {
  /**
   * Create a new blog post
   */
  async createPost(
    request: CreatePostRequest,
    author: CognitoUser
  ): Promise<BlogPost> {
    const id = uuidv4();
    const now = Date.now();
    const published = request.published || false;

    const post: BlogPost = {
      id,
      title: request.title,
      content: request.content,
      authorId: author.userId,
      authorEmail: author.email,
      published,
      publishedStatus: published ? "true" : "false",
      createdAt: now,
      updatedAt: now,
      tags: request.tags || [],
      excerpt: request.excerpt || request.content.substring(0, 200),
      mediaUrl: request.mediaUrl,
      mediaType: request.mediaType,
    };

    await dynamoClient.send(
      new PutCommand({
        TableName: POSTS_TABLE,
        Item: post,
      })
    );

    return post;
  }

  /**
   * Get a post by ID
   */
  async getPostById(id: string): Promise<BlogPost | null> {
    const result = await dynamoClient.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { id },
      })
    );

    return (result.Item as BlogPost) || null;
  }

  /**
   * List posts with filtering and pagination
   */
  async listPosts(options: ListPostsOptions): Promise<ListPostsResult> {
    const limit = Math.min(options.limit || 20, 100);
    const { published, authorId, lastKey } = options;

    let result;
    let posts: BlogPost[] = [];

    if (authorId) {
      result = await this.queryByAuthor(authorId, published, limit, lastKey);
      posts = (result.Items || []) as BlogPost[];
    } else if (published === "true" || published === "false") {
      result = await this.queryByPublishedStatus(
        published === "true",
        limit,
        lastKey
      );
      posts = (result.Items || []) as BlogPost[];
    } else {
      result = await this.scanAllPosts(limit, lastKey);
      posts = (result.Items || []) as BlogPost[];
      // Sort by createdAt descending
      posts.sort((a, b) => b.createdAt - a.createdAt);
    }

    return {
      posts,
      count: posts.length,
      hasMore: !!result.LastEvaluatedKey,
      lastKey: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString(
            "base64"
          )
        : undefined,
    };
  }

  /**
   * Update a post
   */
  async updatePost(id: string, updates: UpdatePostRequest): Promise<BlogPost> {
    const updateData: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) {
      updateData.content = updates.content;
      if (!updates.excerpt) {
        updateData.excerpt = updates.content.substring(0, 200);
      }
    }
    if (updates.published !== undefined) {
      updateData.published = updates.published;
      updateData.publishedStatus = updates.published ? "true" : "false";
    }
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt;
    if (updates.mediaUrl !== undefined) updateData.mediaUrl = updates.mediaUrl;
    if (updates.mediaType !== undefined)
      updateData.mediaType = updates.mediaType;

    const updateExpression = Object.keys(updateData)
      .map((key, index) => `${key} = :val${index}`)
      .join(", ");

    const expressionAttributeValues = Object.keys(updateData).reduce(
      (acc, key, index) => {
        acc[`:val${index}`] = updateData[key];
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

    const updated = await this.getPostById(id);
    if (!updated) {
      throw new Error("Post not found after update");
    }

    return updated;
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<void> {
    await dynamoClient.send(
      new DeleteCommand({
        TableName: POSTS_TABLE,
        Key: { id },
      })
    );
  }

  /**
   * Query posts by author
   */
  private async queryByAuthor(
    authorId: string,
    published: string | undefined,
    limit: number,
    lastKey: string | undefined
  ) {
    const queryParams: QueryCommandInput = {
      TableName: POSTS_TABLE,
      IndexName: "authorId-createdAt-index",
      KeyConditionExpression: "authorId = :authorId",
      ExpressionAttributeValues: { ":authorId": authorId },
      ScanIndexForward: false,
      Limit: limit,
    };

    if (published === "true" || published === "false") {
      queryParams.FilterExpression = "published = :published";
      queryParams.ExpressionAttributeValues = {
        ...queryParams.ExpressionAttributeValues,
        ":published": published === "true",
      };
    }

    if (lastKey) {
      try {
        queryParams.ExclusiveStartKey = JSON.parse(
          Buffer.from(lastKey, "base64").toString()
        );
      } catch {
        // Invalid cursor, ignore
      }
    }

    return dynamoClient.send(new QueryCommand(queryParams));
  }

  /**
   * Query posts by published status
   */
  private async queryByPublishedStatus(
    published: boolean,
    limit: number,
    lastKey: string | undefined
  ) {
    const queryParams: QueryCommandInput = {
      TableName: POSTS_TABLE,
      IndexName: "published-createdAt-index",
      KeyConditionExpression: "publishedStatus = :publishedStatus",
      ExpressionAttributeValues: {
        ":publishedStatus": published ? "true" : "false",
      },
      ScanIndexForward: false,
      Limit: limit,
    };

    if (lastKey) {
      try {
        queryParams.ExclusiveStartKey = JSON.parse(
          Buffer.from(lastKey, "base64").toString()
        );
      } catch {
        // Invalid cursor, ignore
      }
    }

    return dynamoClient.send(new QueryCommand(queryParams));
  }

  /**
   * Scan all posts (use sparingly)
   */
  private async scanAllPosts(limit: number, lastKey: string | undefined) {
    const scanParams: ScanCommandInput = {
      TableName: POSTS_TABLE,
      Limit: limit,
    };

    if (lastKey) {
      try {
        scanParams.ExclusiveStartKey = JSON.parse(
          Buffer.from(lastKey, "base64").toString()
        );
      } catch {
        // Invalid cursor, ignore
      }
    }

    return dynamoClient.send(new ScanCommand(scanParams));
  }
}
