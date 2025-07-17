/**
 * This file previously contained a Mongoose model for User.
 * Now it provides type definitions for Firebase user data structure.
 */

// Define the User interface to match Firebase structure
export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  bio: string;
  followers: string[];
  following: string[];
  isPrivate: boolean;
  savedPosts: string[];
  showCurrentlyPlaying: boolean;
  profileImage?: string;
  profileCoverImage?: string;
  lastActive?: string; // ISO date string
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// Mock object for testing
export const mockUser: User = {
  id: 'test-user-id',
  username: 'testuser',
  fullName: 'Test User',
  email: 'test@example.com',
  status: 'online',
  bio: 'Welcome to LoopIn!',
  followers: [],
  following: [],
  isPrivate: false,
  savedPosts: [],
  showCurrentlyPlaying: true
};

export default User;
