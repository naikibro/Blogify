import { dynamoClient } from "../utils/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { VirusDetection, SecurityMetrics } from "../types";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3Client } from "../utils/s3";

const VIRUS_DETECTIONS_TABLE = process.env.VIRUS_DETECTIONS_TABLE || "";
const MEDIA_BUCKET = process.env.MEDIA_BUCKET || "";

export class SecurityService {
  /**
   * Get security metrics for dashboard
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    // Get total files in S3
    const totalFiles = await this.getTotalFilesCount();

    // Get all virus detections
    const detections = await this.getAllDetections();

    // Calculate metrics
    const threatsDetected = detections.length;
    const threatsByType: Record<string, number> = {};

    detections.forEach((detection) => {
      threatsByType[detection.threatType] =
        (threatsByType[detection.threatType] || 0) + 1;
    });

    // Get recent threats (last 10)
    const recentThreats = detections
      .sort((a, b) => b.detectedAt - a.detectedAt)
      .slice(0, 10);

    // Calculate scan rate (assuming all files are scanned)
    const scanRate =
      totalFiles > 0
        ? (totalFiles / (totalFiles + threatsDetected)) * 100
        : 100;

    return {
      totalFiles,
      totalScanned: totalFiles,
      threatsDetected,
      threatsByType,
      recentThreats,
      scanRate: Math.round(scanRate * 100) / 100,
    };
  }

  /**
   * Get all virus detections
   */
  async getAllDetections(): Promise<VirusDetection[]> {
    try {
      const result = await dynamoClient.send(
        new ScanCommand({
          TableName: VIRUS_DETECTIONS_TABLE,
        })
      );

      return (result.Items || []) as VirusDetection[];
    } catch (error) {
      console.error("Error fetching detections:", error);
      return [];
    }
  }

  /**
   * Get detections by user
   */
  async getDetectionsByUser(userId: string): Promise<VirusDetection[]> {
    try {
      const result = await dynamoClient.send(
        new ScanCommand({
          TableName: VIRUS_DETECTIONS_TABLE,
          FilterExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId,
          },
        })
      );

      return (result.Items || []) as VirusDetection[];
    } catch (error) {
      console.error("Error fetching user detections:", error);
      return [];
    }
  }

  /**
   * Get total count of files in S3 media bucket
   */
  private async getTotalFilesCount(): Promise<number> {
    try {
      let count = 0;
      let continuationToken: string | undefined;

      do {
        const command = new ListObjectsV2Command({
          Bucket: MEDIA_BUCKET,
          Prefix: "media/",
          ContinuationToken: continuationToken,
        });

        const response = await s3Client.send(command);
        count += response.KeyCount || 0;
        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return count;
    } catch (error) {
      console.error("Error counting files:", error);
      return 0;
    }
  }
}
