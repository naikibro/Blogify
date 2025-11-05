import { S3EventRecord } from "aws-lambda";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../utils/s3";
import { dynamoClient } from "../utils/dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { VirusDetection } from "../types";
import { v4 as uuidv4 } from "uuid";

const VIRUS_DETECTIONS_TABLE = process.env.VIRUS_DETECTIONS_TABLE || "";
const MEDIA_BUCKET = process.env.MEDIA_BUCKET || "";

// Known virus signatures (simplified - in production, use ClamAV or AWS Macie)
const THREAT_SIGNATURES: Array<{
  pattern: Buffer;
  name: string;
  type: string;
}> = [
  // This is a mock implementation - replace with actual ClamAV integration
  // Example: PE executable header
  {
    pattern: Buffer.from([0x4d, 0x5a]),
    name: "PE Executable",
    type: "executable",
  },
];

export class VirusScanService {
  /**
   * Scan file for viruses
   */
  async scanFile(record: S3EventRecord): Promise<VirusDetection | null> {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    // Skip if not in media bucket
    if (bucket !== MEDIA_BUCKET) {
      return null;
    }

    // Skip non-media files
    if (!key.startsWith("media/")) {
      return null;
    }

    try {
      // Download file for scanning
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await s3Client.send(getObjectCommand);
      const chunks: Buffer[] = [];

      if (response.Body) {
        // S3 Body is a Readable stream
        const stream = response.Body as NodeJS.ReadableStream;
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk as Uint8Array));
        }
      }

      const fileBuffer = Buffer.concat(chunks);
      const fileSize = fileBuffer.length;

      // Perform virus scan
      const threat = this.detectThreat(fileBuffer, key);

      if (threat) {
        // Extract user info from S3 key (format: media/{userId}/{filename})
        const keyParts = key.split("/");
        const userId = keyParts.length > 1 ? keyParts[1] : undefined;

        const detection: VirusDetection = {
          id: uuidv4(),
          s3Key: key,
          bucket,
          fileName: keyParts[keyParts.length - 1] || key,
          fileSize,
          contentType: response.ContentType || "application/octet-stream",
          detectedAt: Date.now(),
          threatType: threat.type,
          threatName: threat.name,
          userId,
          status: "detected",
        };

        // Save detection to DynamoDB
        await this.saveDetection(detection);

        return detection;
      }

      return null;
    } catch (error) {
      console.error(`Error scanning file ${key}:`, error);
      return null;
    }
  }

  /**
   * Detect threats in file buffer
   */
  private detectThreat(
    buffer: Buffer,
    fileName: string
  ): { name: string; type: string } | null {
    // Check file extension for suspicious types
    const suspiciousExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".scr",
      ".vbs",
      ".js",
    ];
    const lowerFileName = fileName.toLowerCase();
    const hasSuspiciousExtension = suspiciousExtensions.some((ext) =>
      lowerFileName.endsWith(ext)
    );

    if (hasSuspiciousExtension) {
      return {
        name: `Suspicious file extension: ${fileName.split(".").pop()}`,
        type: "suspicious_extension",
      };
    }

    // Check for known threat signatures
    for (const signature of THREAT_SIGNATURES) {
      if (buffer.includes(signature.pattern)) {
        return {
          name: signature.name,
          type: signature.type,
        };
      }
    }

    // Check for embedded scripts in image files
    if (this.isImageFile(fileName)) {
      const scriptPatterns = [
        /<script/i,
        /javascript:/i,
        /onerror=/i,
        /onload=/i,
      ];
      const fileContent = buffer.toString(
        "utf8",
        0,
        Math.min(10000, buffer.length)
      );
      for (const pattern of scriptPatterns) {
        if (pattern.test(fileContent)) {
          return {
            name: "Embedded script detected in image",
            type: "embedded_script",
          };
        }
      }
    }

    return null;
  }

  /**
   * Check if file is an image
   */
  private isImageFile(fileName: string): boolean {
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
      ".svg",
    ];
    const lowerFileName = fileName.toLowerCase();
    return imageExtensions.some((ext) => lowerFileName.endsWith(ext));
  }

  /**
   * Save virus detection to DynamoDB
   */
  private async saveDetection(detection: VirusDetection): Promise<void> {
    try {
      await dynamoClient.send(
        new PutCommand({
          TableName: VIRUS_DETECTIONS_TABLE,
          Item: detection,
        })
      );
      console.log(`Virus detection saved: ${detection.id}`);
    } catch (error) {
      console.error(`Error saving detection:`, error);
      throw error;
    }
  }
}
