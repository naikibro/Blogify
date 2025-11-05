import { S3Event } from "aws-lambda";
import { VirusScanService } from "../services/VirusScanService";

const virusScanService = new VirusScanService();

/**
 * Lambda handler triggered by S3 upload events
 */
export const scan = async (event: S3Event): Promise<void> => {
  console.log(`Processing ${event.Records.length} S3 event(s)`);

  for (const record of event.Records) {
    try {
      const detection = await virusScanService.scanFile(record);

      if (detection) {
        console.warn(
          `⚠️ Virus detected: ${detection.threatName} in ${detection.s3Key}`
        );
        // In production, you might want to:
        // 1. Quarantine the file (move to quarantine bucket)
        // 2. Notify admins via SNS/SES
        // 3. Delete the file automatically
      } else {
        console.log(`✅ File scanned clean: ${record.s3.object.key}`);
      }
    } catch (error) {
      console.error(`Error processing file ${record.s3.object.key}:`, error);
      // Continue processing other files even if one fails
    }
  }
};
