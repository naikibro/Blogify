/**
 * API module - exports all API clients and types
 *
 * This module provides a clean, modular API structure organized by domain:
 * - auth: Authentication endpoints
 * - posts: Blog post CRUD operations
 * - media: Media upload/download operations
 * - security: Security dashboard endpoints (admin only)
 */

// Export all types
export * from "./types";

// Export all API clients
export { authApi } from "./auth";
export { postsApi } from "./posts";
export { mediaApi } from "./media";
export { securityApi } from "./security";
