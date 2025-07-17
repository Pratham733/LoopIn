
"use client";

import type { ChatMessage, MockUser } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { FileText, Download, Crown, UserCircle, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { getProfileImageUrl } from '@/lib/firebase/storageUtils';
import SplitText from '@/components/magicui/SplitText';
import { useState } from 'react';

interface MessageBubbleProps {
  message: ChatMessage;
  senderDetails?: MockUser;
  senderRole?: 'admin' | 'coAdmin';
  isHighlighted?: boolean;
  onMediaView?: (messageId: string) => void;
  isMediaViewed?: (messageId: string) => boolean;
}

export function MessageBubble({ 
  message, 
  senderDetails, 
  senderRole, 
  isHighlighted,
  onMediaView,
  isMediaViewed
}: MessageBubbleProps) {
  const { user: currentUser } = useAuth();
  const isCurrentUserSender = message.senderId === currentUser?.id;
  const isAISender = message.senderId === "ai-assistant";

  const senderName = isCurrentUserSender ? currentUser?.username : senderDetails?.username;

  const handleMediaClick = (messageId: string) => {
    if (onMediaView) {
      onMediaView(messageId);
    }
  };

  const renderContent = () => {
    if (typeof message.content === 'string') {
      return <SplitText text={message.content} className="whitespace-pre-wrap break-words" delay={50} duration={0.5} splitType="chars" from={{ opacity: 0, y: 40 }} to={{ opacity: 1, y: 0 }} threshold={0.1} rootMargin="-100px" textAlign="left" />;
    }
    if (message.content.type === 'image') {
      // Handle loading state
      if (message.content.url === '#loading') {
        return (
          <div className="space-y-2">
            {message.content.text && <p className="whitespace-pre-wrap break-words">{message.content.text}</p>}
            <div className="w-48 h-32 bg-secondary/50 rounded-md flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-muted-foreground">Uploading image...</p>
              </div>
            </div>
          </div>
        );
      }
      
      // Check if media has been viewed
      const hasBeenViewed = isMediaViewed ? isMediaViewed(message.id) : false;
      
      return (
        <div className="space-y-2">
          {message.content.text && <p className="whitespace-pre-wrap break-words">{message.content.text}</p>}
          {!hasBeenViewed ? (
            <div 
              className="w-48 h-32 bg-secondary/50 rounded-md flex items-center justify-center cursor-pointer hover:bg-secondary/70 transition-colors"
              onClick={() => handleMediaClick(message.id)}
            >
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-muted-foreground">Click to view image</p>
              </div>
            </div>
          ) : (
            <Image
              src={message.content.url}
              alt={message.content.name || 'Chat image'}
              width={300}
              height={200}
              className="rounded-md object-cover max-w-xs cursor-pointer"
              data-ai-hint={message.content.url.includes('placehold.co') ? "placeholder image" : "chat image"}
              onClick={() => {
                if (typeof message.content !== 'string' && message.content.type === 'image') {
                  window.open(message.content.url, '_blank');
                }
              }}
            />
          )}
        </div>
      );
    }
    if (typeof message.content !== 'string' && message.content.type === 'video') {
      // Check if media has been viewed
      const hasBeenViewed = isMediaViewed ? isMediaViewed(message.id) : false;
      
      return (
        <div className="space-y-2">
          {message.content.text && <p className="whitespace-pre-wrap break-words">{message.content.text}</p>}
          {!hasBeenViewed ? (
            <div 
              className="w-48 h-32 bg-secondary/50 rounded-md flex items-center justify-center cursor-pointer hover:bg-secondary/70 transition-colors"
              onClick={() => handleMediaClick(message.id)}
            >
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-muted-foreground">Click to view video</p>
              </div>
            </div>
          ) : (
            <video
              src={message.content.url}
              controls
              className="rounded-md max-w-xs"
              style={{ maxHeight: '300px' }}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      );
    }
    if (message.content.type === 'file') {
      // Handle loading state
      if (message.content.url === '#loading') {
        return (
          <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md">
            <FileText className="h-8 w-8 text-primary animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{message.content.name}</p>
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </div>
          </div>
        );
      }
      
      // Check if media has been viewed
      const hasBeenViewed = isMediaViewed ? isMediaViewed(message.id) : false;
      
      if (!hasBeenViewed) {
        return (
          <div 
            className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md cursor-pointer hover:bg-secondary/70 transition-colors"
            onClick={() => handleMediaClick(message.id)}
          >
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{message.content.name}</p>
              <p className="text-xs text-muted-foreground">Click to view/download</p>
            </div>
            <Download className="h-5 w-5 text-muted-foreground" />
          </div>
        );
      }
      
      return (
        <a
          href={message.content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-secondary/50 rounded-md hover:bg-secondary transition-colors"
        >
          <FileText className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium truncate">{message.content.name}</p>
            <p className="text-xs text-muted-foreground">
              {message.content.size ? `${(message.content.size / 1024 / 1024).toFixed(1)} MB - ` : ''}
              Click to view/download
            </p>
          </div>
          <Download className="h-5 w-5 text-muted-foreground" />
        </a>
      );
    }
    if (message.content.type === 'profile_share') {
        const profile = message.content;
        return (
            <Link href={`/chat/profile/${profile.userId}`} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors not-prose">
                <UserCircle className="h-12 w-12 text-muted-foreground" />
                <div className="flex-1">
                    <p className="font-bold text-sm">{profile.username}</p>
                    <p className="text-xs text-muted-foreground">{profile.fullName || 'View Profile'}</p>
                </div>
                <Button variant="outline" size="sm" className="self-center">View</Button>
            </Link>
        )
    }
    if (message.content.type === 'location_share') {
        const location = message.content;
        const mapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        const mapImageUrl = `https://placehold.co/300x150.png?text=Map+View`;
        return (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block space-y-2">
                <Image
                    src={mapImageUrl}
                    alt="Map view of shared location"
                    width={300}
                    height={150}
                    className="rounded-md object-cover"
                    data-ai-hint="map location"
                />
                <p className="text-xs text-center text-muted-foreground hover:underline">View on Google Maps</p>
            </a>
        )
    }
    return null;
  };

  const SenderIcon = () => {
    const profileImageUrl = isCurrentUserSender 
      ? getProfileImageUrl(currentUser, 32)
      : getProfileImageUrl(senderDetails, 32);
    
    const fallbackText = isCurrentUserSender 
      ? currentUser?.username?.charAt(0).toUpperCase() || 'U'
      : senderDetails?.username?.charAt(0).toUpperCase() || 'U';

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative self-end mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted overflow-hidden">
                {isAISender ? (
                  <Bot className="h-5 w-5 text-primary" />
                ) : (
                  <Image
                    src={profileImageUrl}
                    alt={`${senderName}'s profile`}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      // If image fails to load, replace with a simple div with initials
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="flex items-center justify-center w-full h-full text-xs font-medium text-white rounded-full bg-gray-500">${fallbackText}</div>`;
                      }
                    }}
                  />
                )}
              </div>
              {senderRole && (
                <Crown className="absolute -top-1.5 -right-1.5 h-4 w-4 text-amber-400 fill-amber-400 rotate-12" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side={isCurrentUserSender ? 'right' : 'left'}>
            <p>{isCurrentUserSender ? `You ${senderRole ? `(${senderRole})` : ''}` : `${senderName} ${senderRole ? `(${senderRole})` : ''}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className={cn("flex items-end gap-2 my-2", isCurrentUserSender ? "justify-end" : "justify-start")}>
      {!isCurrentUserSender && <SenderIcon />}
      <div
        className={cn(
          "max-w-[70%] p-3 rounded-xl shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5",
          isCurrentUserSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none border",
          isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        {renderContent()}
        <p className={cn(
            "text-xs mt-1.5",
            isCurrentUserSender ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
          )}>
          {format(new Date(message.timestamp), "p")}
        </p>
      </div>
      {isCurrentUserSender && <SenderIcon />}
    </div>
  );
}
