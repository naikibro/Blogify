import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, error } from "../utils/response";
import { getAuthUser } from "../utils/auth";
import { hasPermission, Permission } from "../utils/authorization";
import { SecurityService } from "../services/SecurityService";

const securityService = new SecurityService();

/**
 * Get security dashboard metrics (admin only)
 */
export const getDashboard = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const user = await getAuthUser(event);
    if (!user) {
      return error("Unauthorized", 401);
    }

    // Check if user is admin
    if (!hasPermission(user, Permission.MANAGE_USERS)) {
      return error("Forbidden: Admin access required", 403);
    }

    const metrics = await securityService.getSecurityMetrics();

    return success(metrics);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch security metrics";
    console.error("Security dashboard error:", errorMessage);
    return error(errorMessage, 500);
  }
};

/**
 * Get virus detections list (admin only)
 */
export const getDetections = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const user = await getAuthUser(event);
    if (!user) {
      return error("Unauthorized", 401);
    }

    // Check if user is admin
    if (!hasPermission(user, Permission.MANAGE_USERS)) {
      return error("Forbidden: Admin access required", 403);
    }

    const userId = event.queryStringParameters?.userId;
    const detections = userId
      ? await securityService.getDetectionsByUser(userId)
      : await securityService.getAllDetections();

    return success({ detections, count: detections.length });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch detections";
    console.error("Get detections error:", errorMessage);
    return error(errorMessage, 500);
  }
};
