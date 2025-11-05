import { request } from "./request";
import { AuthResponse } from "./types";

/**
 * Authentication API endpoints
 */
export const authApi = {
  register: async (
    email: string,
    password: string,
    role?: string
  ): Promise<AuthResponse> => {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, ...(role && { role }) }),
    });
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
};
