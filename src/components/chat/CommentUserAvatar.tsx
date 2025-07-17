"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserCircle } from 'lucide-react';
import { getUserProfile } from '@/services/userService';
import { getProfileImageUrl } from '@/lib/firebase/storageUtils';
import type { MockUser } from '@/types';

interface CommentUserAvatarProps {
  userId: string;
  size?: number;
  className?: string;
}

export function CommentUserAvatar({ userId, size = 36, className = "" }: CommentUserAvatarProps) {
  const [userProfile, setUserProfile] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true);
        const profile = await getUserProfile(userId);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile for avatar:', error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div 
        className={`rounded-full bg-muted flex items-center justify-center shrink-0 animate-pulse ${className}`}
        style={{ width: size, height: size }}
      >
        <UserCircle className="text-muted-foreground" style={{ width: size * 0.8, height: size * 0.8 }} />
      </div>
    );
  }
  const profileImageUrl = userProfile?.profileImage ? getProfileImageUrl(userProfile.profileImage) : null;

  return (
    <Link href={`/chat/profile/${userId}`}>
      <div 
        className={`rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary/20 transition-all ${className}`}
        style={{ width: size, height: size }}
      >
        {profileImageUrl && !profileImageUrl.startsWith('blob:') ? (
          <Image
            src={profileImageUrl}
            alt={`${userProfile?.username || 'User'}'s avatar`}
            width={size}
            height={size}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to UserCircle icon on error
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<svg class="text-muted-foreground" style="width: ${size * 0.8}px; height: ${size * 0.8}px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`;
              }
            }}
          />
        ) : (
          <UserCircle className="text-muted-foreground" style={{ width: size * 0.8, height: size * 0.8 }} />
        )}
      </div>
    </Link>
  );
}
