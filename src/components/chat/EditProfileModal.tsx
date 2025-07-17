"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Eye, EyeOff, Loader2, Save, Upload, UserCircle, X } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import type { MockUser } from '@/types';
import { Switch } from '@/components/ui/switch';

interface EditProfileModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: MockUser;
  onProfileUpdated: (updated: Partial<MockUser>) => void;
}

export function EditProfileModal({ isOpen, onOpenChange, user, onProfileUpdated }: EditProfileModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(user.profileImage || user.avatar || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [username, setUsername] = useState(user.username);
  const [fullName, setFullName] = useState(user.fullName || "");
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState(user.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPrivate, setIsPrivate] = useState(user.isPrivate ?? false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      // Compress the image before setting
      try {
        const { compressImage } = await import('@/lib/mediaCompression');
        const compressedFile = await compressImage(file, {
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.8,
          maxSizeInMB: 1 // 1MB limit for profile images
        });
        setSelectedFile(compressedFile);
        const reader = new FileReader();
        reader.onload = (ev) => setProfileImage(ev.target?.result as string);
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        toast({ title: "Image compression failed", description: "Uploading original file.", variant: "destructive" });
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setProfileImage(ev.target?.result as string);
        reader.readAsDataURL(file);
      }
    } else {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!username.trim() || !email.trim()) {
      toast({ title: "Username and Email are required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    // Simulate upload and update
    await new Promise(res => setTimeout(res, 800));
    onProfileUpdated({
      profileImage: profileImage || undefined,
      username,
      fullName,
      email,
      bio,
      isPrivate,
      // Password would be handled separately in a real app
    });
    setIsSaving(false);
    onOpenChange(false);
    toast({ title: "Profile updated!", description: "Your changes have been saved." });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setProfileImage(user.profileImage || user.avatar || null);
      setSelectedFile(null);
      setUsername(user.username);
      setFullName(user.fullName || "");
      setEmail(user.email);
      setPassword("");
      setBio(user.bio || "");
      setIsSaving(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg animate-fade-in-up">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-primary" /> Edit Profile
          </DialogTitle>
          <DialogDescription>Update your profile details and make your presence shine!</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-full flex items-center gap-3 mb-2">
            <Switch id="private-account" checked={isPrivate} onCheckedChange={setIsPrivate} disabled={isSaving} />
            <Label htmlFor="private-account" className="font-medium">Private Account</Label>
          </div>
          <p className="text-xs text-muted-foreground mb-2 w-full text-left">
            {isPrivate
              ? 'Your posts are hidden. Only approved followers can see your posts and follow you.'
              : 'Your posts are public. Anyone can follow you and see your posts.'}
          </p>
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-2 ring-primary/40 shadow-lg">
              {profileImage ? (
                <AvatarImage src={profileImage} alt="Profile preview" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-3xl">
                  {username.slice(0,2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile picture"
            >
              <Upload className="h-7 w-7 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value)} disabled={isSaving} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} disabled={isSaving} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isSaving} className="mt-1" />
            </div>
            <div className="sm:col-span-2 relative">
              <Label htmlFor="password">Change Password</Label>
              <div className="flex items-center mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSaving}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} disabled={isSaving} className="mt-1 min-h-[60px]" maxLength={200} />
              <div className="text-xs text-muted-foreground text-right mt-1">{bio.length}/200</div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-row gap-2 justify-end">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
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