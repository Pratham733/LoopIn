
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { mockUsers } from '@/lib/mockData';
import type { MockUser } from "@/types";
import { useMemo } from "react";
import { Share2, UserCircle } from "lucide-react";

interface ShareProfileModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentUser: MockUser;
  onShareProfile: (userToShare: MockUser) => void;
}

export function ShareProfileModal({
  isOpen,
  onOpenChange,
  currentUser,
  onShareProfile,
}: ShareProfileModalProps) {

  const followingList = useMemo(() => {
    return mockUsers.filter(u => currentUser.following.includes(u.id));
  }, [currentUser.following]);

  const handleShare = (user: MockUser) => {
    onShareProfile(user);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Share a Profile</DialogTitle>
          <DialogDescription>Select a user from your following list to share their profile in the chat.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow flex flex-col overflow-hidden py-2">
          {followingList.length > 0 ? (
            <ScrollArea className="flex-grow border rounded-md p-1 sm:p-2 bg-muted/30">
              <div className="space-y-2 sm:space-y-3">
                {followingList.map(user => (
                  <div key={user.id} className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md">
                    <UserCircle className="h-9 w-9 text-muted-foreground" />
                    <div className="flex-1 cursor-pointer text-sm">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-xs text-muted-foreground block">{user.fullName}</span>
                    </div>
                    <Button size="sm" onClick={() => handleShare(user)} className="px-3 text-xs">
                        <Share2 className="mr-1.5 h-3.5 w-3.5"/>
                        Share
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground py-8 flex-grow flex flex-col items-center justify-center">
              <p className="text-sm">You are not following anyone whose profile you can share.</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
