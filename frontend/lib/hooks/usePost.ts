import { useState, useEffect, useCallback } from "react";
import { BlogPost } from "../api";
import { postsService } from "../services/postsService";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface UsePostOptions {
  postId?: string;
  autoLoad?: boolean;
}

interface UsePostResult {
  post: BlogPost | null;
  loading: boolean;
  error: Error | null;
  loadPost: (id: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  deleting: boolean;
}

/**
 * Custom hook for managing a single post state
 */
export function usePost(options: UsePostOptions = {}): UsePostResult {
  const { postId, autoLoad = true } = options;
  const router = useRouter();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<Error | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPost = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);
        const data = await postsService.getPostById(id);
        setPost(data);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to load post");
        setError(error);
        setPost(null);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        router.push("/");
      } finally {
        setLoading(false);
      }
    },
    [router, toast]
  );

  const deletePost = useCallback(
    async (id: string) => {
      try {
        setDeleting(true);
        await postsService.deletePost(id);
        toast({
          title: "Success",
          description: "Post deleted successfully",
        });
        router.push("/");
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to delete post");
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      } finally {
        setDeleting(false);
      }
    },
    [router, toast]
  );

  useEffect(() => {
    if (autoLoad && postId) {
      loadPost(postId);
    }
  }, [autoLoad, postId, loadPost]);

  return {
    post,
    loading,
    error,
    loadPost,
    deletePost,
    deleting,
  };
}
