import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, error } from "../utils/response";
import { getAuthUser } from "../utils/auth";
import { validateMediaUpload } from "../utils/validation";
import { MediaService } from "../services/MediaService";

const mediaService = new MediaService();

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
    const { fileName, contentType, fileSize } = body;

    // Validate input
    const validationErrors = validateMediaUpload(
      fileName,
      contentType,
      fileSize
    );
    if (validationErrors.length > 0) {
      return error(
        {
          message: "Validation failed",
          errors: validationErrors,
        },
        400
      );
    }

    const result = await mediaService.generateUploadUrls(
      { fileName, contentType, fileSize },
      user
    );

    return success(result);
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

    const result = await mediaService.generateDownloadUrl(key);

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
          Location: result.downloadUrl,
          "Access-Control-Allow-Origin": "*",
        },
        body: "",
      };
    }

    // Return JSON for API requests
    return success(result);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to generate download URL";
    return error(errorMessage, 500);
  }
};
