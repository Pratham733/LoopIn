"use client";

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';
import { getProfileImageUrl } from '@/lib/firebase/storageUtils';
import type { User } from '@/models/User';

interface UserAvatarProps {
  user: User | { profileImage?: string; avatar?: string; username?: string } | string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ user, size = 'md', className = '', fallbackClassName = '' }: UserAvatarProps) {
  // Handle different avatar sizes
  const sizeClass = typeof size === 'string' 
    ? {
        'xs': 'h-6 w-6',
        'sm': 'h-8 w-8',
        'md': 'h-10 w-10',
        'lg': 'h-12 w-12',
        'xl': 'h-16 w-16',
        '2xl': 'h-24 w-24',
      }[size] || 'h-10 w-10'
    : `h-[${size}px] w-[${size}px]`;
  
  const pixelSize = typeof size === 'number' ? size : 
    { 'xs': 24, 'sm': 32, 'md': 40, 'lg': 48, 'xl': 64, '2xl': 96 }[size as string] || 40;
    
  const [imageUrl, setImageUrl] = useState<string>(() => {
    return getProfileImageUrl(user, pixelSize);
  });
  
  const [username, setUsername] = useState<string>(() => {
    if (!user) return 'U';
    if (typeof user === 'string') return 'U'; 
    return user.username?.slice(0, 1).toUpperCase() || 'U';
  });
  
  const [imageError, setImageError] = useState(false);
    // Reset error state when user or pixel size changes
  useEffect(() => {
    setImageError(false);
    const newUrl = getProfileImageUrl(user, pixelSize);
    
    // Update image URL when user or size changes
    console.log("UserAvatar: Setting image URL:", newUrl);
    setImageUrl(newUrl);
    
    if (typeof user !== 'string' && user && 'username' in user && user.username) {
      setUsername(user.username.slice(0, 1).toUpperCase());
    }
  }, [user, pixelSize]); // Remove imageUrl from dependencies
  
  // Handle image error
  const handleImageError = () => {
    console.log("Avatar image failed to load:", imageUrl);
    setImageError(true);
  };
  
  // Only display avatar, no upload button here
  function getInitials() {
    if (!user) return 'U';
    if (typeof user === 'string') return user.slice(0, 2).toUpperCase();
    const name = (user.username || user.name || '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      {(!imageError && imageUrl && imageUrl.trim() !== '') ? (
        <AvatarImage 
          src={imageUrl} 
          alt="User Avatar" 
          onError={handleImageError}
        />
      ) : (
        <AvatarFallback className={fallbackClassName}>
          {getInitials()}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

export default UserAvatar;
