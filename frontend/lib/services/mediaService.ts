import { mediaApi } from "../api";

/**
 * Media service - handles media upload business logic
 */
export class MediaService {
  /**
   * Upload a media file (image or video)
   */
  async uploadFile(
    file: File
  ): Promise<{ mediaUrl: string; mediaType: string }> {
    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      throw new Error("Please upload an image or video file");
    }

    const { mediaUrl, mediaType } = await mediaApi.upload(file);
    return { mediaUrl, mediaType };
  }
}

// Export singleton instance
export const mediaService = new MediaService();
