
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { NotificationType } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { CheckCheck, BellOff, UserPlus, Users, MessageSquare, Heart, Bell, UserCircle } from 'lucide-react';
import { FormattedTimestamp } from '@/components/common/FormattedTimestamp';
import ShineBorder from '@/components/magicui/shine-border';
import Marquee from '@/components/magicui/marquee';
import { NotificationMarqueeCard } from '@/components/chat/NotificationMarqueeCard';
import { acceptFriendRequest, rejectFriendRequest } from '@/services/friendRequestService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getNotificationsForUser, 
  markAllNotificationsAsRead, 
  markNotificationAsRead,
  markNotificationsAsReadByCategoryAndActor,
  subscribeToNotifications 
} from '@/services/notificationService';
import { getPendingFriendRequests } from '@/services/friendRequestService';
import { useToast } from '@/hooks/use-toast';
import { getProfileImageUrl } from '@/lib/firebase/storageUtils';
import Image from 'next/image';
import React from 'react'; // Added missing import for React

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  // Real-time notifications subscription
  useEffect(() => {
    if (!authUser) return;

    setIsLoading(true);
    
    const unsubscribe = subscribeToNotifications(
      authUser.id,
      (notificationsData) => {
        setNotifications(notificationsData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error in notifications subscription:', error);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [authUser]);

  // Fetch pending requests
  useEffect(() => {
    if (!authUser) return;

    const fetchRequests = async () => {
      try {
        const requestsData = await getPendingFriendRequests(authUser.id);
        setPendingRequests(requestsData);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    fetchRequests();
  }, [authUser]);

  const handleMarkAsRead = async (id: string) => {
    if (!authUser) return;
    
    try {
      await markNotificationAsRead(authUser.id, id);
      toast({
        title: "Marked as Read",
        description: "Notification has been marked as read."
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!authUser) return;
    
    try {
      await markAllNotificationsAsRead(authUser.id);
      toast({
        title: "Marked as Read",
        description: "All notifications have been marked as read."
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive"
      });
    }
  };

  const handleAcceptRequest = async (notification: NotificationType) => {
    if (!notification.actor || !authUser) return;
    
    try {
      await acceptFriendRequest(notification.actor.id, authUser.id);
      
      // Mark notification as read using the new function
      try {
        await markNotificationsAsReadByCategoryAndActor(authUser.id, 'follow_request', notification.actor.id);
      } catch (notificationError) {
        // Fallback to individual notification marking
        try {
          await markNotificationAsRead(authUser.id, notification.id);
        } catch (fallbackError) {
          console.warn('Could not mark notification as read:', fallbackError);
        }
      }
      
      toast({
        title: "Request Accepted",
        description: `You are now following ${notification.actor.username}.`
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (notification: NotificationType) => {
    if (!notification.actor || !authUser) return;
    
    try {
      await rejectFriendRequest(notification.actor.id, authUser.id);
      
      // Mark notification as read using the new function
      try {
        await markNotificationsAsReadByCategoryAndActor(authUser.id, 'follow_request', notification.actor.id);
      } catch (notificationError) {
        // Fallback to individual notification marking
        try {
          await markNotificationAsRead(authUser.id, notification.id);
        } catch (fallbackError) {
          console.warn('Could not mark notification as read:', fallbackError);
        }
      }
      
      toast({
        title: "Request Rejected",
        description: "Follow request has been declined."
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'follow_request':
        return UserPlus;
      case 'follow':
        return Users;
      case 'message':
        return MessageSquare;
      case 'message_request':
        return MessageSquare;
      case 'post_like':
        return Heart;
      case 'post_comment':
        return MessageSquare;
      case 'post_tag':
        return UserCircle;
      default:
        return Bell;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const unreadNotificationsForMarquee = notifications.filter(n => !n.isRead).slice(0, 10);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-2 sm:p-4 md:p-6 relative z-10">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h1 className="font-headline text-2xl sm:text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <ShineBorder borderRadius={6} borderWidth={1} duration={7} color="hsl(var(--primary))">
              <Button onClick={handleMarkAllAsRead} variant="default" size="sm" className="w-full sm:w-auto text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
                <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Mark all as read ({unreadCount})
              </Button>
            </ShineBorder>
          )}
        </div>

        {unreadNotificationsForMarquee.length > 0 && (
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-card/50 dark:bg-card/40 backdrop-blur-sm py-2">
             <h2 className="text-xs sm:text-sm font-semibold text-primary mb-1 sm:mb-2 px-3 sm:px-4 self-start">Recent Unread</h2>
            <Marquee pauseOnHover className="[--duration:30s] [--gap:1rem]">
              {unreadNotificationsForMarquee.map(notification => (
                <NotificationMarqueeCard key={`marquee-${notification.id}`} notification={notification} />
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-card/50 via-card/20 to-transparent dark:from-card/40 dark:via-card/10"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-card/50 via-card/20 to-transparent dark:from-card/40 dark:via-card/10"></div>
          </div>
        )}

        <Card className="shadow-md bg-card/80 dark:bg-card/70 backdrop-blur-sm">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-lg sm:text-xl">All Notifications</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Stay updated with the latest activities.</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            {notifications.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-22rem)] sm:h-[calc(100vh-24rem)] md:h-[calc(100vh-26rem)]">
                <ul className="space-y-2 sm:space-y-3 pr-2 sm:pr-3">
                  {notifications.map(notification => (
                    <ShineBorder
                      key={notification.id}
                      borderRadius={8}
                      borderWidth={1}
                      duration={10}
                      color={notification.isRead ? "hsl(var(--border))" : "hsl(var(--primary))"}
                      className={cn(
                        "transition-all duration-200 ease-in-out",
                         notification.isRead
                          ? "bg-card hover:bg-muted/50"
                          : "bg-primary/10 shadow-sm hover:shadow-md",
                      )}
                    >
                      <li
                        className={cn(
                          "flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg",
                        )}
                      >
                        <div className="flex-shrink-0">
                          {notification.actor?.profileImage ? (
                            <Image
                              src={getProfileImageUrl(notification.actor, 40)}
                              alt={`${notification.actor.username}'s profile`}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              {React.createElement(getNotificationIcon(notification.category), { className: "h-5 w-5 text-muted-foreground" })}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <h3 className={cn("font-semibold text-xs sm:text-sm", notification.isRead ? "text-foreground" : "text-primary")}>
                              {notification.link ? (
                                <Link 
                                  href={notification.link} 
                                  className="hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  {notification.title}
                                </Link>
                              ) : (
                                notification.title
                              )}
                            </h3>
                            {!notification.isRead && (
                                <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs text-primary hover:underline ml-1 sm:ml-2 flex-shrink-0 font-medium focus:outline-none focus:ring-1 focus:ring-ring rounded"
                                    aria-label="Mark as read"
                                >
                                    Mark read
                                </button>
                            )}
                          </div>
                          <p className={cn("text-xs", notification.isRead ? "text-muted-foreground" : "text-foreground/80")}>{notification.message}</p>
                          <FormattedTimestamp timestamp={notification.timestamp} className="text-[0.65rem] sm:text-xs text-muted-foreground mt-1" />
                          {/* Friend request actions */}
                          {notification.category === 'follow_request' && !notification.isRead && (
                            <div className="flex gap-2 mt-2 transition-all">
                              <Button size="sm" variant="default" className="transition-all" onClick={() => handleAcceptRequest(notification)}>
                                Accept
                              </Button>
                              <Button size="sm" variant="destructive" className="transition-all" onClick={() => handleRejectRequest(notification)}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                        {!notification.isRead && (
                          <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-primary mt-1 sm:mt-1.5 flex-shrink-0" aria-label="Unread notification"></div>
                        )}
                      </li>
                    </ShineBorder>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center text-muted-foreground">
                <BellOff className="h-12 w-12 sm:h-16 sm:h-16 mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg font-medium">No notifications yet.</p>
                <p className="text-xs sm:text-sm">Check back later for updates.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
