import { MediaService } from "../MediaService";
import { getPresignedUploadUrl, getPresignedDownloadUrl } from "../../utils/s3";
import { CognitoUser } from "../../utils/cognito";

// Mock the S3 utilities
jest.mock("../../utils/s3", () => ({
  getPresignedUploadUrl: jest.fn(),
  getPresignedDownloadUrl: jest.fn(),
}));

describe("MediaService", () => {
  let mediaService: MediaService;
  let mockUser: CognitoUser;

  beforeEach(() => {
    mediaService = new MediaService();
    mockUser = {
      userId: "user-123",
      email: "test@example.com",
      role: "guest_author",
    };
    jest.clearAllMocks();
  });

  describe("generateUploadUrls", () => {
    const mockRequest = {
      fileName: "test-image.jpg",
      contentType: "image/jpeg",
      fileSize: 1024 * 1024, // 1MB
    };

    it("should generate upload URLs successfully", async () => {
      const mockUploadUrl = "https://s3.amazonaws.com/bucket/upload-url";
      const mockDownloadUrl = "https://s3.amazonaws.com/bucket/download-url";

      (getPresignedUploadUrl as jest.Mock).mockResolvedValue(mockUploadUrl);
      (getPresignedDownloadUrl as jest.Mock).mockResolvedValue(mockDownloadUrl);

      const result = await mediaService.generateUploadUrls(
        mockRequest,
        mockUser
      );

      expect(result.uploadUrl).toBe(mockUploadUrl);
      expect(result.mediaUrl).toBe(mockDownloadUrl);
      expect(result.key).toContain(`media/${mockUser.userId}/`);
      expect(result.key).toMatch(/\.jpg$/);
      expect(result.expiresIn).toBe(3600);
    });

    it("should generate unique keys for each upload", async () => {
      (getPresignedUploadUrl as jest.Mock).mockResolvedValue("upload-url");
      (getPresignedDownloadUrl as jest.Mock).mockResolvedValue("download-url");

      const result1 = await mediaService.generateUploadUrls(
        mockRequest,
        mockUser
      );
      const result2 = await mediaService.generateUploadUrls(
        mockRequest,
        mockUser
      );

      expect(result1.key).not.toBe(result2.key);
    });

    it("should handle files without extension", async () => {
      const requestWithoutExt = {
        ...mockRequest,
        fileName: "test-file",
      };

      (getPresignedUploadUrl as jest.Mock).mockResolvedValue("upload-url");
      (getPresignedDownloadUrl as jest.Mock).mockResolvedValue("download-url");

      const result = await mediaService.generateUploadUrls(
        requestWithoutExt,
        mockUser
      );

      expect(result.key).toContain(`media/${mockUser.userId}/`);
      expect(result.key).toMatch(/^media\/user-123\/[a-f0-9-]+$/);
    });

    it("should handle different file types", async () => {
      const videoRequest = {
        fileName: "video.mp4",
        contentType: "video/mp4",
        fileSize: 50 * 1024 * 1024, // 50MB
      };

      (getPresignedUploadUrl as jest.Mock).mockResolvedValue("upload-url");
      (getPresignedDownloadUrl as jest.Mock).mockResolvedValue("download-url");

      const result = await mediaService.generateUploadUrls(
        videoRequest,
        mockUser
      );

      expect(result.key).toMatch(/\.mp4$/);
      expect(getPresignedUploadUrl).toHaveBeenCalledWith(
        expect.stringContaining(".mp4"),
        "video/mp4"
      );
    });

    it("should include user ID in key path", async () => {
      (getPresignedUploadUrl as jest.Mock).mockResolvedValue("upload-url");
      (getPresignedDownloadUrl as jest.Mock).mockResolvedValue("download-url");

      const result = await mediaService.generateUploadUrls(
        mockRequest,
        mockUser
      );

      expect(result.key).toContain(`media/${mockUser.userId}/`);
    });

    it("should handle S3 errors", async () => {
      const error = new Error("S3 error");
      (getPresignedUploadUrl as jest.Mock).mockRejectedValue(error);

      await expect(
        mediaService.generateUploadUrls(mockRequest, mockUser)
      ).rejects.toThrow("S3 error");
    });
  });

  describe("generateDownloadUrl", () => {
    const mockKey = "media/user-123/image.jpg";

    it("should generate download URL successfully", async () => {
      const mockDownloadUrl = "https://s3.amazonaws.com/bucket/download-url";

      (getPresignedDownloadUrl as jest.Mock).mockResolvedValue(mockDownloadUrl);

      const result = await mediaService.generateDownloadUrl(mockKey);

      expect(result.downloadUrl).toBe(mockDownloadUrl);
      expect(result.expiresIn).toBe(3600);
      expect(getPresignedDownloadUrl).toHaveBeenCalledWith(mockKey);
    });

    it("should handle empty key", async () => {
      const mockDownloadUrl = "https://s3.amazonaws.com/bucket/download-url";

      (getPresignedDownloadUrl as jest.Mock).mockResolvedValue(mockDownloadUrl);

      const result = await mediaService.generateDownloadUrl("");

      expect(result.downloadUrl).toBe(mockDownloadUrl);
      expect(result.expiresIn).toBe(3600);
      expect(getPresignedDownloadUrl).toHaveBeenCalledWith("");
    });

    it("should handle S3 errors", async () => {
      const error = new Error("S3 error");
      (getPresignedDownloadUrl as jest.Mock).mockRejectedValue(error);

      await expect(mediaService.generateDownloadUrl(mockKey)).rejects.toThrow(
        "S3 error"
      );
    });
  });

  describe("getFileExtension", () => {
    it("should extract file extension correctly", () => {
      expect(mediaService.getFileExtension("image.jpg")).toBe("jpg");
      expect(mediaService.getFileExtension("video.mp4")).toBe("mp4");
      expect(mediaService.getFileExtension("document.pdf")).toBe("pdf");
    });

    it("should handle files with multiple dots", () => {
      expect(mediaService.getFileExtension("my.image.jpg")).toBe("jpg");
      expect(mediaService.getFileExtension("file.name.backup.tar.gz")).toBe(
        "gz"
      );
    });

    it("should return empty string for files without extension", () => {
      expect(mediaService.getFileExtension("filename")).toBe("");
      expect(mediaService.getFileExtension("")).toBe("");
    });

    it("should handle edge cases", () => {
      expect(mediaService.getFileExtension("file.")).toBe("");
      expect(mediaService.getFileExtension(".hidden")).toBe("hidden");
    });
  });
});
