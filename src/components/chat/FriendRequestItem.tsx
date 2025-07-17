
"use client";

// This file is obsolete and has been replaced by FollowRequestItem.tsx
// It can be deleted from the project.

import type { MockUser } from '@/types'; // Kept types for basic structure
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface ObsoleteFriendRequestItemProps {
  request: { id: string, fromUser: MockUser, createdAt: Date }; // Simplified old structure
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onViewProfile: (user: MockUser) => void;
}

export function FriendRequestItem({ request, onAccept, onDecline, onViewProfile }: ObsoleteFriendRequestItemProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 ease-in-out bg-card/90 dark:bg-card/80 backdrop-blur-sm opacity-50 pointer-events-none">
      <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
        <button
          onClick={() => onViewProfile(request.fromUser)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-accent/50 p-2 rounded-md transition-colors duration-150"
          aria-label={`View profile of ${request.fromUser.username}`}
        >
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20">
            {request.fromUser.avatar && (
              <AvatarImage src={request.fromUser.avatar} alt={request.fromUser.username} data-ai-hint="person avatar"/>
            )}
            <AvatarFallback>{request.fromUser.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-sm sm:text-base">{request.fromUser.username}</p>
            <p className="text-xs text-muted-foreground">
              This component is obsolete. Use FollowRequestItem.tsx.
            </p>
          </div>
        </button>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="icon" onClick={() => onAccept(request.id)} aria-label="Accept friend request" className="hover:bg-green-500/10">
            <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onDecline(request.id)} aria-label="Decline friend request" className="hover:bg-red-500/10">
            <X className="h-4 w-4 text-red-600 dark:text-red-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
