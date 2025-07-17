
"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CurrentlyPlayingCard } from "./CurrentlyPlayingCard";

interface CurrentlyPlayingModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CurrentlyPlayingModal({ isOpen, onOpenChange }: CurrentlyPlayingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-transparent border-none shadow-none p-0 w-auto max-w-sm sm:max-w-sm [&>button]:hidden">
        <DialogTitle className="sr-only">Currently Playing on Spotify</DialogTitle>
        <CurrentlyPlayingCard />
      </DialogContent>
    </Dialog>
  );
}
