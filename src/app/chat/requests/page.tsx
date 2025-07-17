
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { FollowRequest } from '@/types';
import { FollowRequestItem } from '@/components/chat/FollowRequestItem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Users, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPendingFriendRequests } from '@/services/friendRequestService';
import { acceptFriendRequest, rejectFriendRequest } from '@/services/friendRequestService';
import { getUserProfile } from '@/services/userService';
import { markNotificationsAsReadByCategoryAndActor } from '@/services/notificationService';

export default function FollowRequestsPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchRequests();
    } else if (!authLoading) {
      setIsLoadingRequests(false);
    }
  }, [currentUser, authLoading]);

  const fetchRequests = async () => {
    if (!currentUser) return;
    
    setIsLoadingRequests(true);
    try {
      const pendingRequests = await getPendingFriendRequests(currentUser.id);
      
      // Fetch user profiles for each request and convert to FollowRequest type
      const requestsWithProfiles = await Promise.all(
        pendingRequests.map(async (request) => {
          const fromUser = await getUserProfile(request.fromUserId);
          return {
            id: request.id,
            fromUser: fromUser || {
              id: request.fromUserId,
              username: 'Unknown User',
              email: '',
              status: 'offline',
              followers: [],
              following: [],
              bio: '',
              isPrivate: false,
              savedPosts: []
            },
            toUserId: request.toUserId,
            timestamp: request.createdAt, // Convert createdAt to timestamp
            status: request.status === 'rejected' ? 'declined' : request.status // Map status
          } as FollowRequest;
        })
      );
      
      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load follow requests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      const request = requests.find(req => req.id === requestId);
      if (!request) return;
      
      await acceptFriendRequest(request.fromUser.id, currentUser.id);
      
      // Mark any related notifications as read
      try {
        await markNotificationsAsReadByCategoryAndActor(currentUser.id, 'follow_request', request.fromUser.id);
      } catch (notificationError) {
        // Ignore notification errors as the main action succeeded
        console.warn('Could not mark notification as read:', notificationError);
      }
      
      // Remove the request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast({ 
        title: "Follow Request Accepted", 
        description: `You are now following ${request.fromUser.username}.` 
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({ 
        variant: "destructive", 
        title: "Failed to Accept Request",
        description: "Please try again."
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      const request = requests.find(req => req.id === requestId);
      if (!request) return;
      
      await rejectFriendRequest(request.fromUser.id, currentUser.id);
      
      // Mark any related notifications as read
      try {
        await markNotificationsAsReadByCategoryAndActor(currentUser.id, 'follow_request', request.fromUser.id);
      } catch (notificationError) {
        // Ignore notification errors as the main action succeeded
        console.warn('Could not mark notification as read:', notificationError);
      }
      
      // Remove the request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast({ 
        title: "Follow Request Declined",
        description: "The request has been declined."
      });
    } catch (error) {
      console.error('Error declining request:', error);
      toast({ 
        variant: "destructive", 
        title: "Failed to Decline Request",
        description: "Please try again."
      });
    }
  };

  const handleRequestClick = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      const request = requests.find(req => req.id === requestId);
      if (!request) return;
      
      // Mark any related notifications as read when user clicks on the request
      try {
        await markNotificationsAsReadByCategoryAndActor(currentUser.id, 'follow_request', request.fromUser.id);
      } catch (notificationError) {
        // Ignore notification errors as this is just a view action
        console.warn('Could not mark notification as read:', notificationError);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (authLoading || isLoadingRequests) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Follow Requests...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-3" />
        <p className="text-muted-foreground">Please log in to see follow requests.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-2 sm:p-4 md:p-6 h-full flex flex-col">
      <div className="mb-4 sm:mb-6">
        <h1 className="font-headline text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
          <Users className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 md:h-8 md:w-8 text-primary" /> Follow Requests
        </h1>
      </div>
      
      <Card className="flex-grow flex flex-col shadow-xl bg-card/80 dark:bg-card/70 backdrop-blur-sm">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-lg sm:text-xl">Pending Requests</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Manage users who want to follow you.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-grow flex flex-col overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 sm:py-16 flex-grow flex flex-col items-center justify-center">
              <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-sm sm:text-base">No pending follow requests.</p>
              <p className="text-xs sm:text-sm">When someone requests to follow you, you'll see it here.</p>
            </div>
          ) : (
            <ScrollArea className="flex-grow bg-muted/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {requests.map(request => (
                  <FollowRequestItem
                    key={request.id}
                    request={request}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onClick={handleRequestClick}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
