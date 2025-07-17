"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User, UserCheck, Users, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from "@/contexts/AuthContext";
import { UserListItem } from '@/components/chat/UserListItem';
import { useToast } from '@/hooks/use-toast';
import type { MockUser } from '@/types';
import { getAllUsers, getUserProfile } from "@/services/userService";
import { updateUserFollowStatus } from "@/services/followService";
import { addNotification } from "@/services/notificationService";
import { ActiveUserItem } from '@/components/chat/ActiveUserItemEnhanced';
import { PeopleSearch } from '@/components/chat/PeopleSearch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { NetworksSection } from '@/components/chat/NetworksSection';
import { sendFriendRequest } from "@/services/friendRequestService";

const CardComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`rounded-lg border bg-card text-card-foreground ${className}`} {...props} />
));
CardComponent.displayName = "Card";

const CardHeaderComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 p-3 sm:p-4 md:p-6 ${className}`} {...props} />
));
CardHeaderComponent.displayName = "CardHeader";

const CardTitleComponent = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`text-lg sm:text-xl font-semibold leading-none tracking-tight ${className}`} {...props} />
));
CardTitleComponent.displayName = "CardTitle";

const CardDescriptionComponent = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-xs sm:text-sm text-muted-foreground ${className}`} {...props} />
));
CardDescriptionComponent.displayName = "CardDescription";

const CardContentComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-3 sm:p-4 md:p-6 pt-0 ${className}`} {...props} />
));
CardContentComponent.displayName = "CardContent";


export default function FriendsPage() {
  const { user: currentUser, updateUser: updateContextUser, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("followers");
  const [allUsers, setAllUsers] = useState<MockUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);
  const [userLimit, setUserLimit] = useState(20); // Initial limit for display
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const users = await getAllUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Error loading users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchAllUsers();
  }, [toast]);

  const followers = useMemo(() => {
    if (!currentUser) return [];
    return allUsers.filter(u => u.followers?.includes(currentUser.id));
  }, [currentUser, allUsers]);

  const following = useMemo(() => {
    if (!currentUser) return [];
    return allUsers.filter(u => currentUser.following.includes(u.id));
  }, [currentUser, allUsers]);

  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);
  
  const findPeopleList = useMemo(() => {
    if (!currentUser) return [];
    
    // Default list - users not followed by current user
    const discoverableUsers = allUsers.filter(u => 
      u.id !== currentUser.id && 
      !currentUser.following.includes(u.id)
    );
    
    return discoverableUsers.slice(0, userLimit); // Limit display based on current limit
  }, [currentUser, allUsers, userLimit]);

  const handleUserSelected = (user: MockUser) => {
    setSelectedUser(user);
    
    // If the user isn't already in our local list, add them temporarily
    if (!allUsers.some(u => u.id === user.id)) {
      setAllUsers(prev => [...prev, user]);
    }
    
    // Switch to the Find People tab to show the selected user
    setActiveTab("find-people");
  };

  const loadMoreUsers = () => {
    setIsLoadingMoreUsers(true);
    setTimeout(() => {
      setUserLimit(prev => prev + 20);
      setIsLoadingMoreUsers(false);
    }, 500); // Small delay for better UX
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser) return;

    const isCurrentlyFollowing = currentUser.following.includes(targetUserId);
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
    const targetUser = allUsers.find(u => u.id === targetUserId);

    try {
      if (action === 'follow' && targetUser?.isPrivate) {
        // For private accounts, send a friend/follow request instead
        await sendFriendRequest(currentUser.id, targetUserId);
        toast({
          title: 'Request Sent',
          description: `A follow request was sent to ${targetUser.username}.`,
        });
        return;
      }

      await updateUserFollowStatus(currentUser.id, targetUserId, action);
      const updatedCurrentUserProfile = await getUserProfile(currentUser.id);
      if (updatedCurrentUserProfile) {
        updateContextUser(updatedCurrentUserProfile);
      }
      if(targetUser){
          toast({
              title: action === 'follow' ? "Followed" : "Unfollowed",
              description: `You ${action === 'follow' ? 'are now following' : 'unfollowed'} ${targetUser.username}.`
          });
          if(action === 'follow' && !targetUser.isPrivate){ 
              await addNotification(targetUserId, {
                  category: 'follow',
                  title: 'New Follower',
                  message: `${currentUser.username} started following you.`,
                  link: `/chat/profile/${currentUser.id}`
              });
          }
      }
    } catch (error: any) {
      let description = "Could not update follow status.";
      if (error?.message) description = error.message;
      toast({ title: "Error", description, variant: "destructive" });
      console.error("Failed to update follow status:", error);
    }
  };

  if (authLoading || isLoadingUsers || !currentUser) {
    return null;
  }

  return (
    <div className="flex flex-col h-full p-2 sm:p-4 md:p-6 relative z-10">
      <div className="space-y-4 sm:space-y-6">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold">People</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:max-w-xl lg:max-w-2xl text-xs sm:text-sm">
            <TabsTrigger value="followers" className="px-2 py-1.5 sm:px-3 sm:py-2.5">
              <UserCheck className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="px-2 py-1.5 sm:px-3 sm:py-2.5">
              <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Following ({following.length})
            </TabsTrigger>
            <TabsTrigger value="find-people" className="px-2 py-1.5 sm:px-3 sm:py-2.5">
              <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Find People
            </TabsTrigger>
            <TabsTrigger value="networks" className="px-2 py-1.5 sm:px-3 sm:py-2.5">
              <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Networks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4 sm:mt-6">
            <CardComponent className="shadow-sm transition-all duration-200 ease-in-out hover:shadow-lg bg-card/80 dark:bg-card/70 backdrop-blur-sm">
              <CardHeaderComponent>
                <CardTitleComponent>Your Followers</CardTitleComponent>
                <CardDescriptionComponent>Users who are following you.</CardDescriptionComponent>
              </CardHeaderComponent>
              <CardContentComponent className="space-y-2 sm:space-y-3">
                {followers.length > 0 ? (
                  followers.map(user => (
                    <UserListItem
                      key={user.id}
                      user={user}
                      currentUser={currentUser}
                      onFollowToggle={handleFollowToggle}
                      variant="follower"
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">No one is following you yet.</p>
                )}
              </CardContentComponent>
            </CardComponent>
          </TabsContent>

          <TabsContent value="following" className="mt-4 sm:mt-6">
            <CardComponent className="shadow-sm transition-all duration-200 ease-in-out hover:shadow-lg bg-card/80 dark:bg-card/70 backdrop-blur-sm">
              <CardHeaderComponent>
                <CardTitleComponent>You Are Following</CardTitleComponent>
                <CardDescriptionComponent>Users you are currently following.</CardDescriptionComponent>
              </CardHeaderComponent>
              <CardContentComponent>
                {following.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {following.map(user => (
                       <ActiveUserItem
                        key={user.id}
                        user={user}
                        type="following"
                        onFollowToggle={handleFollowToggle}
                        isCurrentUserFollowing={currentUser.following.includes(user.id)}
                        currentUser={currentUser}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">You are not following anyone yet.</p>
                )}
              </CardContentComponent>
            </CardComponent>
          </TabsContent>

          <TabsContent value="find-people" className="mt-4 sm:mt-6">
            <CardComponent className="shadow-sm transition-all duration-200 ease-in-out hover:shadow-lg bg-card/80 dark:bg-card/70 backdrop-blur-sm">
              <CardHeaderComponent>
                <CardTitleComponent>Find People</CardTitleComponent>
                <CardDescriptionComponent>Discover new people to connect with.</CardDescriptionComponent>
              </CardHeaderComponent>
              <CardContentComponent>
                <div className="mb-6">
                  <PeopleSearch 
                    onUserSelected={handleUserSelected}
                    placeholder="Find people by username..." 
                    autoFocus={true}
                  />
                  
                  <div className="mt-4 text-sm text-muted-foreground">
                    {selectedUser ? (
                      <div className="flex items-center justify-center p-2 bg-secondary/30 rounded-md">
                        <span>Showing profile for <strong>{selectedUser.username}</strong></span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedUser(null)}
                          className="ml-2 h-7 text-xs"
                        >
                          Clear
                        </Button>
                      </div>
                    ) : (
                      <p>Search for users or browse suggestions below</p>
                    )}
                  </div>
                </div>
                
                {/* Show selected user if there is one */}
                {selectedUser && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">User Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="md:col-span-2 lg:col-span-3">
                        <ActiveUserItem
                          key={selectedUser.id}
                          user={selectedUser}
                          type="suggestion"
                          onFollowToggle={handleFollowToggle}
                          isCurrentUserFollowing={currentUser.following.includes(selectedUser.id)}
                          currentUser={currentUser}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Show user suggestions if no specific user is selected */}
                {!selectedUser && (
                  <>
                    <h3 className="text-lg font-medium mb-3">Suggested People</h3>
                    {findPeopleList.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {findPeopleList.map(user => (                          <ActiveUserItem
                            key={user.id}
                            user={user}
                            type="suggestion"
                            onFollowToggle={handleFollowToggle}
                            isCurrentUserFollowing={currentUser.following.includes(user.id)}
                            currentUser={currentUser}
                          />
                          ))}
                        </div>
                        
                        {/* Load more button - show if there are more users to load */}
                        {findPeopleList.length < allUsers.filter(u => 
                          u.id !== currentUser.id && 
                          !currentUser.following.includes(u.id)
                        ).length && (
                          <div className="flex justify-center mt-6">
                            <Button 
                              onClick={loadMoreUsers} 
                              disabled={isLoadingMoreUsers}
                              variant="outline"
                              className="w-full max-w-xs"
                            >
                              {isLoadingMoreUsers ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                'Load More People'
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                        No suggested users to display.
                      </p>
                    )}
                  </>
                )}
              </CardContentComponent>
            </CardComponent>
          </TabsContent>

          <TabsContent value="networks" className="mt-4 sm:mt-6">
            <NetworksSection currentUser={currentUser} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
