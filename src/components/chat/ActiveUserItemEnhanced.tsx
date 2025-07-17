"use client";

import { useState, useEffect } from 'react';
import type { MockUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, UserPlus, UserCheck, Users, Calendar, Badge } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getUsersByFollowing } from '@/services/userService';
import { format } from 'date-fns';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActiveUserItemProps {
  user: MockUser;
  type: 'following' | 'suggestion';
  onFollowToggle: (userId: string) => void;
  isCurrentUserFollowing: boolean;
  currentUser?: MockUser;
}

export function ActiveUserItem({ 
  user, 
  type, 
  onFollowToggle, 
  isCurrentUserFollowing,
  currentUser
}: ActiveUserItemProps) {
  const [mutualConnections, setMutualConnections] = useState<MockUser[]>([]);
  const [loadingMutual, setLoadingMutual] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    const fetchMutualConnections = async () => {
      if (!currentUser) return;
      
      try {
        setLoadingMutual(true);
        
        // Find mutual connections (users that both the current user and this user follow)
        const mutualFollowingIds = currentUser.following.filter(id => 
          user.following?.includes(id)
        );
        
        if (mutualFollowingIds.length > 0) {
          // Fetch the actual user objects
          const mutualUsers = await getUsersByFollowing(mutualFollowingIds);
          setMutualConnections(mutualUsers.slice(0, 3)); // Limit to 3 mutual connections
        }
      } catch (error) {
        console.error("Error fetching mutual connections:", error);
      } finally {
        setLoadingMutual(false);
      }
    };

    if (user && currentUser && user.id !== currentUser.id) {
      fetchMutualConnections();
    }
  }, [user, currentUser]);

  // Format the join date if available
  const joinedDate = user.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : null;
  
  return (
    <Card className="text-center transition-all duration-200 ease-in-out hover:shadow-xl hover:scale-[1.01] bg-card/90 dark:bg-card/80 backdrop-blur-sm">
      <Link 
        href={`/chat/profile/${user.id}`} 
        className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-t-lg"
        aria-label={`View profile of ${user.username}`}
      >
        <CardHeader className="items-center pb-2 pt-4">
          <Avatar className="h-20 w-20">
            {user.profileImage ? (
              <AvatarImage src={user.profileImage} alt={user.username} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          
          {/* Status indicator */}
          <div className="mt-2 flex items-center justify-center">
            <span 
              className={cn(
                "inline-block w-2 h-2 rounded-full mr-1.5",
                user.status === 'online' ? "bg-green-500" : 
                user.status === 'away' ? "bg-yellow-500" : 
                user.status === 'busy' ? "bg-red-500" : "bg-gray-500"
              )}
            />
            <span className="text-xs capitalize text-muted-foreground">{user.status}</span>
            
            {/* Private account badge */}
            {user.isPrivate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="ml-2 h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Private account</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <CardTitle className="text-lg font-semibold truncate">{user.username}</CardTitle>
          {user.fullName && (
            <p className="text-sm text-muted-foreground mt-1 truncate">{user.fullName}</p>
          )}
          
          {/* Bio with expand toggle */}
          {user.bio && (
            <div className="mt-3 text-sm text-muted-foreground">
              <p className={cn(
                "transition-all duration-300",
                showFullBio ? "" : "line-clamp-2"
              )}>
                {user.bio}
              </p>
              {user.bio.length > 100 && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowFullBio(!showFullBio);
                  }}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  {showFullBio ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
          
          {/* Join date */}
          {joinedDate && (
            <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Joined {joinedDate}</span>
            </div>
          )}
          
          {/* Mutual connections */}
          {loadingMutual ? (
            <div className="mt-3 flex items-center justify-center">
              <Skeleton className="h-5 w-20" />
            </div>
          ) : mutualConnections.length > 0 ? (
            <div className="mt-3 flex flex-col items-center">
              <div className="flex items-center text-xs text-muted-foreground">
                <Users className="h-3 w-3 mr-1" />
                <span>{mutualConnections.length} mutual connection{mutualConnections.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1 justify-center">
                {mutualConnections.map(mutual => (
                  <TooltipProvider key={mutual.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/chat/profile/${mutual.id}`} onClick={(e) => e.stopPropagation()}>
                          <Avatar className="h-6 w-6">
                            {mutual.profileImage ? (
                              <AvatarImage src={mutual.profileImage} alt={mutual.username} />
                            ) : (
                              <AvatarFallback className="text-[10px]">
                                {mutual.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{mutual.username}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Link>
      
      <CardFooter className="flex flex-col sm:flex-row justify-center items-stretch gap-2 pt-0 pb-4 px-4">
        <Button asChild size="sm" className="flex-1">
          <Link href={`/chat/conversations/new?userId=${user.id}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Message
          </Link>
        </Button>
        {(type === 'suggestion' || type === 'following') && (
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onFollowToggle(user.id)}
            variant={isCurrentUserFollowing ? "outline" : "default"}
          >
            {isCurrentUserFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isCurrentUserFollowing ? "Unfollow" : "Follow"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
