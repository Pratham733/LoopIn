
"use client";

import type { MockUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, UserCheck, MessageSquare, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import UserAvatar from '@/components/common/UserAvatar';
import React from 'react';
import { AlertDialogDemo } from '@/components/ui/alert-dialog-demo';

interface UserListItemProps {
  user: MockUser;
  currentUser: MockUser;
  onFollowToggle: (userId: string) => void;
  variant: 'follower' | 'searchResult'; 
}

export function UserListItem({ user, currentUser, onFollowToggle, variant }: UserListItemProps) {
  const isFollowing = currentUser.following.includes(user.id);
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 ease-in-out bg-card/90 dark:bg-card/80 backdrop-blur-sm">
      <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
        <Link href={`/chat/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-accent/50 p-2 rounded-md transition-colors duration-150" aria-label={`View profile of ${user.username}`}>
          <UserAvatar user={user} size={48} className="h-10 w-10 sm:h-12 sm:w-12" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-sm sm:text-base">{user.username}</p>
            <p className={cn(
                "text-xs font-medium capitalize",
                user.status === 'online' ? 'text-green-500' : 'text-muted-foreground'
              )}
            >
              {user.status}
            </p>
          </div>
        </Link>
        <div className="flex flex-col sm:flex-row gap-2">
          {user.id !== currentUser.id && (
            isFollowing && user.isPrivate ? (
              <AlertDialogDemo
                title={`Unfollow @${user.username}?`}
                description={`Are you sure you want to unfollow this private account? You may need to request to follow again if you change your mind.`}
                actionLabel="Unfollow"
                cancelLabel="Cancel"
                onAction={() => onFollowToggle(user.id)}
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Unfollow ${user.username}`}
                    className="hover:bg-destructive/10"
                  >
                    <UserCheck className="h-4 w-4 text-destructive" />
                  </Button>
                }
              />
            ) : (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="icon"
                onClick={() => onFollowToggle(user.id)}
                aria-label={isFollowing ? `Unfollow ${user.username}` : `Follow ${user.username}`}
                className={isFollowing ? "hover:bg-destructive/10" : "hover:bg-primary/90"}
              >
                {isFollowing ? <UserCheck className="h-4 w-4 text-destructive" /> : <UserPlus className="h-4 w-4" />}
              </Button>
            )
          )}
           <Button asChild variant="ghost" size="icon" className="hover:bg-primary/10">
            <Link href={`/chat/conversations/new?userId=${user.id}`} aria-label={`Message ${user.username}`}>
              <MessageSquare className="h-4 w-4 text-primary" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
