import { useState, useMemo } from "react";
import { BlogPost } from "../api";
import { usePosts } from "./usePosts";
import { useAuth } from "../auth";

interface UseMyPostsResult {
  posts: BlogPost[];
  loading: boolean;
  error: Error | null;
  showUnpublished: boolean;
  setShowUnpublished: (show: boolean) => void;
  filteredPosts: BlogPost[];
  loadPosts: () => Promise<void>;
}

/**
 * Custom hook for managing "My Posts" page state
 */
export function useMyPosts(): UseMyPostsResult {
  const { user } = useAuth();
  const [showUnpublished, setShowUnpublished] = useState(true);
  const { posts, loading, error, loadPosts } = usePosts({
    authorId: user?.id,
    autoLoad: !!user?.id,
  });

  const filteredPosts = useMemo(() => {
    return showUnpublished ? posts : posts.filter((post) => post.published);
  }, [posts, showUnpublished]);

  return {
    posts,
    loading,
    error,
    showUnpublished,
    setShowUnpublished,
    filteredPosts,
    loadPosts,
  };
}
