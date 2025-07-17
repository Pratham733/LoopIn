
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers, addMockGroupConversation } from '@/lib/mockData';
import type { MockUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Users, Loader2, ArrowLeft, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function NewGroupChatPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const followingList = useMemo(() => {
    if (!currentUser) return [];
    return mockUsers.filter(u => currentUser.following.includes(u.id) && u.id !== currentUser.id);
  }, [currentUser]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleCreateGroup = async () => {
    if (!currentUser || !groupName.trim() || selectedUserIds.size < 1) { 
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a group name and select at least one other participant."
      });
      return;
    }

    setIsCreating(true);
    try {
      const participantUsers = [
        currentUser, 
        ...Array.from(selectedUserIds).map(id => mockUsers.find(u => u.id === id)).filter(Boolean) as MockUser[]
      ];
      
      if (participantUsers.length < 2) { 
         toast({
            variant: "destructive",
            title: "Validation Error",
            description: "A group chat needs at least two participants (including yourself)."
         });
         setIsCreating(false);
         return;
      }

      const newConversation = addMockGroupConversation(groupName, participantUsers);
      
      toast({
        title: "Group Created!",
        description: `Group "${groupName}" has been successfully created.`,
      });
      router.push(`/chat/conversations/${newConversation.id}`);

    } catch (error) {
      console.error("Error creating group chat:", error);
      toast({
        variant: "destructive",
        title: "Failed to Create Group",
        description: "Something went wrong. Please try again.",
      });
      setIsCreating(false);
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4 md:p-6 h-full flex flex-col">
       <div className="mb-4 sm:mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-1 sm:mb-2 text-xs sm:text-sm">
            <Link href="/chat/conversations">
                <ArrowLeft className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back to Conversations
            </Link>
        </Button>
        <h1 className="font-headline text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
          <Users className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 md:h-8 md:w-8 text-primary" /> Create New Group Chat
        </h1>
      </div>
      
      <Card className="flex-grow flex flex-col shadow-xl bg-card/80 dark:bg-card/70 backdrop-blur-sm">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-lg sm:text-xl">Group Details</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Name your group and select participants from people you follow.</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4 sm:space-y-6 flex-grow flex flex-col overflow-hidden">
          <div>
            <Label htmlFor="groupName" className="text-sm sm:text-base">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="mt-1 text-sm sm:text-base"
              disabled={isCreating}
            />
          </div>

          <div className="flex-grow flex flex-col overflow-hidden">
            <Label className="text-sm sm:text-base">Select Participants (from your 'following' list)</Label>
            {followingList.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 sm:py-8">
                    <p className="text-sm sm:text-base">You are not following anyone yet.</p>
                    <p className="text-xs sm:text-sm">
                        <Link href="/chat/friends" className="text-primary hover:underline">Find people to follow</Link> to add them to groups.
                    </p>
                </div>
            ) : (
                <ScrollArea className="mt-1 flex-grow border rounded-md p-2 sm:p-3 bg-muted/20">
                    <div className="space-y-2 sm:space-y-3">
                    {followingList.map(user => (
                        <div key={user.id} className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md hover:bg-accent/20 transition-colors">
                        <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={() => handleUserSelect(user.id)}
                            disabled={isCreating}
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                        />
                        <UserCircle className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                        <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer text-sm sm:text-base">
                            <span className="font-medium">{user.username}</span>
                            {user.fullName && <span className="text-xs text-muted-foreground block">{user.fullName}</span>}
                        </Label>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-3 sm:p-4 md:p-6">
          <Button 
            onClick={handleCreateGroup} 
            disabled={isCreating || !groupName.trim() || selectedUserIds.size < 1 || followingList.length === 0}
            className="w-full text-sm sm:text-base"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Group...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" /> Create Group
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
