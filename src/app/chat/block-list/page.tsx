"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, UserCheck, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getBlockedUsers, unblockUser } from '@/services/blockService';
import { getUserProfile } from '@/services/userService';
import type { MockUser } from '@/types';

export default function BlockListPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
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
        
        // Fetch user details for each blocked user
        const userPromises = blockedUserIds.map(id => getUserProfile(id));
        const userResults = await Promise.all(userPromises);
        
        // Filter out null results
        const validUsers = userResults.filter(user => user !== null) as MockUser[];
        setBlockedUsers(validUsers);
      } catch (error) {
        console.error("Error fetching blocked users:", error);
        toast({ 
          title: "Error", 
          description: "Failed to load blocked users.", 
          variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlockedUsers();
  }, [authUser, toast]);

  const handleUnblock = async (userId: string) => {
    if (!authUser) return;
    
    setProcessingUnblock(userId);
    
    try {
      await unblockUser(authUser.id, userId);
      
      // Remove from local state
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "User Unblocked",
        description: "The user has been unblocked successfully.",
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
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading blocked users...</p>
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
        <h1 className="text-2xl font-bold">Block List</h1>
      </div>

      {blockedUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Blocked Users</h3>
            <p className="text-muted-foreground">
              You haven't blocked anyone yet. Blocked users won't be able to see your profile or contact you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {blockedUsers.length} blocked user{blockedUsers.length !== 1 ? 's' : ''}
          </p>
          
          {blockedUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={user.profileImage || user.avatar} 
                      alt={user.username}
                    />
                    <AvatarFallback>
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{user.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.fullName || user.username}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleUnblock(user.id)}
                  variant="outline"
                  size="sm"
                  disabled={processingUnblock === user.id}
                >
                  {processingUnblock === user.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Unblocking...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Unblock
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
