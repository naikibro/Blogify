import { securityService } from "../securityService";
import { securityApi } from "../../api/security";
import {
  SecurityMetrics,
  DetectionsResponse,
  VirusDetection,
} from "../../api/types";

// Mock the API module
jest.mock("../../api/security", () => ({
  securityApi: {
    getDashboard: jest.fn(),
    getDetections: jest.fn(),
  },
}));

describe("SecurityService", () => {
  const mockVirusDetection: VirusDetection = {
    id: "detection-123",
    s3Key: "media/file.exe",
    bucket: "media-bucket",
    fileName: "malicious.exe",
    fileSize: 1024,
    contentType: "application/x-msdownload",
    detectedAt: 1704067200000,
    threatType: "malware",
    threatName: "Trojan.Generic",
    userId: "user-123",
    userEmail: "user@example.com",
    status: "detected",
  };

  const mockSecurityMetrics: SecurityMetrics = {
    totalFiles: 1000,
    totalScanned: 950,
    threatsDetected: 5,
    threatsByType: {
      malware: 3,
      trojan: 2,
    },
    recentThreats: [mockVirusDetection],
    scanRate: 95.0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadMetrics", () => {
    it("should load security metrics successfully", async () => {
      (securityApi.getDashboard as jest.Mock).mockResolvedValue(
        mockSecurityMetrics
      );

      const result = await securityService.loadMetrics();

      expect(securityApi.getDashboard).toHaveBeenCalledTimes(1);
      expect(securityApi.getDashboard).toHaveBeenCalledWith();
      expect(result).toEqual(mockSecurityMetrics);
      expect(result.totalFiles).toBe(1000);
      expect(result.threatsDetected).toBe(5);
    });

    it("should handle empty metrics", async () => {
      const emptyMetrics: SecurityMetrics = {
        totalFiles: 0,
        totalScanned: 0,
        threatsDetected: 0,
        threatsByType: {},
        recentThreats: [],
        scanRate: 0,
      };

      (securityApi.getDashboard as jest.Mock).mockResolvedValue(emptyMetrics);

      const result = await securityService.loadMetrics();

      expect(result).toEqual(emptyMetrics);
      expect(result.totalFiles).toBe(0);
      expect(result.threatsDetected).toBe(0);
    });

    it("should propagate API errors", async () => {
      const error = new Error("Failed to load metrics");
      (securityApi.getDashboard as jest.Mock).mockRejectedValue(error);

      await expect(securityService.loadMetrics()).rejects.toThrow(
        "Failed to load metrics"
      );
    });

    it("should handle network errors", async () => {
      const error = new Error("Network error");
      (securityApi.getDashboard as jest.Mock).mockRejectedValue(error);

      await expect(securityService.loadMetrics()).rejects.toThrow(
        "Network error"
      );
    });

    it("should handle unauthorized access", async () => {
      const error = new Error("Unauthorized");
      (securityApi.getDashboard as jest.Mock).mockRejectedValue(error);

      await expect(securityService.loadMetrics()).rejects.toThrow(
        "Unauthorized"
      );
    });
  });

  describe("loadDetections", () => {
    it("should load all detections successfully", async () => {
      const mockDetections: DetectionsResponse = {
        detections: [mockVirusDetection],
        count: 1,
      };

      (securityApi.getDetections as jest.Mock).mockResolvedValue(
        mockDetections
      );

      const result = await securityService.loadDetections();

      expect(securityApi.getDetections).toHaveBeenCalledTimes(1);
      expect(securityApi.getDetections).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockDetections);
      expect(result.detections.length).toBe(1);
    });

    it("should load detections for a specific user", async () => {
      const userId = "user-123";
      const mockDetections: DetectionsResponse = {
        detections: [mockVirusDetection],
        count: 1,
      };

      (securityApi.getDetections as jest.Mock).mockResolvedValue(
        mockDetections
      );

      const result = await securityService.loadDetections(userId);

      expect(securityApi.getDetections).toHaveBeenCalledTimes(1);
      expect(securityApi.getDetections).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockDetections);
    });

    it("should return empty detections when none exist", async () => {
      const mockDetections: DetectionsResponse = {
        detections: [],
        count: 0,
      };

      (securityApi.getDetections as jest.Mock).mockResolvedValue(
        mockDetections
      );

      const result = await securityService.loadDetections();

      expect(result.detections).toEqual([]);
      expect(result.count).toBe(0);
    });

    it("should handle multiple detections", async () => {
      const multipleDetections: VirusDetection[] = [
        mockVirusDetection,
        {
          ...mockVirusDetection,
          id: "detection-456",
          fileName: "another-threat.exe",
          threatName: "Virus.Generic",
        },
      ];
      const mockDetections: DetectionsResponse = {
        detections: multipleDetections,
        count: 2,
      };

      (securityApi.getDetections as jest.Mock).mockResolvedValue(
        mockDetections
      );

      const result = await securityService.loadDetections();

      expect(result.detections.length).toBe(2);
      expect(result.count).toBe(2);
    });

    it("should propagate API errors", async () => {
      const error = new Error("Failed to load detections");
      (securityApi.getDetections as jest.Mock).mockRejectedValue(error);

      await expect(securityService.loadDetections()).rejects.toThrow(
        "Failed to load detections"
      );
    });

    it("should handle network errors", async () => {
      const error = new Error("Network error");
      (securityApi.getDetections as jest.Mock).mockRejectedValue(error);

      await expect(securityService.loadDetections()).rejects.toThrow(
        "Network error"
      );
    });

    it("should handle unauthorized access", async () => {
      const error = new Error("Unauthorized");
      (securityApi.getDetections as jest.Mock).mockRejectedValue(error);

      await expect(securityService.loadDetections()).rejects.toThrow(
        "Unauthorized"
      );
    });

    it("should handle invalid user ID", async () => {
      const error = new Error("Invalid user ID");
      (securityApi.getDetections as jest.Mock).mockRejectedValue(error);

      await expect(
        securityService.loadDetections("invalid-id")
      ).rejects.toThrow("Invalid user ID");
    });

    it("should filter detections by user correctly", async () => {
      const userId = "user-123";
      const userDetections: DetectionsResponse = {
        detections: [mockVirusDetection],
        count: 1,
      };

      (securityApi.getDetections as jest.Mock).mockResolvedValue(
        userDetections
      );

      const result = await securityService.loadDetections(userId);

      expect(securityApi.getDetections).toHaveBeenCalledWith(userId);
      expect(result.detections.every((d) => d.userId === userId)).toBe(true);
    });
  });
});
