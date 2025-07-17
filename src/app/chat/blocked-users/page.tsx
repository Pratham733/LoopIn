"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield, Loader2, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getBlockedUsers, unblockUser } from '@/services/blockService';
import { getUserProfile } from '@/services/userService';
import type { MockUser } from '@/types';

export default function BlockedUsersPage() {
  const router = useRouter();
  const { user: authUser, updateUser: updateAuthUser } = useAuth();
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<MockUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUnblock, setProcessingUnblock] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlockedUsers() {
      if (!authUser) return;
      
      setIsLoading(true);
      try {
        const blockedUserIds = await getBlockedUsers(authUser.id);
        
        if (blockedUserIds.length > 0) {
          // Fetch user details for each blocked user
          const userPromises = blockedUserIds.map(userId => getUserProfile(userId));
          const users = await Promise.all(userPromises);
          setBlockedUsers(users.filter(user => user !== null) as MockUser[]);
        } else {
          setBlockedUsers([]);
        }
      } catch (error) {
        console.error("Error fetching blocked users:", error);
        toast({
          title: "Error",
          description: "Failed to load blocked users. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlockedUsers();
  }, [authUser, toast]);

  const handleUnblockUser = async (userId: string, username: string) => {
    if (!authUser) return;
    
    setProcessingUnblock(userId);
    
    try {
      await unblockUser(authUser.id, userId);
      
      // Remove from local state
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      
      // Update auth user data
      const updatedAuthData = await getUserProfile(authUser.id);
      if (updatedAuthData) updateAuthUser(updatedAuthData);
      
      toast({
        title: "User Unblocked",
        description: `You have unblocked ${username}.`,
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        title: "Error",
        description: "Failed to unblock user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingUnblock(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading blocked users...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:py-6 sm:px-4 md:py-8 md:px-6">
      <header className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Blocked Users</h1>
          <p className="text-muted-foreground">Manage your blocked users</p>
        </div>
      </header>

      {blockedUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Blocked Users</h3>
            <p className="text-muted-foreground">
              You haven't blocked anyone yet. Blocked users cannot see your profile, posts, or contact you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Blocked Users ({blockedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {blockedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={user.profileImage || user.avatar} 
                      alt={`${user.username}'s profile picture`}
                    />
                    <AvatarFallback className="text-lg font-medium">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{user.username}</h3>
                    {user.fullName && (
                      <p className="text-sm text-muted-foreground">{user.fullName}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblockUser(user.id, user.username)}
                  disabled={processingUnblock === user.id}
                  className="min-w-[80px]"
                >
                  {processingUnblock === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Unblock
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
