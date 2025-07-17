export interface MockUser {
  id: string;
  username: string;
  fullName?: string; 
  displayName?: string; // Added for Firebase Auth compatibility
  email: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  followers: string[]; 
  following: string[]; 
  bio?: string; 
  isPrivate?: boolean; 
  savedPosts?: string[];
  showCurrentlyPlaying?: boolean;
  profileImage?: string;
  avatar?: string; // Added for backward compatibility
  profileCoverImage?: string;
  lastActive?: string; // ISO date string
  createdAt?: string;  // ISO date string
  updatedAt?: string;  // ISO date string
  pendingFollowRequests?: string[]; // Friend requests for private accounts
  blockedUsers?: string[]; // List of blocked user IDs
}

export interface ChatMessage {
  id: string;
  senderId: string;
  conversationId: string;
  content: string 
    | { name: string; url: string; type: 'image' | 'file' | 'video'; dataAiHint?: string; text?: string; size?: number; isUploading?: boolean }
    | { type: 'profile_share'; userId: string; username: string; fullName?: string }
    | { type: 'location_share'; latitude: number; longitude: number };
  timestamp: Date;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  participants: MockUser[];
  participantIds?: string[]; // Array of user IDs for direct access
  lastMessage: ChatMessage | null;
  unreadCount: number;
  name?: string; 
  isGroup?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  adminIds?: string[];
  coAdminIds?: string[];
}

export type NotificationCategory = 'message' | 'follow' | 'system' | 'post_like' | 'post_comment' | 'follow_request' | 'post_tag' | 'message_request';

export interface NotificationType {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actor?: MockUser;
}

export interface StatCardData {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  bgColor?: string;
}

export interface ThemePalette {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  primaryHex: string;
  background?: string;
}

export interface CustomTheme {
  name: string;
  palette: ThemePalette;
}

export interface Post {
  id: string;
  userId: string;
  username: string; 
  userProfileImage?: string; // Author's profile image
  content: string;
  media: {
    url: string;
    type: 'image' | 'video';
    dataAiHint?: string;
  }[];
  timestamp: Date;
  likes: string[]; 
  comments: PostComment[];
  taggedUserIds?: string[];
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  likes?: string[];
}

export interface FollowRequest {
  id: string;
  fromUser: MockUser;
  toUserId: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'declined';
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
