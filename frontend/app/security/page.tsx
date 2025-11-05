"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { securityApi, SecurityMetrics, VirusDetection } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  FileCheck,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SecurityDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [detections, setDetections] = useState<VirusDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "detections">(
    "overview"
  );
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      });
      router.push("/");
      return;
    }

    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, detectionsData] = await Promise.all([
        securityApi.getDashboard(),
        securityApi.getDetections(),
      ]);
      setMetrics(metricsData);
      setDetections(detectionsData.detections);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Security Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "overview"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("detections")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "detections"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Detections ({detections.length})
          </button>
        </div>

        {activeTab === "overview" && metrics && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Files
                  </CardTitle>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalFiles}</div>
                  <p className="text-xs text-muted-foreground">
                    Files in S3 bucket
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Files Scanned
                  </CardTitle>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.totalScanned}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.scanRate.toFixed(1)}% scan rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Threats Detected
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {metrics.threatsDetected}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total threats found
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Threat Types
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(metrics.threatsByType).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unique threat types
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Threats by Type */}
            {Object.keys(metrics.threatsByType).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Threats by Type</CardTitle>
                  <CardDescription>
                    Breakdown of detected threats by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(metrics.threatsByType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-medium capitalize">
                              {type.replace(/_/g, " ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-32 bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${
                                    (count / metrics.threatsDetected) * 100
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Threats */}
            {metrics.recentThreats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Threats</CardTitle>
                  <CardDescription>
                    Latest {metrics.recentThreats.length} threat detections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.recentThreats.map((threat) => (
                      <div
                        key={threat.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <p className="font-medium">{threat.fileName}</p>
                            <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">
                              {threat.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {threat.threatName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(threat.detectedAt)} •{" "}
                            {formatFileSize(threat.fileSize)} •{" "}
                            {threat.contentType}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "detections" && (
          <Card>
            <CardHeader>
              <CardTitle>All Detections</CardTitle>
              <CardDescription>
                Complete list of virus detections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No threats detected. Your system is secure!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">File</th>
                        <th className="text-left p-2 font-medium">Threat</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Size</th>
                        <th className="text-left p-2 font-medium">Detected</th>
                        <th className="text-left p-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detections.map((detection) => (
                        <tr
                          key={detection.id}
                          className="border-b hover:bg-accent transition-colors"
                        >
                          <td className="p-2">
                            <p className="font-medium text-sm">
                              {detection.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {detection.s3Key}
                            </p>
                          </td>
                          <td className="p-2">
                            <p className="text-sm">{detection.threatName}</p>
                          </td>
                          <td className="p-2">
                            <span className="text-xs px-2 py-1 bg-secondary rounded capitalize">
                              {detection.threatType.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-2 text-sm">
                            {formatFileSize(detection.fileSize)}
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {formatDate(detection.detectedAt)}
                          </td>
                          <td className="p-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                detection.status === "detected"
                                  ? "bg-destructive/10 text-destructive"
                                  : detection.status === "quarantined"
                                  ? "bg-orange-500/10 text-orange-500"
                                  : "bg-green-500/10 text-green-500"
                              }`}
                            >
                              {detection.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
