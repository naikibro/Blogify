import { request } from "./request";
import { MediaUploadResponse, MediaDownloadResponse } from "./types";

/**
 * Media API endpoints
 */
export const mediaApi = {
  /**
   * Upload a file using presigned URL pattern (recommended AWS approach)
   * 1. Get presigned URL from backend
   * 2. Upload directly to S3
   * 3. Return media information
   */
  upload: async (
    file: File
  ): Promise<{ mediaUrl: string; mediaType: string; key: string }> => {
    // Step 1: Get presigned URL from backend
    const uploadResponse = await request<MediaUploadResponse>("/media/upload", {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });

    // Step 2: Upload file directly to S3 using presigned URL
    const uploadToS3Response = await fetch(uploadResponse.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadToS3Response.ok) {
      throw new Error(
        `Failed to upload file to S3: ${uploadToS3Response.statusText}`
      );
    }

    // Step 3: Return media information
    return {
      mediaUrl: uploadResponse.mediaUrl,
      mediaType: file.type,
      key: uploadResponse.key,
    };
  },

  getDownloadUrl: async (key: string): Promise<MediaDownloadResponse> => {
    return request<MediaDownloadResponse>(`/media/${key}`);
  },
};
