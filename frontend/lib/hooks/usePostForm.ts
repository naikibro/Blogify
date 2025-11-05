import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreatePostRequest, UpdatePostRequest, BlogPost } from "../api";
import { postsService } from "../services/postsService";
import { mediaService } from "../services/mediaService";
import { useToast } from "@/components/ui/use-toast";

interface UsePostFormOptions {
  initialData?: BlogPost;
  onSuccess?: (post: BlogPost) => void;
}

interface UsePostFormResult {
  formData: CreatePostRequest | UpdatePostRequest;
  setFormData: React.Dispatch<
    React.SetStateAction<CreatePostRequest | UpdatePostRequest>
  >;
  tagInput: string;
  setTagInput: (value: string) => void;
  mediaPreview: string | null;
  uploading: boolean;
  saving: boolean;
  addTag: () => void;
  removeTag: (tag: string) => void;
  handleMediaUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeMedia: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Custom hook for managing post form state (create/edit)
 */
export function usePostForm(
  options: UsePostFormOptions = {}
): UsePostFormResult {
  const { initialData, onSuccess } = options;
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<
    CreatePostRequest | UpdatePostRequest
  >(
    initialData
      ? {
          title: initialData.title,
          content: initialData.content,
          published: initialData.published,
          tags: initialData.tags || [],
          excerpt: initialData.excerpt || "",
          mediaUrl: initialData.mediaUrl,
          mediaType: initialData.mediaType,
        }
      : {
          title: "",
          content: "",
          published: false,
          tags: [],
          excerpt: "",
        }
  );
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(
    initialData?.mediaUrl || null
  );

  // Update form data when initialData changes (for edit page)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        published: initialData.published,
        tags: initialData.tags || [],
        excerpt: initialData.excerpt || "",
        mediaUrl: initialData.mediaUrl,
        mediaType: initialData.mediaType,
      });
      setMediaPreview(initialData.mediaUrl || null);
    }
  }, [initialData]);

  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput("");
    }
  }, [tagInput, formData]);

  const removeTag = useCallback(
    (tag: string) => {
      setFormData({
        ...formData,
        tags: formData.tags?.filter((t) => t !== tag) || [],
      });
    },
    [formData]
  );

  const handleMediaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setUploading(true);
        const { mediaUrl, mediaType } = await mediaService.uploadFile(file);
        setFormData({
          ...formData,
          mediaUrl,
          mediaType,
        });
        setMediaPreview(mediaUrl);
        toast({
          title: "Success",
          description: "Media uploaded successfully",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload media";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [formData, toast]
  );

  const removeMedia = useCallback(() => {
    setFormData({
      ...formData,
      mediaUrl: undefined,
      mediaType: undefined,
    });
    setMediaPreview(null);
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setSaving(true);
        let post: BlogPost;
        if (initialData) {
          post = await postsService.updatePost(initialData.id, formData);
          toast({
            title: "Success",
            description: "Post updated successfully",
          });
        } else {
          post = await postsService.createPost(formData as CreatePostRequest);
          toast({
            title: "Success",
            description: "Post created successfully",
          });
        }
        if (onSuccess) {
          onSuccess(post);
        } else {
          router.push(`/posts/${post.id}`);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save post";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [formData, initialData, router, toast, onSuccess]
  );

  return {
    formData,
    setFormData,
    tagInput,
    setTagInput,
    mediaPreview,
    uploading,
    saving,
    addTag,
    removeTag,
    handleMediaUpload,
    removeMedia,
    handleSubmit,
  };
}
