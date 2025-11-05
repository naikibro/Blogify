"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { postsApi, BlogPost } from "@/lib/api";
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
import { Plus, LogOut, LogIn } from "lucide-react";

export default function Home() {
  const { user, logout, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await postsApi.list(true); // Only published posts
      console.log(JSON.stringify(response, null, 2));
      setPosts(response.posts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            Blogify
          </Link>
          <nav className="flex gap-4 items-center">
            {isAuthenticated ? (
              <>
                <Link href="/posts/my">
                  <Button variant="outline" size="sm">
                    My Posts
                  </Button>
                </Link>
                <Link href="/posts/new">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Post
                  </Button>
                </Link>
                <span className="text-sm text-muted-foreground">
                  {user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No posts found.{" "}
            {isAuthenticated && (
              <Link href="/posts/new" className="text-primary underline">
                Create your first post
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
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
                    {post.authorEmail} • {formatDate(post.createdAt)}
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
                      Read More
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
