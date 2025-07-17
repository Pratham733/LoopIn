"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Users, UserCheck2, UserPlus2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type MockUser } from '@/types';
import { getUsersByFollowing } from '@/services/userService';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip, 
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { NetworkGraph } from '@/components/chat/NetworkGraph2';

interface NetworksSectionProps {
  currentUser: MockUser;
}

export function NetworksSection({ currentUser }: NetworksSectionProps) {
  const [mutualConnections, setMutualConnections] = useState<{[userId: string]: MockUser[]}>({});
  const [followedUsers, setFollowedUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGraph, setShowGraph] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        setLoading(true);

        // Fetch users the current user is following
        if (currentUser?.following && currentUser.following.length > 0) {
          const users = await getUsersByFollowing(currentUser.following);
          setFollowedUsers(users);

          // For each followed user, compute their mutual connections with the current user
          const mutualConnectionsData: {[userId: string]: MockUser[]} = {};
          
          for (const user of users) {
            if (user.following && user.following.length > 0) {
              // Find mutual following (people both the current user and this user follow)
              const mutualFollowingIds = currentUser.following.filter(id => 
                user.following.includes(id) && id !== user.id
              );
              
              if (mutualFollowingIds.length > 0) {
                const mutualUsers = await getUsersByFollowing(mutualFollowingIds);
                mutualConnectionsData[user.id] = mutualUsers;
              }
            }
          }
          
          setMutualConnections(mutualConnectionsData);
        }
      } catch (error) {
        console.error("Error fetching network data:", error);
        toast({
          title: "Error",
          description: "Failed to load network data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchNetworkData();
    }
  }, [currentUser, toast]);

  if (loading) {
    return (
      <Card className="shadow-sm bg-card/90 dark:bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Your Network</CardTitle>
          <CardDescription>View your connections and mutual friends</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // If user has no connections
  if (followedUsers.length === 0) {
    return (
      <Card className="shadow-sm bg-card/90 dark:bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Your Network</CardTitle>
          <CardDescription>View your connections and mutual friends</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert
            description="You don't have any connections yet. Start following people to build your network."
          />
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link href="/chat/friends?tab=find-people">
                <UserPlus2 className="mr-2 h-4 w-4" />
                Find People
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm bg-card/90 dark:bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Network</CardTitle>
            <CardDescription>View your connections and mutual friends</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowGraph(!showGraph)}
          >
            {showGraph ? 'Hide Graph' : 'Show Graph'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showGraph ? (
          <div className="h-[400px] mt-2 mb-6">
            <NetworkGraph 
              currentUser={currentUser}
              followedUsers={followedUsers}
              mutualConnections={mutualConnections}
            />
          </div>
        ) : null}

        <div className="space-y-6">
          {followedUsers.map(user => {
            const mutuals = mutualConnections[user.id] || [];
            
            return (
              <div key={user.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      {user.profileImage ? (
                        <AvatarImage src={user.profileImage} alt={user.username} />
                      ) : (
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <Link 
                        href={`/chat/profile/${user.id}`}
                        className="font-medium hover:underline"
                      >
                        {user.username}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {user.fullName || ''}
                      </p>
                    </div>
                  </div>
                  
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/chat/conversations/new?userId=${user.id}`}>
                      Message
                    </Link>
                  </Button>
                </div>

                {mutuals.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {mutuals.length} Mutual Connection{mutuals.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {mutuals.map(mutual => (
                        <TooltipProvider key={mutual.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/chat/profile/${mutual.id}`}>
                                <Avatar className="h-8 w-8">
                                  {mutual.profileImage ? (
                                    <AvatarImage src={mutual.profileImage} alt={mutual.username} />
                                  ) : (
                                    <AvatarFallback>
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
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
