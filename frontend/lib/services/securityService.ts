import { securityApi, SecurityMetrics, DetectionsResponse } from "../api";

/**
 * Security service - handles security dashboard business logic
 */
export class SecurityService {
  /**
   * Load security dashboard metrics
   */
  async loadMetrics(): Promise<SecurityMetrics> {
    return await securityApi.getDashboard();
  }

  /**
   * Load virus detections
   */
  async loadDetections(userId?: string): Promise<DetectionsResponse> {
    return await securityApi.getDetections(userId);
  }
}

// Export singleton instance
export const securityService = new SecurityService();
