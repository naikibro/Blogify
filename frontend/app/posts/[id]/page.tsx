"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { usePost } from "@/lib/hooks/usePost";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const formatDate = (timestamp: number | string) => {
    const numTimestamp =
      typeof timestamp === "string" ? Number(timestamp) : timestamp;
    return new Date(numTimestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canEdit =
    post &&
    isAuthenticated &&
    (post.authorId === user?.id || user?.role === "admin");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
            <p className="text-muted-foreground">
              By {post.authorEmail} • {formatDate(post.createdAt)}
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
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
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm px-3 py-1 bg-secondary rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {post.mediaUrl && (
          <div className="mb-6 rounded-lg overflow-hidden">
            {post.mediaType?.startsWith("image") ? (
              <Image
                src={post.mediaUrl}
                alt={post.title}
                width={1200}
                height={384}
                className="w-full max-h-96 object-cover"
              />
            ) : post.mediaType?.startsWith("video") ? (
              <video src={post.mediaUrl} className="w-full max-h-96" controls />
            ) : null}
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <div
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{
                __html: post.content.replace(/\n/g, "<br />"),
              }}
            />
          </CardContent>
        </Card>

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
