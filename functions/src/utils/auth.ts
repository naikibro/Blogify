import { APIGatewayProxyEvent } from "aws-lambda";
import { CognitoUser } from "./cognito";
import { dynamoClient } from "./dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const USERS_TABLE = process.env.USERS_TABLE || "";

export const getAuthUser = async (
  event: APIGatewayProxyEvent
): Promise<CognitoUser | null> => {
  // When using Cognito User Pool authorizer, user info is in requestContext
  const claims = event.requestContext?.authorizer?.claims;
  if (claims) {
    const userId = claims.sub || claims["cognito:username"] || "";
    const email = claims.email || "";

    // Fetch role from DynamoDB
    try {
      const userResult = await dynamoClient.send(
        new GetCommand({
          TableName: USERS_TABLE,
          Key: { id: userId },
        })
      );

      const role = userResult.Item?.role || "guest_author";

      return {
        userId,
        email,
        role,
      };
    } catch {
      // If user not found in DynamoDB, return default role
      return {
        userId,
        email,
        role: "guest_author",
      };
    }
  }

  // Fallback: try to extract from Authorization header
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) {
    return null;
  }

  // For non-authorizer endpoints, return null (they should use Cognito authorizer)
  return null;
};
