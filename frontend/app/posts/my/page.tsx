"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useMyPosts } from "@/lib/hooks/useMyPosts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyPostsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { filteredPosts, loading, error, showUnpublished, setShowUnpublished } =
    useMyPosts();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load posts",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const formatDate = (timestamp: number | string) => {
    const numTimestamp =
      typeof timestamp === "string" ? Number(timestamp) : timestamp;
    return new Date(numTimestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <Link href="/posts/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Posts</h1>
          <Button
            variant="outline"
            onClick={() => setShowUnpublished(!showUnpublished)}
          >
            {showUnpublished ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Drafts
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Drafts
              </>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {showUnpublished
              ? "No posts found. Create your first post!"
              : "No published posts found."}
            <Link
              href="/posts/new"
              className="block mt-4 text-primary underline"
            >
              Create a new post
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="flex flex-col overflow-hidden">
                {post.mediaUrl && (
                  <div className="w-full overflow-hidden">
                    {post.mediaType?.startsWith("image") ? (
                      <img
                        src={post.mediaUrl}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : post.mediaType?.startsWith("video") ? (
                      <video
                        src={post.mediaUrl}
                        className="w-full h-48 object-cover"
                        controls
                      />
                    ) : null}
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription>
                    {formatDate(post.createdAt)}
                    {!post.published && (
                      <span className="ml-2 text-xs text-orange-500">
                        (Draft)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt || post.content.substring(0, 150)}
                  </p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-secondary rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Link href={`/posts/${post.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      {post.published ? "View" : "Edit"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
