import { useState, useEffect, useCallback } from "react";
import { BlogPost } from "../api";
import { postsService } from "../services/postsService";

interface UsePostsOptions {
  published?: boolean;
  authorId?: string;
  autoLoad?: boolean;
}

interface UsePostsResult {
  posts: BlogPost[];
  loading: boolean;
  error: Error | null;
  loadPosts: () => Promise<void>;
}

/**
 * Custom hook for managing posts state
 * Handles loading, error, and success states
 */
export function usePosts(options: UsePostsOptions = {}): UsePostsResult {
  const { published, authorId, autoLoad = true } = options;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let loadedPosts: BlogPost[];
      if (authorId) {
        loadedPosts = await postsService.loadPostsByAuthor(authorId);
      } else if (published === true) {
        loadedPosts = await postsService.loadPublishedPosts();
      } else {
        loadedPosts = await postsService.loadAllPosts();
      }

      setPosts(loadedPosts);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load posts");
      setError(error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [published, authorId]);

  useEffect(() => {
    if (autoLoad) {
      loadPosts();
    }
  }, [autoLoad, loadPosts]);

  return {
    posts,
    loading,
    error,
    loadPosts,
  };
}
