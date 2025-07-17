/**
 * This file contains Firebase-compatible interfaces for post functionality.
 */

// Define types for media
export interface PostMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  aspectRatio?: number;
  width?: number;
  height?: number;
}

// Define types for location
export interface PostLocation {
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Define types for mentions
export interface PostMention {
  userId: string;
  username: string;
}

// Define Post interface
export interface Post {
  id: string;
  userId: string;
  username?: string; // Author's username
  userProfileImage?: string; // Author's profile image
  content: string;
  media?: PostMedia[];
  location?: PostLocation;
  tags?: string[];
  mentions?: PostMention[];
  likes?: string[]; // Array of user IDs
  comments?: PostComment[];
  visibility: 'public' | 'followers' | 'private';
  createdAt: string;
  updatedAt: string;
}

// Define Comment interface
export interface PostComment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  likes?: string[]; // Array of user IDs
}

// Mock object for testing
export const mockPost: Post = {
  id: 'test-post-id',
  userId: 'test-user-id',
  content: 'This is a test post!',
  visibility: 'public',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
