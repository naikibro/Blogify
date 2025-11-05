import { authService } from "../authService";
import { authApi } from "../../api/auth";

// Mock the API module
jest.mock("../../api/auth", () => ({
  authApi: {
    register: jest.fn(),
    login: jest.fn(),
  },
}));

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should successfully register a user with email and password", async () => {
      const mockAuthResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        idToken: "id-token",
        user: {
          id: "user-123",
          email: "test@example.com",
          role: "guest_author",
        },
      };

      (authApi.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      await authService.register("test@example.com", "password123");

      expect(authApi.register).toHaveBeenCalledTimes(1);
      expect(authApi.register).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
        undefined
      );
    });

    it("should register a user with role", async () => {
      const mockAuthResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        idToken: "id-token",
        user: {
          id: "user-123",
          email: "admin@example.com",
          role: "admin",
        },
      };

      (authApi.register as jest.Mock).mockResolvedValue(mockAuthResponse);

      await authService.register("admin@example.com", "password123", "admin");

      expect(authApi.register).toHaveBeenCalledTimes(1);
      expect(authApi.register).toHaveBeenCalledWith(
        "admin@example.com",
        "password123",
        "admin"
      );
    });

    it("should propagate errors from the API", async () => {
      const error = new Error("Registration failed");
      (authApi.register as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.register("test@example.com", "password123")
      ).rejects.toThrow("Registration failed");

      expect(authApi.register).toHaveBeenCalledTimes(1);
    });

    it("should handle network errors", async () => {
      const error = new Error("Network error");
      (authApi.register as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.register("test@example.com", "password123")
      ).rejects.toThrow("Network error");
    });

    it("should handle empty email", async () => {
      const error = new Error("Email is required");
      (authApi.register as jest.Mock).mockRejectedValue(error);

      await expect(authService.register("", "password123")).rejects.toThrow(
        "Email is required"
      );
    });

    it("should handle empty password", async () => {
      const error = new Error("Password is required");
      (authApi.register as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.register("test@example.com", "")
      ).rejects.toThrow("Password is required");
    });
  });

  describe("login", () => {
    it("should successfully login a user", async () => {
      const mockAuthResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        idToken: "id-token",
        user: {
          id: "user-123",
          email: "test@example.com",
          role: "guest_author",
        },
      };

      (authApi.login as jest.Mock).mockResolvedValue(mockAuthResponse);

      await authService.login("test@example.com", "password123");

      expect(authApi.login).toHaveBeenCalledTimes(1);
      expect(authApi.login).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
    });

    it("should propagate errors from the API", async () => {
      const error = new Error("Invalid credentials");
      (authApi.login as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login("test@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid credentials");

      expect(authApi.login).toHaveBeenCalledTimes(1);
    });

    it("should handle network errors", async () => {
      const error = new Error("Network error");
      (authApi.login as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login("test@example.com", "password123")
      ).rejects.toThrow("Network error");
    });

    it("should handle invalid email format", async () => {
      const error = new Error("Invalid email format");
      (authApi.login as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.login("invalid-email", "password123")
      ).rejects.toThrow("Invalid email format");
    });

    it("should handle empty credentials", async () => {
      const error = new Error("Email and password are required");
      (authApi.login as jest.Mock).mockRejectedValue(error);

      await expect(authService.login("", "")).rejects.toThrow(
        "Email and password are required"
      );
    });
  });
});
