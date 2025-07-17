"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getNotificationsForUser, 
  markAllNotificationsAsRead, 
  markNotificationAsRead,
  markNotificationsAsReadByCategoryAndActor,
  subscribeToNotifications 
} from '@/services/notificationService';
import { acceptFriendRequest, rejectFriendRequest } from '@/services/friendRequestService';
import { getPendingFriendRequests } from '@/services/friendRequestService';
import type { NotificationType } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  X, 
  UserPlus, 
  Check, 
  X as XIcon, 
  UserCircle,
  MessageSquare,
  Heart,
  Users,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { FormattedTimestamp } from './FormattedTimestamp';
import { getProfileImageUrl } from '@/lib/firebase/storageUtils';
import Image from 'next/image';
import React from 'react';

interface NotificationBannerProps {
  className?: string;
}

export function NotificationBanner({ className }: NotificationBannerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Real-time notifications subscription
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(
      user.id,
      (notificationsData) => {
        setNotifications(notificationsData);
        const unreadNotifications = notificationsData.filter(n => !n.isRead);
        setUnreadCount(unreadNotifications.length + pendingRequests.length);
      },
      (error) => {
        console.error('Error in notifications subscription:', error);
      }
    );

    return unsubscribe;
  }, [user, pendingRequests.length]);

  // Fetch pending requests
  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      try {
        const requestsData = await getPendingFriendRequests(user.id);
        setPendingRequests(requestsData);
        setUnreadCount(notifications.filter(n => !n.isRead).length + requestsData.length);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    fetchRequests();
    
    // Refresh requests every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [user, notifications]);

  const handleAcceptRequest = async (notification: NotificationType) => {
    if (!notification.actor || !user) return;
    
    setIsLoading(true);
    try {
      await acceptFriendRequest(notification.actor.id, user.id);
      
      // Mark notification as read using the new function
      try {
        await markNotificationsAsReadByCategoryAndActor(user.id, 'follow_request', notification.actor.id);
      } catch (notificationError) {
        // Fallback to individual notification marking
        try {
          await markNotificationAsRead(user.id, notification.id);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (notification: NotificationType) => {
    if (!notification.actor || !user) return;
    
    setIsLoading(true);
    try {
      await rejectFriendRequest(notification.actor.id, user.id);
      
      // Mark notification as read using the new function
      try {
        await markNotificationsAsReadByCategoryAndActor(user.id, 'follow_request', notification.actor.id);
      } catch (notificationError) {
        // Fallback to individual notification marking
        try {
          await markNotificationAsRead(user.id, notification.id);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.id);
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

  const handleNotificationClick = async (notification: NotificationType) => {
    if (!user || notification.isRead) return;
    
    try {
      await markNotificationAsRead(user.id, notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
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

  const getNotificationColor = (category: string) => {
    switch (category) {
      case 'follow_request':
        return 'bg-blue-500/10 text-blue-500';
      case 'follow':
        return 'bg-green-500/10 text-green-500';
      case 'message':
      case 'message_request':
        return 'bg-purple-500/10 text-purple-500';
      case 'post_like':
        return 'bg-red-500/10 text-red-500';
      case 'post_comment':
        return 'bg-orange-500/10 text-orange-500';
      case 'post_tag':
        return 'bg-indigo-500/10 text-indigo-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (!user) return null;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Notification Bell with Badge */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50">
          <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-7 px-2"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="max-h-96">
                <div className="p-2">
                  {notifications.length === 0 && pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mb-2" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Follow Requests */}
                      {pendingRequests.map((request) => {
                        const notification = notifications.find(n => 
                          n.category === 'follow_request' && 
                          n.actor?.id === request.fromUserId
                        );
                        
                        if (!notification) return null;
                        
                        return (
                          <div
                            key={request.id}
                            className={cn(
                              "p-3 rounded-lg border transition-colors",
                              !notification.isRead 
                                ? "bg-primary/5 border-primary/20" 
                                : "bg-muted/30 border-border"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {notification.actor?.profileImage ? (
                                  <Image
                                    src={getProfileImageUrl(notification.actor, 32)}
                                    alt={`${notification.actor.username}'s profile`}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <UserCircle className="w-8 h-8 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <Link
                                      href={`/chat/profile/${notification.actor?.id}`}
                                      className="font-medium text-sm hover:underline truncate block"
                                      onClick={() => setIsOpen(false)}
                                    >
                                      {notification.actor?.username}
                                    </Link>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {notification.message}
                                    </p>
                                    <FormattedTimestamp 
                                      timestamp={notification.timestamp} 
                                      className="text-xs text-muted-foreground mt-1" 
                                    />
                                  </div>
                                  
                                  {!notification.isRead && (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleAcceptRequest(notification)}
                                        disabled={isLoading}
                                        className="h-7 px-2 text-xs"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRejectRequest(notification)}
                                        disabled={isLoading}
                                        className="h-7 px-2 text-xs"
                                      >
                                        <XIcon className="h-3 w-3 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Other Notifications */}
                      {notifications
                        .filter(n => n.category !== 'follow_request' || !pendingRequests.find(r => r.fromUserId === n.actor?.id))
                        .map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "p-3 rounded-lg border transition-colors cursor-pointer",
                              !notification.isRead 
                                ? "bg-primary/5 border-primary/20" 
                                : "bg-muted/30 border-border"
                            )}
                            onClick={() => {
                              handleNotificationClick(notification);
                              if (notification.link) {
                                setIsOpen(false);
                              }
                            }}
                          >
                            <Link
                              href={notification.link || '#'}
                              className="block"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  {notification.actor?.profileImage ? (
                                    <Image
                                      src={getProfileImageUrl(notification.actor, 32)}
                                      alt={`${notification.actor.username}'s profile`}
                                      width={32}
                                      height={32}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getNotificationColor(notification.category))}>
                                      {React.createElement(getNotificationIcon(notification.category), { className: "w-4 h-4" })}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {notification.message}
                                    </p>
                                    <FormattedTimestamp 
                                      timestamp={notification.timestamp} 
                                      className="text-xs text-muted-foreground mt-1" 
                                    />
                                  </div>
                                  
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                  )}
                                </div>
                              </div>
                            </Link>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-3 border-t bg-muted/20">
                <Link
                  href="/chat/notifications"
                  className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 