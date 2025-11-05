import { CognitoUser } from "./cognito";
import { BlogPost } from "../types";

export enum Permission {
  CREATE_POST = "create_post",
  EDIT_OWN_POST = "edit_own_post",
  EDIT_ANY_POST = "edit_any_post",
  DELETE_OWN_POST = "delete_own_post",
  DELETE_ANY_POST = "delete_any_post",
  PUBLISH_POST = "publish_post",
  MODERATE_COMMENTS = "moderate_comments",
  MANAGE_USERS = "manage_users",
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.EDIT_ANY_POST,
    Permission.DELETE_OWN_POST,
    Permission.DELETE_ANY_POST,
    Permission.PUBLISH_POST,
    Permission.MODERATE_COMMENTS,
    Permission.MANAGE_USERS,
  ],
  editor: [
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.EDIT_ANY_POST,
    Permission.DELETE_OWN_POST,
    Permission.DELETE_ANY_POST,
    Permission.PUBLISH_POST,
    Permission.MODERATE_COMMENTS,
  ],
  guest_author: [
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
  ],
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (
  user: CognitoUser | null,
  permission: Permission
): boolean => {
  if (!user || !user.role) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
};

/**
 * Check if a user can edit a specific post
 */
export const canEditPost = (
  user: CognitoUser | null,
  post: BlogPost
): boolean => {
  if (!user || !user.userId) {
    return false;
  }

  // Admin can edit any post
  if (hasPermission(user, Permission.EDIT_ANY_POST)) {
    return true;
  }

  // User can edit their own post
  if (
    hasPermission(user, Permission.EDIT_OWN_POST) &&
    post.authorId === user.userId
  ) {
    return true;
  }

  return false;
};

/**
 * Check if a user can delete a specific post
 */
export const canDeletePost = (
  user: CognitoUser | null,
  post: BlogPost
): boolean => {
  if (!user || !user.userId) {
    return false;
  }

  // Admin can delete any post
  if (hasPermission(user, Permission.DELETE_ANY_POST)) {
    return true;
  }

  // User can delete their own post
  if (
    hasPermission(user, Permission.DELETE_OWN_POST) &&
    post.authorId === user.userId
  ) {
    return true;
  }

  return false;
};

/**
 * Check if a user can publish a post
 */
export const canPublishPost = (user: CognitoUser | null): boolean => {
  return hasPermission(user, Permission.PUBLISH_POST);
};
