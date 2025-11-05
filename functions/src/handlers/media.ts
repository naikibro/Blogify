import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { getPresignedUploadUrl, getPresignedDownloadUrl } from "../utils/s3";
import { success, error } from "../utils/response";
import { getAuthUser } from "../utils/auth";

export const upload = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const user = await getAuthUser(event);
    if (!user || !user.userId) {
      return error("Unauthorized", 401);
    }

    // Parse request body
    const body = JSON.parse(event.body || "{}");
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return error("fileName and contentType are required", 400);
    }

    // Generate unique S3 key
    const extension = fileName.split(".").pop() || "";
    const key = `media/${user.userId}/${uuidv4()}.${extension}`;

    // Generate presigned URLs
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    const downloadUrl = await getPresignedDownloadUrl(key);

    return success({
      uploadUrl,
      mediaUrl: downloadUrl,
      key,
      expiresIn: 3600,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to upload media";
    console.error("Upload handler error:", errorMessage);
    return error(errorMessage, 500);
  }
};

export const get = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const key = event.pathParameters?.key;
    if (!key) {
      return error("Media key is required", 400);
    }

    const downloadUrl = await getPresignedDownloadUrl(key);

    // Check if this is a direct media request (from browser) or API request
    const acceptHeader = event.headers.Accept || "";
    const isDirectMediaRequest =
      acceptHeader.includes("image/") ||
      acceptHeader.includes("video/") ||
      !acceptHeader.includes("application/json");

    if (isDirectMediaRequest) {
      // Redirect to presigned URL for direct media access
      return {
        statusCode: 302,
        headers: {
          Location: downloadUrl,
          "Access-Control-Allow-Origin": "*",
        },
        body: "",
      };
    }

    // Return JSON for API requests
    return success({
      downloadUrl,
      expiresIn: 3600,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to generate download URL";
    return error(errorMessage, 500);
  }
};
