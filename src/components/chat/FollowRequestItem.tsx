
"use client";

import type { FollowRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Check, X, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { FormattedTimestamp } from '../common/FormattedTimestamp';
import { getProfileImageUrl } from '@/lib/firebase/storageUtils';
import Image from 'next/image';

interface FollowRequestItemProps {
  request: FollowRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onClick?: (requestId: string) => void;
}

export function FollowRequestItem({ request, onAccept, onDecline, onClick }: FollowRequestItemProps) {
  const { fromUser } = request;

  const handleItemClick = () => {
    if (onClick) {
      onClick(request.id);
    }
  };

  return (
    <div 
      className="relative rounded-xl overflow-hidden flex flex-col items-center shadow-lg bg-card font-body w-full max-w-xs transition-all duration-200 ease-in-out hover:shadow-xl cursor-pointer"
      onClick={handleItemClick}
    >
      <div className="h-20 sm:h-24 w-full bg-primary"></div>

      <div className="z-10 flex items-center flex-col gap-3 sm:gap-4 px-4 sm:px-5 py-4 sm:py-5 w-full">
        <div className="-mt-16 sm:-mt-20">
          <Link 
            href={`/chat/profile/${fromUser.id}`} 
            aria-label={`View profile of ${fromUser.username}`}
            className="block transition-transform hover:scale-105"
            onClick={(e) => e.stopPropagation()} // Prevent triggering the parent onClick
          >
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-card flex items-center justify-center border-4 border-card shadow-md">
              {fromUser.profileImage ? (
                <Image
                  src={getProfileImageUrl(fromUser, 96)}
                  alt={`${fromUser.username}'s profile`}
                  width={96}
                  height={96}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-full w-full text-muted-foreground" />
              )}
            </div>
          </Link>
        </div>

        <div className="flex items-center flex-col text-center">
          <Link 
            href={`/chat/profile/${fromUser.id}`} 
            aria-label={`View profile of ${fromUser.username}`}
            className="group"
            onClick={(e) => e.stopPropagation()} // Prevent triggering the parent onClick
          >
            <p className="text-lg sm:text-xl font-semibold text-card-foreground group-hover:underline transition-colors">
              {fromUser.fullName || fromUser.username}
            </p>
          </Link>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5 px-2 line-clamp-2">
            {fromUser.bio || `Wants to follow you.`}
          </p>
          <FormattedTimestamp timestamp={request.timestamp} className="text-xs text-muted-foreground mt-1 sm:mt-1.5" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full pt-2 sm:pt-3">
          <Button
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the parent onClick
              onAccept(request.id);
            }}
            aria-label={`Accept follow request from ${fromUser.username}`}
            className="flex-1 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-3 py-1.5 sm:px-4 sm:py-2 h-auto transition-colors"
          >
            <Check className="mr-1 sm:mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Accept
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the parent onClick
              onDecline(request.id);
            }}
            aria-label={`Decline follow request from ${fromUser.username}`}
            variant="outline"
            className="flex-1 text-xs sm:text-sm bg-muted/60 hover:bg-destructive/20 text-muted-foreground hover:text-destructive border-border hover:border-destructive rounded-full px-3 py-1.5 sm:px-4 sm:py-2 h-auto transition-colors"
          >
            <X className="mr-1 sm:mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
