import { useState, useEffect, useCallback } from "react";
import { SecurityMetrics, VirusDetection } from "../api";
import { securityService } from "../services/securityService";
import { useToast } from "@/components/ui/use-toast";

interface UseSecurityOptions {
  autoLoad?: boolean;
  userId?: string;
}

interface UseSecurityResult {
  metrics: SecurityMetrics | null;
  detections: VirusDetection[];
  loading: boolean;
  error: Error | null;
  loadData: () => Promise<void>;
}

/**
 * Custom hook for managing security dashboard state
 */
export function useSecurity(
  options: UseSecurityOptions = {}
): UseSecurityResult {
  const { autoLoad = true, userId } = options;
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [detections, setDetections] = useState<VirusDetection[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, detectionsData] = await Promise.all([
        securityService.loadMetrics(),
        securityService.loadDetections(userId),
      ]);
      setMetrics(metricsData);
      setDetections(detectionsData.detections);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load security data");
      setError(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    metrics,
    detections,
    loading,
    error,
    loadData,
  };
}
