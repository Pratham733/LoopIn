
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGroupInfo } from '@/lib/mockData';
import type { Conversation } from "@/types";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface EditGroupInfoModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  conversation: Conversation | null;
  onGroupInfoUpdated: () => void; // Callback to refresh conversation data
}

export function EditGroupInfoModal({ isOpen, onOpenChange, conversation, onGroupInfoUpdated }: EditGroupInfoModalProps) {
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (conversation) {
      setGroupName(conversation.name || '');
    }
  }, [conversation]);

  const handleSaveChanges = async () => {
    if (!conversation || !groupName.trim()) {
      toast({ title: "Group name cannot be empty.", variant: "destructive" });
      return;
    }
    if (groupName.trim() === conversation.name) {
      onOpenChange(false); // No changes made
      return;
    }

    setIsSaving(true);
    const success = updateGroupInfo(conversation.id, groupName.trim());
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

    if (success) {
      toast({ title: "Group Info Updated", description: "The group name has been changed." });
      onGroupInfoUpdated();
      onOpenChange(false);
    } else {
      toast({ title: "Error", description: "Failed to update group info.", variant: "destructive" });
    }
    setIsSaving(false);
  };
  
  // Reset state when dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsSaving(false);
      setGroupName(conversation?.name || '');
    }
    onOpenChange(open);
  }

  if (!conversation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Group Info</DialogTitle>
          <DialogDescription>Change the name of your group chat.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="group-name-edit">Group Name</Label>
            <Input
              id="group-name-edit"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isSaving}
              className="mt-1"
            />
          </div>
          {/* Avatar editing could go here */}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
