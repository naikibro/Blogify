import { mediaService } from "../mediaService";
import { mediaApi } from "../../api/media";

// Mock the API module
jest.mock("../../api/media", () => ({
  mediaApi: {
    upload: jest.fn(),
  },
}));

// Mock global fetch
global.fetch = jest.fn();

describe("MediaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadFile", () => {
    it("should successfully upload an image file", async () => {
      const mockFile = new File(["image content"], "test.jpg", {
        type: "image/jpeg",
      });
      const mockUploadResponse = {
        mediaUrl: "https://example.com/media/test.jpg",
        mediaType: "image/jpeg",
        key: "media/test.jpg",
      };

      (mediaApi.upload as jest.Mock).mockResolvedValue(mockUploadResponse);

      const result = await mediaService.uploadFile(mockFile);

      expect(mediaApi.upload).toHaveBeenCalledTimes(1);
      expect(mediaApi.upload).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual({
        mediaUrl: "https://example.com/media/test.jpg",
        mediaType: "image/jpeg",
      });
    });

    it("should successfully upload a video file", async () => {
      const mockFile = new File(["video content"], "test.mp4", {
        type: "video/mp4",
      });
      const mockUploadResponse = {
        mediaUrl: "https://example.com/media/test.mp4",
        mediaType: "video/mp4",
        key: "media/test.mp4",
      };

      (mediaApi.upload as jest.Mock).mockResolvedValue(mockUploadResponse);

      const result = await mediaService.uploadFile(mockFile);

      expect(mediaApi.upload).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        mediaUrl: "https://example.com/media/test.mp4",
        mediaType: "video/mp4",
      });
    });

    it("should reject non-image and non-video files", async () => {
      const mockFile = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await expect(mediaService.uploadFile(mockFile)).rejects.toThrow(
        "Please upload an image or video file"
      );

      expect(mediaApi.upload).not.toHaveBeenCalled();
    });

    it("should reject files with unsupported MIME types", async () => {
      const mockFile = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      await expect(mediaService.uploadFile(mockFile)).rejects.toThrow(
        "Please upload an image or video file"
      );

      expect(mediaApi.upload).not.toHaveBeenCalled();
    });

    it("should handle empty file type", async () => {
      const mockFile = new File(["content"], "test", { type: "" });

      await expect(mediaService.uploadFile(mockFile)).rejects.toThrow(
        "Please upload an image or video file"
      );

      expect(mediaApi.upload).not.toHaveBeenCalled();
    });

    it("should propagate API errors", async () => {
      const mockFile = new File(["image content"], "test.jpg", {
        type: "image/jpeg",
      });
      const error = new Error("Upload failed");
      (mediaApi.upload as jest.Mock).mockRejectedValue(error);

      await expect(mediaService.uploadFile(mockFile)).rejects.toThrow(
        "Upload failed"
      );

      expect(mediaApi.upload).toHaveBeenCalledTimes(1);
    });

    it("should handle network errors during upload", async () => {
      const mockFile = new File(["image content"], "test.jpg", {
        type: "image/jpeg",
      });
      const error = new Error("Network error");
      (mediaApi.upload as jest.Mock).mockRejectedValue(error);

      await expect(mediaService.uploadFile(mockFile)).rejects.toThrow(
        "Network error"
      );
    });

    it("should handle various image MIME types", async () => {
      const imageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      for (const type of imageTypes) {
        const mockFile = new File(["content"], `test.${type.split("/")[1]}`, {
          type,
        });
        const mockUploadResponse = {
          mediaUrl: `https://example.com/media/test.${type.split("/")[1]}`,
          mediaType: type,
          key: `media/test.${type.split("/")[1]}`,
        };

        (mediaApi.upload as jest.Mock).mockResolvedValue(mockUploadResponse);

        const result = await mediaService.uploadFile(mockFile);
        expect(result.mediaType).toBe(type);
      }
    });

    it("should handle various video MIME types", async () => {
      const videoTypes = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ];

      for (const type of videoTypes) {
        const mockFile = new File(["content"], `test.${type.split("/")[1]}`, {
          type,
        });
        const mockUploadResponse = {
          mediaUrl: `https://example.com/media/test.${type.split("/")[1]}`,
          mediaType: type,
          key: `media/test.${type.split("/")[1]}`,
        };

        (mediaApi.upload as jest.Mock).mockResolvedValue(mockUploadResponse);

        const result = await mediaService.uploadFile(mockFile);
        expect(result.mediaType).toBe(type);
      }
    });
  });
});
