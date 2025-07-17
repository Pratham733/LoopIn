"use client";

import Link from 'next/link';
import Image from 'next/image';
import type { Conversation, MockUser } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { BellOff, Pin, Image as ImageIcon, FileText, UserCircle, Users, Circle, MessageCircle } from 'lucide-react';
import { FormattedTimestamp } from '@/components/common/FormattedTimestamp';
import { getProfileImageUrl } from '@/lib/firebase/storageUtils';
import { useState } from 'react';

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
}

export function ConversationItem({ conversation, isActive }: ConversationItemProps) {
  const { user: currentUser } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.id);
  const displayParticipant = otherParticipant || (conversation.participants.length > 0 ? conversation.participants[0] : ({} as MockUser));
  
  const displayName = conversation.isGroup ? conversation.name : displayParticipant?.username;
  const hasUnread = conversation.unreadCount > 0;

  const renderLastMessage = () => {
    if (!conversation.lastMessage) return <p className="italic text-muted-foreground">No messages yet</p>;

    const content = conversation.lastMessage.content;
    if (typeof content === 'string') {
      return <p>{content}</p>;
    }
    if (typeof content === 'object' && content !== null && 'type' in content) {
        if (content.type === 'image') {
          return <div className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> Photo</div>;
        }
        if (content.type === 'file') {
          return <div className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> File</div>;
        }
    }
    return <p className="italic text-muted-foreground">No messages yet</p>;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Link
      href={`/chat/conversations/${conversation.id}`}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ease-out cursor-pointer",
        // Base styles
        "bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm",
        // Hover and active states
        "hover:bg-white/70 hover:shadow-lg hover:scale-[1.02] hover:border-primary/30",
        "active:scale-[0.98]",
        // Dark mode
        "dark:bg-gray-800/50 dark:border-gray-700/50 dark:hover:bg-gray-800/70",
        // Active state
        isActive && "bg-primary/10 border-primary/50 shadow-lg scale-[1.01]",
        // Unread state
        hasUnread && !isActive && "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar Section */}
      <div className="relative flex-shrink-0">
        {conversation.isGroup ? (
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-xs font-bold text-white">G</span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-lg border-2 border-white/50">
              {displayParticipant ? (
                <Image
                  src={getProfileImageUrl(displayParticipant)}
                  alt={`${displayParticipant.username || 'User'}'s avatar`}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<svg class="h-14 w-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                    }
                  }}
                />
              ) : (
                <UserCircle className="h-14 w-14 text-gray-400" />
              )}
            </div>
            {/* Online status indicator */}
            {displayParticipant?.status && (
              <div className={cn(
                "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white shadow-sm",
                getStatusColor(displayParticipant.status)
              )} />
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-semibold text-base truncate",
              hasUnread ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"
            )}>
              {displayName || 'Unknown'}
            </h3>
            {conversation.isPinned && (
              <Pin className="h-4 w-4 text-primary flex-shrink-0" />
            )}
            {conversation.isMuted && (
              <BellOff className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {conversation.lastMessage && (
              <FormattedTimestamp 
                timestamp={conversation.lastMessage.timestamp} 
                className={cn(
                  "text-xs whitespace-nowrap",
                  hasUnread ? "text-primary font-medium" : "text-gray-500 dark:text-gray-400"
                )}
              />
            )}
            {/* Unread badge */}
            {hasUnread && (
              <div className="flex items-center justify-center h-5 w-5 min-w-5 bg-primary text-white text-xs font-bold rounded-full shadow-sm">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={cn(
            "text-sm truncate flex-1",
            hasUnread ? "text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-400"
          )}>
            {renderLastMessage()}
          </div>
          {hasUnread && (
            <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className={cn(
        "absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity duration-300",
        isHovered && "opacity-100"
      )} />
    </Link>
  );
}
