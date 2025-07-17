
"use client";

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { mockUsers } from '@/lib/mockData';
import type { MockUser } from "@/types";
import { DEFAULT_AVATAR } from '@/lib/constants';

interface UserTaggingModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentUser: MockUser;
  selectedUserIds: string[];
  onSelectedUserIdsChange: (ids: string[]) => void;
}

export function UserTaggingModal({
  isOpen,
  onOpenChange,
  currentUser,
  selectedUserIds,
  onSelectedUserIdsChange,
}: UserTaggingModalProps) {
  const [internalSelection, setInternalSelection] = useState(new Set(selectedUserIds));

  const followingList = useMemo(() => {
    return mockUsers.filter(u => currentUser.following.includes(u.id));
  }, [currentUser.following]);

  const handleUserSelect = (userId: string) => {
    setInternalSelection(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleDone = () => {
    onSelectedUserIdsChange(Array.from(internalSelection));
    onOpenChange(false);
  };
  
  const handleCancel = () => {
    // Reset internal state to what it was before opening
    setInternalSelection(new Set(selectedUserIds));
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tag People</DialogTitle>
          <DialogDescription>Select people from your following list to tag in your post.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow flex flex-col overflow-hidden py-2">
          {followingList.length > 0 ? (
            <ScrollArea className="flex-grow border rounded-md p-1 sm:p-2 bg-muted/30">
              <div className="space-y-2 sm:space-y-3">
                {followingList.map(user => (
                  <div key={user.id} className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md hover:bg-accent/20 transition-colors">
                    <Checkbox
                      id={`tag-user-${user.id}`}
                      checked={internalSelection.has(user.id)}
                      onCheckedChange={() => handleUserSelect(user.id)}
                      className="h-4 w-4"
                    />
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src={user.avatar || DEFAULT_AVATAR} alt={user.username} data-ai-hint="person avatar"/>
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Label htmlFor={`tag-user-${user.id}`} className="flex-1 cursor-pointer text-sm">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-xs text-muted-foreground block">{user.fullName}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground py-8 flex-grow flex flex-col items-center justify-center">
              <p className="text-sm">You are not following anyone yet.</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleDone}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
