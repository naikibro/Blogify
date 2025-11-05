import { v4 as uuidv4 } from "uuid";
import { getPresignedUploadUrl, getPresignedDownloadUrl } from "../utils/s3";
import { CognitoUser } from "../utils/cognito";

export interface MediaUploadRequest {
  fileName: string;
  contentType: string;
  fileSize?: number;
}

export interface MediaUploadResponse {
  uploadUrl: string;
  mediaUrl: string;
  key: string;
  expiresIn: number;
}

export interface MediaDownloadResponse {
  downloadUrl: string;
  expiresIn: number;
}

export class MediaService {
  /**
   * Generate presigned URLs for media upload
   */
  async generateUploadUrls(
    request: MediaUploadRequest,
    user: CognitoUser
  ): Promise<MediaUploadResponse> {
    // Generate unique S3 key
    const extension = this.getFileExtension(request.fileName);
    const uuid = uuidv4();
    const key = extension
      ? `media/${user.userId}/${uuid}.${extension}`
      : `media/${user.userId}/${uuid}`;

    // Generate presigned URLs
    const uploadUrl = await getPresignedUploadUrl(key, request.contentType);
    const downloadUrl = await getPresignedDownloadUrl(key);

    return {
      uploadUrl,
      mediaUrl: downloadUrl,
      key,
      expiresIn: 3600,
    };
  }

  /**
   * Generate presigned URL for media download
   */
  async generateDownloadUrl(key: string): Promise<MediaDownloadResponse> {
    const downloadUrl = await getPresignedDownloadUrl(key);

    return {
      downloadUrl,
      expiresIn: 3600,
    };
  }

  /**
   * Extract file extension from filename
   */
  getFileExtension(fileName: string): string {
    const parts = fileName.split(".");
    // If there's no dot or only one part (no extension), return empty string
    if (parts.length <= 1) {
      return "";
    }
    return parts.pop() || "";
  }
}
