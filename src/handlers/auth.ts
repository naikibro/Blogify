import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dynamoClient } from "../utils/dynamodb";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { success, error } from "../utils/response";
import { createUser, authenticateUser } from "../utils/cognito";
import { UserRole, AuthRequest } from "../types";

const USERS_TABLE = process.env.USERS_TABLE || "";

export const register = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body: AuthRequest = JSON.parse(event.body || "{}");
    const { email, password, role } = body;

    if (!email || !password) {
      return error("Email and password are required", 400);
    }

    // Check if user exists in DynamoDB (for role management)
    const existingUser = await dynamoClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );

    if (existingUser.Items && existingUser.Items.length > 0) {
      return error("User already exists", 409);
    }

    // Create user in Cognito
    const userRole = role || UserRole.GUEST_AUTHOR;
    const cognitoUser = await createUser(email, password, userRole);

    // Store user metadata in DynamoDB
    const now = Date.now();
    await dynamoClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: {
          id: cognitoUser.userId,
          email: cognitoUser.email,
          role: userRole,
          createdAt: now,
          updatedAt: now,
        },
      })
    );

    // Small delay to ensure Cognito user is fully ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Authenticate to get tokens
    let tokens;
    try {
      tokens = await authenticateUser(email, password);
    } catch (authErr: any) {
      // If authentication fails, still return success with user info
      // User can login separately
      console.error("Authentication failed after registration:", authErr);
      return success(
        {
          user: {
            id: cognitoUser.userId,
            email: cognitoUser.email,
            role: userRole,
          },
          message: "User created successfully. Please login to get tokens.",
        },
        201
      );
    }

    return success(
      {
        ...tokens,
        user: {
          id: cognitoUser.userId,
          email: cognitoUser.email,
          role: userRole,
        },
      },
      201
    );
  } catch (err: any) {
    console.error("Registration error:", JSON.stringify(err, null, 2));
    console.error("Error name:", err?.name);
    console.error("Error message:", err?.message);
    console.error("Error stack:", err?.stack);

    if (err?.name === "UsernameExistsException") {
      return error("User already exists", 409);
    }
    if (err?.name === "InvalidParameterException") {
      return error(`Invalid parameter: ${err?.message || "Unknown"}`, 400);
    }
    if (err?.name === "InvalidPasswordException") {
      return error(
        `Invalid password: ${
          err?.message || "Password does not meet requirements"
        }`,
        400
      );
    }

    // Return detailed error for debugging
    const errorMessage =
      err?.message || err?.toString() || "Registration failed";
    return error(`Registration failed: ${errorMessage}`, 500);
  }
};

export const login = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body: AuthRequest = JSON.parse(event.body || "{}");
    const { email, password } = body;

    if (!email || !password) {
      return error("Email and password are required", 400);
    }

    // Authenticate with Cognito
    const tokens = await authenticateUser(email, password);

    // Get user metadata from DynamoDB
    const userResult = await dynamoClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );

    const userMetadata = userResult.Items?.[0];

    return success({
      ...tokens,
      user: {
        id: userMetadata?.id || email,
        email,
        role: userMetadata?.role || UserRole.GUEST_AUTHOR,
      },
    });
  } catch (err: any) {
    if (
      err.name === "NotAuthorizedException" ||
      err.name === "UserNotFoundException"
    ) {
      return error("Invalid credentials", 401);
    }
    return error(err.message || "Login failed", 500);
  }
};
