import type { MockUser } from '@/types';
import { Home, MessageSquare, Bell, PlusSquare, UserCircle, Settings as SettingsIcon, Bot, Users, Search, Menu, UserPlus as UserPlusIcon } from 'lucide-react';

// Default avatar URL used when a user doesn't have an avatar
export const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random&color=fff';

// Maximum profile image size in KB (1MB)
export const MAX_PROFILE_IMAGE_SIZE_KB = 1024;

// Instagram-like sidebar links
export const SIDEBAR_LINKS = [
  { href: "/chat", label: "Home", icon: Home },
  { href: "/chat/search-global", label: "Search", icon: Search }, 
  { href: "/chat/conversations", label: "Messages", icon: MessageSquare, badgeKey: "unreadConversations" },
  { href: "/chat/friend-requests", label: "Requests", icon: UserPlusIcon, badgeKey: "pendingRequests" }, // Added Requests link
  { href: "/chat/notifications", label: "Notifications", icon: Bell, badgeKey: "unreadNotifications" },
  { href: "/chat/create-post", label: "Create", icon: PlusSquare },
  { href: "/chat/profile", label: "Profile", icon: UserCircle },
  { href: "/chat/ai-assistant", label: "AI Assistant", icon: Bot }, 
];

export const SIDEBAR_SECONDARY_LINKS = [
];


export const USER_DROPDOWN_LINKS = [
  { href: "/chat/profile", label: "Profile", icon: UserCircle },
  { href: "/chat/friends", label: "People", icon: Users },
  { href: "/chat/settings", label: "Settings", icon: SettingsIcon },
];
