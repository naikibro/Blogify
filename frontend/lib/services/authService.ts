import { authApi } from "../api";

/**
 * Auth service - handles authentication business logic
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    role?: string
  ): Promise<void> {
    await authApi.register(email, password, role);
  }

  /**
   * Login a user
   */
  async login(email: string, password: string): Promise<void> {
    await authApi.login(email, password);
  }
}

// Export singleton instance
export const authService = new AuthService();
