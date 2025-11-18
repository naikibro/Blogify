"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn, LogOut, Plus, Shield, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { usePosts } from "@/lib/hooks/usePosts";

type PostTypeFilter = "all" | "image" | "video" | "text";

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

export default function Home() {
  const { user, logout, isAuthenticated } = useAuth();
  const { posts, loading, error } = usePosts({ published: true });
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<PostTypeFilter>("all");

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load posts",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Tri par date (plus récents en premier)
    result.sort(
      (a, b) =>
        Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))
    );

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((post) => {
        const inTitle = post.title.toLowerCase().includes(q);
        const inExcerpt = post.excerpt?.toLowerCase().includes(q) ?? false;
        const inContent = post.content.toLowerCase().includes(q);
        const inTags =
          post.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        return inTitle || inExcerpt || inContent || inTags;
      });
    }

    if (typeFilter !== "all") {
      result = result.filter((post) => {
        const type = getPostType(post.mediaType);
        return type === typeFilter;
      });
    }

    return result;
  }, [posts, searchTerm, typeFilter]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header sticky */}
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
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
                {user?.role === "admin" && (
                  <Link href="/security">
                    <Button variant="outline" size="sm">
                      <Shield className="mr-2 h-4 w-4" />
                      Security
                    </Button>
                  </Link>
                )}
                <span className="text-sm text-muted-foreground hidden sm:inline">
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

      <main className="container mx-auto px-4 py-10 space-y-10">
        {/* HERO */}
        <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3 max-w-2xl">
            <p className="text-sm font-medium text-primary/80 uppercase tracking-[0.15em]">
              Modern headless blogging
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your content,{" "}
              <span className="text-primary">secured & curated</span>.
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Write, publish and manage rich posts with media uploads and
              automatic security scanning on S3. A clean editor for authors,
              and a simple reading experience for your audience.
            </p>
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/posts/new">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Start writing
                    </Button>
                  </Link>
                  <Link href="/posts/my">
                    <Button size="sm" variant="outline">
                      View my posts
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="sm">Create an account</Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" variant="outline">
                      Log in
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <Card className="w-full max-w-sm border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Blog snapshot</CardTitle>
              <CardDescription>
                Quick stats about your published content.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground">Published posts</p>
                <p className="text-2xl font-semibold">{posts.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Media uploads</p>
                <p className="text-2xl font-semibold">
                  {posts.filter((p) => p.mediaUrl).length}
                </p>
              </div>
              <div className="col-span-2 mt-2 rounded-md bg-secondary/60 px-3 py-2 text-xs text-secondary-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>
                  File uploads are scanned and monitored via the Security
                  dashboard.
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SEARCH + FILTERS */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, tag or content..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-muted-foreground mr-2">Filter:</span>
            {(["all", "image", "video", "text"] as PostTypeFilter[]).map(
              (filter) => (
                <Button
                  key={filter}
                  type="button"
                  size="sm"
                  variant={typeFilter === filter ? "default" : "outline"}
                  className="capitalize"
                  onClick={() => setTypeFilter(filter)}
                >
                  {filter === "all" ? "All posts" : filter}
                </Button>
              )
            )}
          </div>
        </section>

        {/* LISTE DES POSTS */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Blog Posts</h2>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading posts...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No posts match your search.
              {isAuthenticated && (
                <>
                  {" "}
                  <Link href="/posts/new" className="text-primary underline">
                    Create your first post
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => {
                const type = getPostType(post.mediaType);
                const isNew =
                  new Date().getTime() - new Date(post.createdAt).getTime() <
                  1000 * 60 * 60 * 24 * 3; // < 3 jours

                return (
                  <Card
                    key={post.id}
                    className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {post.mediaUrl && (
                      <div className="w-full overflow-hidden relative">
                        {type !== "text" && (
                          <span className="absolute left-3 top-3 z-10 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
                            {type === "image" ? "Image" : "Video"}
                          </span>
                        )}
                        {isNew && (
                          <span className="absolute right-3 top-3 z-10 rounded-full bg-primary/90 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-primary-foreground">
                            New
                          </span>
                        )}
                        {post.mediaType?.startsWith("image") ? (
                          <Image
                            src={post.mediaUrl}
                            alt={post.title}
                            width={400}
                            height={192}
                            className="w-full h-48 object-cover transition-transform duration-300 hover:scale-[1.03]"
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
                      <CardTitle className="line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm">
                        {post.authorEmail} • {formatDate(post.createdAt)} •{" "}
                        {getReadingTime(post.content)}
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
                              className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                            >
                              #{tag}
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
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
