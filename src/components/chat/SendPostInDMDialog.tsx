
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MockUser, Post } from "@/types";
import { useToast } from '@/hooks/use-toast';
import { getUsersByFollowing } from '@/services/userService';
import { addNotification } from '@/services/notificationService';
import { sendMessage, findOrCreateDirectConversation } from '@/services/conversationService';
import { Loader2, Send, UserCircle } from 'lucide-react';

interface SendPostInDMDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  postToShare: Post;
  currentUser: MockUser;
}

export function SendPostInDMDialog({ isOpen, onOpenChange, postToShare, currentUser }: SendPostInDMDialogProps) {
  const { toast } = useToast();
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Use postToShare instead of looking up mock data
  const postOwner = {
    id: postToShare.userId,
    username: postToShare.username || '',
  };

  // State to hold fetched users
  const [followedUsers, setFollowedUsers] = useState<MockUser[]>([]);

  // Fetch eligible users to DM when the dialog opens
  useEffect(() => {
    if (isOpen && currentUser?.following?.length > 0) {
      const fetchUsers = async () => {
        try {
          const users = await getUsersByFollowing(currentUser.following);
          setFollowedUsers(users.filter(user => user.id !== currentUser.id));
        } catch (error) {
          console.error("Error fetching followed users:", error);
          toast({ 
            title: "Error", 
            description: "Could not load your connections. Please try again later.", 
            variant: "destructive" 
          });
        }
      };
      
      fetchUsers();
    }
  }, [isOpen, currentUser]);

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

  const handleSend = async () => {
    if (selectedUserIds.size === 0) {
      toast({ title: "No Users Selected", description: "Please select at least one user to send the post to.", variant: "destructive" });
      return;
    }

    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 700));

    let successfulSends = 0;
    for (const recipientId of selectedUserIds) {
      // Find recipient in the followedUsers array we previously fetched
      const recipient = followedUsers.find(user => user.id === recipientId);
      if (!recipient) continue;
      
      // Add notification for post share
      try {
        await addNotification(recipientId, {
          category: 'message',
          title: 'Post Shared with You',
          message: `${currentUser.username} shared a post with you.${message ? ` Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"` : ''}`,
          actor: currentUser,
          link: `/chat/conversations`,
          icon: undefined
        });
      } catch (notificationError) {
        console.error('Error adding share notification:', notificationError);
        // Continue with the send operation even if notification fails
      }

      // Send a chat message with the shared post
      try {
        // Find or create a direct conversation
        let conversationId = await findOrCreateDirectConversation(currentUser.id, recipientId);
        if (!conversationId) {
          // fallback: create conversation if not found
          conversationId = await createConversation([currentUser.id, recipientId], false);
        }
        // Send the post_share message
        await sendMessage(
          conversationId,
          currentUser.id,
          {
            type: 'post_share',
            postId: postToShare.id,
            postUserId: postToShare.userId,
            postUsername: postToShare.username,
            postContent: postToShare.content,
            postMedia: postToShare.media,
            message: message || '',
          },
          'post_share'
        );
      } catch (chatError) {
        console.error('Error sending shared post in chat:', chatError);
        toast({ title: "Chat Error", description: `Could not send post to ${recipient.username} in chat.`, variant: "destructive" });
      }
      
      toast({ title: "Post Sent", description: `Post shared with ${recipient.username}. ${message ? `Message: \"${message.substring(0,20)}...\"` : ''}` });
      successfulSends++;
    }
    
    setIsSending(false);
    if (successfulSends > 0) {
        onOpenChange(false);
        setSelectedUserIds(new Set());
        setMessage('');
    }
  };

  if (!postOwner) {
    if (isOpen) onOpenChange(false);
    return null;
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Send Post in Direct Message</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Share this post by <span className="font-semibold">{postOwner.username}</span> with people you follow.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow flex flex-col overflow-hidden py-2">
            <Label htmlFor="dm-message" className="mb-1.5 text-sm">Optional Message:</Label>
            <Textarea
                id="dm-message"
                placeholder="Add a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="mb-3 text-sm"
                disabled={isSending}
            />

            <Label className="mb-1.5 text-sm">Select Recipients (Following):</Label>
            {followedUsers.length > 0 ? (
                <ScrollArea className="flex-grow border rounded-md p-1 sm:p-2 bg-muted/30">
                    <div className="space-y-2 sm:space-y-3">
                    {followedUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md hover:bg-accent/20 transition-colors">
                        <Checkbox
                            id={`dm-user-${user.id}`}
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={() => handleUserSelect(user.id)}
                            disabled={isSending}
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                        />
                        <UserCircle className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground" />
                        <Label htmlFor={`dm-user-${user.id}`} className="flex-1 cursor-pointer text-sm sm:text-base">
                            <span className="font-medium">{user.username}</span>
                            {user.fullName && <span className="text-xs text-muted-foreground block">{user.fullName}</span>}
                        </Label>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            ) : (
                <div className="text-center text-muted-foreground py-6 sm:py-8 flex-grow flex flex-col items-center justify-center">
                    {currentUser.following.length === 0 ? (
                        <p className="text-sm">You are not following anyone to send this post to.</p>
                    ) : (
                        <p className="text-sm">Loading your connections...</p>
                    )}
                </div>
            )}
        </div>

        <DialogFooter className="pt-3">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSending}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSend} disabled={isSending || selectedUserIds.size === 0}>
            {isSending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
            ) : (
                <><Send className="mr-2 h-4 w-4" /> Send ({selectedUserIds.size})</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
