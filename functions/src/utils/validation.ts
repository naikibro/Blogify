import { CreatePostRequest, UpdatePostRequest } from "../types";

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 100000; // 100KB
const MAX_EXCERPT_LENGTH = 500;
const MAX_TAG_LENGTH = 50;
const MAX_TAGS_COUNT = 20;

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate post creation request
 */
export const validateCreatePost = (
  body: CreatePostRequest
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (
    !body.title ||
    typeof body.title !== "string" ||
    body.title.trim().length === 0
  ) {
    errors.push({ field: "title", message: "Title is required" });
  } else if (body.title.length > MAX_TITLE_LENGTH) {
    errors.push({
      field: "title",
      message: `Title must be ${MAX_TITLE_LENGTH} characters or less`,
    });
  }

  if (
    !body.content ||
    typeof body.content !== "string" ||
    body.content.trim().length === 0
  ) {
    errors.push({ field: "content", message: "Content is required" });
  } else if (body.content.length > MAX_CONTENT_LENGTH) {
    errors.push({
      field: "content",
      message: `Content must be ${MAX_CONTENT_LENGTH} characters or less`,
    });
  }

  if (body.excerpt && body.excerpt.length > MAX_EXCERPT_LENGTH) {
    errors.push({
      field: "excerpt",
      message: `Excerpt must be ${MAX_EXCERPT_LENGTH} characters or less`,
    });
  }

  if (body.tags) {
    if (!Array.isArray(body.tags)) {
      errors.push({ field: "tags", message: "Tags must be an array" });
    } else {
      if (body.tags.length > MAX_TAGS_COUNT) {
        errors.push({
          field: "tags",
          message: `Maximum ${MAX_TAGS_COUNT} tags allowed`,
        });
      }

      body.tags.forEach((tag, index) => {
        if (typeof tag !== "string" || tag.trim().length === 0) {
          errors.push({
            field: `tags[${index}]`,
            message: "Tag must be a non-empty string",
          });
        } else if (tag.length > MAX_TAG_LENGTH) {
          errors.push({
            field: `tags[${index}]`,
            message: `Tag must be ${MAX_TAG_LENGTH} characters or less`,
          });
        }
      });
    }
  }

  return errors;
};

/**
 * Validate post update request
 */
export const validateUpdatePost = (
  body: UpdatePostRequest
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      errors.push({ field: "title", message: "Title cannot be empty" });
    } else if (body.title.length > MAX_TITLE_LENGTH) {
      errors.push({
        field: "title",
        message: `Title must be ${MAX_TITLE_LENGTH} characters or less`,
      });
    }
  }

  if (body.content !== undefined) {
    if (typeof body.content !== "string" || body.content.trim().length === 0) {
      errors.push({ field: "content", message: "Content cannot be empty" });
    } else if (body.content.length > MAX_CONTENT_LENGTH) {
      errors.push({
        field: "content",
        message: `Content must be ${MAX_CONTENT_LENGTH} characters or less`,
      });
    }
  }

  if (body.excerpt !== undefined && body.excerpt.length > MAX_EXCERPT_LENGTH) {
    errors.push({
      field: "excerpt",
      message: `Excerpt must be ${MAX_EXCERPT_LENGTH} characters or less`,
    });
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.push({ field: "tags", message: "Tags must be an array" });
    } else {
      if (body.tags.length > MAX_TAGS_COUNT) {
        errors.push({
          field: "tags",
          message: `Maximum ${MAX_TAGS_COUNT} tags allowed`,
        });
      }

      body.tags.forEach((tag, index) => {
        if (typeof tag !== "string" || tag.trim().length === 0) {
          errors.push({
            field: `tags[${index}]`,
            message: "Tag must be a non-empty string",
          });
        } else if (tag.length > MAX_TAG_LENGTH) {
          errors.push({
            field: `tags[${index}]`,
            message: `Tag must be ${MAX_TAG_LENGTH} characters or less`,
          });
        }
      });
    }
  }

  return errors;
};

/**
 * Validate media upload request
 */
export const validateMediaUpload = (
  fileName: string,
  contentType: string,
  fileSize?: number
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (
    !fileName ||
    typeof fileName !== "string" ||
    fileName.trim().length === 0
  ) {
    errors.push({ field: "fileName", message: "File name is required" });
  }

  if (!contentType || typeof contentType !== "string") {
    errors.push({ field: "contentType", message: "Content type is required" });
  } else {
    // Validate content type
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ];

    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      errors.push({
        field: "contentType",
        message: `Content type must be one of: ${allowedTypes.join(", ")}`,
      });
    }
  }

  // File size limits (if provided)
  if (fileSize !== undefined) {
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

    const isImage = contentType?.startsWith("image/");
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    const maxSizeMB = maxSize / (1024 * 1024);

    if (fileSize > maxSize) {
      errors.push({
        field: "fileSize",
        message: `File size must be ${maxSizeMB}MB or less`,
      });
    }
  }

  return errors;
};
