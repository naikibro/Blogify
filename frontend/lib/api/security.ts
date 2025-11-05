import { request } from "./request";
import { SecurityMetrics, DetectionsResponse } from "./types";

/**
 * Security API endpoints (Admin only)
 */
export const securityApi = {
  getDashboard: async (): Promise<SecurityMetrics> => {
    return request<SecurityMetrics>("/security/dashboard");
  },

  getDetections: async (userId?: string): Promise<DetectionsResponse> => {
    const params = userId ? `?userId=${userId}` : "";
    return request<DetectionsResponse>(`/security/detections${params}`);
  },
};
