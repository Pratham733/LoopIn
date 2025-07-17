"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, UserPlus, UserCheck, X, Check, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getPendingFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/services/friendRequestService';
import { getUserProfile } from '@/services/userService';
import { markNotificationsAsReadByCategoryAndActor } from '@/services/notificationService';
import type { MockUser, FriendRequest } from '@/types';

export default function FriendRequestsPage() {
  const router = useRouter();
  const { user: authUser, updateUser: updateAuthUser } = useAuth();
  const { toast } = useToast();

  const [friendRequests, setFriendRequests] = useState<(FriendRequest & { fromUser: MockUser })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFriendRequests() {
      if (!authUser) return;
      
      setIsLoading(true);
      try {
        const requests = await getPendingFriendRequests(authUser.id);
        
        // Fetch user details for each request
        const requestsWithUserDetails = await Promise.all(
          requests.map(async (request) => {
            const fromUser = await getUserProfile(request.fromUserId);
            return {
              ...request,
              fromUser: fromUser!
            };
          })
        );
        
        setFriendRequests(requestsWithUserDetails.filter(req => req.fromUser));
      } catch (error) {
        console.error("Error fetching friend requests:", error);
        toast({ 
          title: "Error", 
          description: "Failed to load friend requests.", 
          variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchFriendRequests();
  }, [authUser, toast]);

  const handleAcceptRequest = async (requestId: string, fromUserId: string) => {
    if (!authUser) return;
    
    setProcessingRequest(requestId);
    
    try {
      await acceptFriendRequest(fromUserId, authUser.id);
      
      // Mark any related notifications as read
      try {
        await markNotificationsAsReadByCategoryAndActor(authUser.id, 'follow_request', fromUserId);
      } catch (notificationError) {
        // Ignore notification errors as the main action succeeded
        console.warn('Could not mark notification as read:', notificationError);
      }
      
      // Remove from local state
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Update auth user to reflect new follower
      const updatedUser = await getUserProfile(authUser.id);
      if (updatedUser) {
        updateAuthUser(updatedUser);
      }
      
      toast({
        title: "Request Accepted",
        description: "You are now following each other!",
      });
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string, fromUserId: string) => {
    if (!authUser) return;
    
    setProcessingRequest(requestId);
    
    try {
      await rejectFriendRequest(fromUserId, authUser.id);
      
      // Mark any related notifications as read
      try {
        await markNotificationsAsReadByCategoryAndActor(authUser.id, 'follow_request', fromUserId);
      } catch (notificationError) {
        // Ignore notification errors as the main action succeeded
        console.warn('Could not mark notification as read:', notificationError);
      }
      
      // Remove from local state
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast({
        title: "Request Rejected",
        description: "The follow request has been declined.",
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRequestClick = async (requestId: string, fromUserId: string) => {
    if (!authUser) return;
    
    try {
      // Mark any related notifications as read when user clicks on the request
      try {
        await markNotificationsAsReadByCategoryAndActor(authUser.id, 'follow_request', fromUserId);
      } catch (notificationError) {
        // Ignore notification errors as this is just a view action
        console.warn('Could not mark notification as read:', notificationError);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading friend requests...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-4 px-2 sm:py-6 sm:px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          onClick={() => router.back()} 
          variant="ghost" 
          size="icon"
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Friend Requests</h1>
          {friendRequests.length > 0 && (
            <Badge variant="default">{friendRequests.length}</Badge>
          )}
        </div>
      </div>

      {friendRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Friend Requests</h3>
            <p className="text-muted-foreground">
              You don't have any pending friend requests at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {friendRequests.length} pending request{friendRequests.length !== 1 ? 's' : ''}
          </p>
          
          {friendRequests.map((request) => (
            <Card 
              key={request.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRequestClick(request.id, request.fromUserId)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={request.fromUser.profileImage || request.fromUser.avatar} 
                      alt={request.fromUser.username}
                    />
                    <AvatarFallback>
                      {request.fromUser.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{request.fromUser.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      {request.fromUser.fullName || request.fromUser.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    onClick={() => handleAcceptRequest(request.id, request.fromUserId)}
                    variant="default"
                    size="sm"
                    disabled={processingRequest === request.id}
                  >
                    {processingRequest === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleRejectRequest(request.id, request.fromUserId)}
                    variant="outline"
                    size="sm"
                    disabled={processingRequest === request.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
