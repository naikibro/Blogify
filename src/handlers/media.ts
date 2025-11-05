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

    const body = JSON.parse(event.body || "{}");
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return error("FileName and contentType are required", 400);
    }

    const extension = fileName.split(".").pop();
    const key = `media/${user.userId}/${uuidv4()}.${extension}`;

    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    return success({
      uploadUrl,
      key,
      expiresIn: 3600,
    });
  } catch (err: any) {
    return error(err.message || "Failed to generate upload URL", 500);
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

    return success({
      downloadUrl,
      expiresIn: 3600,
    });
  } catch (err: any) {
    return error(err.message || "Failed to generate download URL", 500);
  }
};
