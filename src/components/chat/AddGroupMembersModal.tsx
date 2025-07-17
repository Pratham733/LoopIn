
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { mockUsers, addMembersToGroup } from '@/lib/mockData';
import type { MockUser, Conversation } from "@/types";
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, UserCircle } from 'lucide-react';
import { getUsersByFollowing } from '@/services/userService';

interface AddGroupMembersModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  conversation: Conversation;
  currentUser: MockUser;
  onMembersAdded: () => void;
}

export function AddGroupMembersModal({ isOpen, onOpenChange, conversation, currentUser, onMembersAdded }: AddGroupMembersModalProps) {
  const { toast } = useToast();
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<MockUser[]>([]);

  useEffect(() => {
    async function fetchFollowing() {
      if (currentUser.following && currentUser.following.length > 0) {
        const users = await getUsersByFollowing(currentUser.following);
        setFollowingUsers(users);
      } else {
        setFollowingUsers([]);
      }
    }
    if (isOpen) fetchFollowing();
  }, [isOpen, currentUser.following]);

  const eligibleUsers = useMemo(() => {
    const currentMemberIds = new Set(conversation.participants.map(p => p.id));
    return followingUsers.filter(
      u => !currentMemberIds.has(u.id)
    );
  }, [followingUsers, conversation.participants]);

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

  const handleAddMembers = async () => {
    if (selectedUserIds.size === 0) {
      toast({ title: "No users selected", description: "Please select at least one user to add.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const success = addMembersToGroup(conversation.id, Array.from(selectedUserIds));
    await new Promise(resolve => setTimeout(resolve, 500));

    if (success) {
      toast({ title: "Members Added", description: "New members have been added to the group." });
      onMembersAdded();
      onOpenChange(false);
      setSelectedUserIds(new Set());
    } else {
      toast({ title: "Error", description: "Failed to add members.", variant: "destructive" });
    }
    setIsSaving(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedUserIds(new Set());
      setIsSaving(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Members to "{conversation.name}"</DialogTitle>
          <DialogDescription>Select users from your 'following' list to add to the group.</DialogDescription>
        </DialogHeader>

        <div className="flex-grow flex flex-col overflow-hidden py-2">
          {eligibleUsers.length > 0 ? (
            <ScrollArea className="flex-grow border rounded-md p-1 sm:p-2 bg-muted/30">
              <div className="space-y-2 sm:space-y-3">
                {eligibleUsers.map(user => (
                  <div key={user.id} className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md hover:bg-accent/20 transition-colors">
                    <Checkbox
                      id={`add-user-${user.id}`}
                      checked={selectedUserIds.has(user.id)}
                      onCheckedChange={() => handleUserSelect(user.id)}
                      disabled={isSaving}
                      className="h-4 w-4"
                    />
                    <UserCircle className="h-9 w-9 text-muted-foreground" />
                    <Label htmlFor={`add-user-${user.id}`} className="flex-1 cursor-pointer text-sm">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-xs text-muted-foreground block">{user.fullName}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground py-8 flex-grow flex flex-col items-center justify-center">
              <p className="text-sm">No one left to add from your 'following' list.</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleAddMembers} disabled={isSaving || selectedUserIds.size === 0}>
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
            ) : (
              <><UserPlus className="mr-2 h-4 w-4" /> Add Members ({selectedUserIds.size})</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
