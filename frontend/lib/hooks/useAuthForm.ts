import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth";
import { authService } from "../services/authService";
import { useToast } from "@/components/ui/use-toast";

interface UseAuthFormOptions {
  onSuccess?: () => void;
  redirectTo?: string;
}

/**
 * Custom hook for authentication forms (login/register)
 */
export function useAuthForm(options: UseAuthFormOptions = {}) {
  const { redirectTo = "/" } = options;
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      await authService.login(email, password);
      await login(email, password);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      router.push(redirectTo);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    email: string,
    password: string,
    role?: string
  ) => {
    try {
      setLoading(true);
      await authService.register(email, password, role);
      await register(email, password, role);
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      router.push(redirectTo);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin,
    handleRegister,
  };
}
