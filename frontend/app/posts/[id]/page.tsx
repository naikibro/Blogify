"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Edit, Trash2, Clock, Tag as TagIcon } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { usePost } from "@/lib/hooks/usePost";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formatDate = (timestamp: number | string) => {
  const numTimestamp =
    typeof timestamp === "string" ? Number(new Date(timestamp)) : timestamp;
  return new Date(numTimestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getReadingTime = (content: string | undefined) => {
  if (!content) return "1 min read";
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
};

const getPostType = (mediaType?: string): "image" | "video" | "text" => {
  if (mediaType?.startsWith("image")) return "image";
  if (mediaType?.startsWith("video")) return "video";
  return "text";
};

export default function PostDetailPage() {
  const params = useParams();
  const { user, isAuthenticated } = useAuth();
  const { post, loading, deletePost, deleting } = usePost({
    postId: params.id as string,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!post) return;
    await deletePost(post.id);
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const canEdit =
    isAuthenticated &&
    (post.authorId === user?.id || user?.role === "admin");

  const postType = getPostType(post.mediaType);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Header bloc avec meta */}
        <section className="rounded-2xl border bg-card/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                {post.title}
              </h1>
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>By {post.authorEmail}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span>{formatDate(post.createdAt)}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getReadingTime(post.content)}
                </span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
                  {postType === "text"
                    ? "Text only"
                    : postType === "image"
                    ? "Image post"
                    : "Video post"}
                </span>
              </p>
            </div>

            {canEdit && (
              <div className="flex gap-2 shrink-0">
                <Link href={`/posts/${post.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <TagIcon className="h-3 w-3" />
                Tags
              </span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 bg-secondary rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Media */}
        {post.mediaUrl && (
          <div className="mb-2 rounded-2xl overflow-hidden border bg-card">
            {post.mediaType?.startsWith("image") ? (
              <Image
                src={post.mediaUrl}
                alt={post.title}
                width={1200}
                height={384}
                className="w-full max-h-[500px] object-cover"
              />
            ) : post.mediaType?.startsWith("video") ? (
              <video
                src={post.mediaUrl}
                className="w-full max-h-[500px] bg-black"
                controls
              />
            ) : null}
          </div>
        )}

        {/* Contenu */}
        <Card>
          <CardContent className="pt-6">
            <article
              className="prose prose-slate max-w-none prose-img:rounded-xl dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: post.content.replace(/\n/g, "<br />"),
              }}
            />
          </CardContent>
        </Card>

        {/* Dialog de suppression */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this post? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
