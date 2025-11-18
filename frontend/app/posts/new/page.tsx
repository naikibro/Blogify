"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { usePostForm } from "@/lib/hooks/usePostForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  X,
  ImageIcon,
  Tag as TagIcon,
  UploadCloud,
  Info,
} from "lucide-react";

export default function NewPostPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const {
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
  } = usePostForm();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const hasMedia = mediaPreview || formData.mediaUrl;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      {/* HEADER */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Posts
            </Button>
          </Link>

          <div className="hidden items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground md:flex">
            <Info className="h-3 w-3" />
            <span>A strong title + a good image = more views 📈</span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  Create New Post
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Write your article, add an image or video, then a few tags so
                  people can easily find it.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 md:inline-flex">
                <CheckDot />
                <span>Draft or publish immediately – it&apos;s up to you</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* MAIN GRID */}
              <div className="grid gap-8 md:grid-cols-[minmax(0,2.1fr),minmax(260px,1fr)]">
                {/* LEFT COLUMN: Title + Content */}
                <div className="space-y-6">
                  {/* TITLE */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Title
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        Required
                      </span>
                    </div>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g. 10 tips to improve your blog"
                      className="h-11 rounded-xl"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      A clear, specific and slightly catchy title works best.
                    </p>
                  </div>

                  {/* CONTENT */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content" className="text-sm font-medium">
                        Content
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        Short paragraphs work well ✍️
                      </span>
                    </div>
                    <Textarea
                      id="content"
                      rows={15}
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Start writing your article here..."
                      className="rounded-xl"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      You can structure it with subheadings, lists, concrete
                      examples, etc.
                    </p>
                  </div>
                </div>

                {/* RIGHT COLUMN: Excerpt / Tags / Publish */}
                <div className="space-y-5">
                  {/* EXCERPT */}
                  <div className="space-y-2">
                    <Label htmlFor="excerpt" className="text-sm font-medium">
                      Excerpt (optional)
                    </Label>
                    <Textarea
                      id="excerpt"
                      rows={3}
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData({ ...formData, excerpt: e.target.value })
                      }
                      placeholder="A short sentence that makes people want to read the post…"
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in the posts list and share previews.
                    </p>
                  </div>

                  {/* TAGS */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <TagIcon className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="tags" className="text-sm font-medium">
                        Tags
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="e.g. tech, design, product"
                        className="rounded-xl"
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        variant="outline"
                        className="shrink-0 rounded-xl"
                      >
                        Add
                      </Button>
                    </div>

                    {formData.tags && formData.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 rounded-full p-0.5 text-xs hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      3–5 relevant tags are more than enough.
                    </p>
                  </div>

                  {/* PUBLISH CHECKBOX */}
                  <div className="mt-4 rounded-xl border bg-muted/40 px-3 py-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="published"
                        checked={formData.published}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            published: e.target.checked,
                          })
                        }
                        className="mt-1 h-4 w-4 rounded border-muted-foreground/40 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="published"
                          className="cursor-pointer text-sm font-medium"
                        >
                          Publish immediately
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          If unchecked, the post will be saved as a draft.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MEDIA */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="media" className="text-sm font-medium">
                    Media (Image or Video)
                  </Label>
                </div>

                {hasMedia ? (
                  <div className="relative overflow-hidden rounded-2xl border bg-muted/40">
                    {formData.mediaType?.startsWith("image") ? (
                      <Image
                        src={mediaPreview || formData.mediaUrl || ""}
                        alt="Preview"
                        width={1200}
                        height={400}
                        className="h-64 w-full object-cover"
                      />
                    ) : formData.mediaType?.startsWith("video") ? (
                      <video
                        src={mediaPreview || formData.mediaUrl}
                        className="h-64 w-full object-cover"
                        controls
                      />
                    ) : null}

                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/40 to-transparent px-4 py-3 text-xs text-white">
                      <span className="flex items-center gap-2">
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>Media ready for publishing</span>
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={removeMedia}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      htmlFor="media"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/40 bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground transition hover:border-primary hover:bg-muted"
                    >
                      <UploadCloud className="mb-2 h-6 w-6" />
                      <span className="font-medium">
                        Click to upload an image or video
                      </span>
                      <span className="mt-1 text-xs">
                        PNG, JPG or MP4 — recommended size &lt; 10&nbsp;MB
                      </span>
                    </label>
                    <Input
                      id="media"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      disabled={uploading}
                      className="sr-only"
                    />
                    {uploading && (
                      <p className="text-sm text-muted-foreground">
                        Uploading...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground md:flex-row">
                <p className="text-xs md:text-sm">
                  You can always edit this post after it&apos;s created.
                </p>
                <div className="flex gap-3">
                  <Link href="/">
                    <Button type="button" variant="outline" className="rounded-xl">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl px-5"
                  >
                    {saving ? "Creating..." : "Create Post"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

/**
 * Badge component for the header hint
 */
function CheckDot() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-emerald-50">
      ✓
    </span>
  );
}
