"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Textarea as ProfileTextarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, UserCircle, Loader2, KeyRound, Lock, Unlock, ArrowLeft, Camera, X, Upload, ImageIcon, Sparkles, Shield, User, Mail, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AnimatedCircularProgressBar } from '@/components/magicui/animated-circular-progress-bar';
import { isUsernameTaken, updateProfilePicture } from '@/services/userService';
import ShineBorder from '@/components/magicui/shine-border';
import { Switch } from '@/components/ui/switch';
import type { MockUser } from '@/types';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DEFAULT_AVATAR } from '@/lib/constants';
import UserAvatar from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import Particles from '@/components/magicui/particles';
import { useCustomTheme } from '@/contexts/CustomThemeContext';

export default function ProfilePage() {
  const { user: authUser, updateUser: updateAuthUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { currentTheme } = useCustomTheme();

  // Generate dark, visible particle colors from the palette
  const palette = currentTheme?.palette || {};
  function darken(hex: string | undefined, amount = 0.5): string {
    if (!hex || typeof hex !== 'string') return '#222';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let num = parseInt(c, 16);
    if (isNaN(num)) return '#222';
    let r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
    let g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
    let b = Math.max(0, (num & 0xff) * (1 - amount));
    return `rgb(${r},${g},${b})`;
  }
  const particleColors: string[] = [
    darken(palette.primary, 0.6),
    darken(palette.accent, 0.6),
    darken(palette.background, 0.8),
    '#222', '#333', '#444'
  ];

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [profilePicDataUrl, setProfilePicDataUrl] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authUser) {
      setUsername(authUser.username);
      setFullName(authUser.fullName || '');
      setEmail(authUser.email);
      setBio(authUser.bio || '');
      setIsPrivateAccount(authUser.isPrivate || false);
      setProfilePicDataUrl(authUser.profileImage || authUser.avatar || null);

      let completenessScore = 0;
      const maxScore = 5;
      if (authUser.username) completenessScore += 1;
      if (authUser.fullName && authUser.fullName.trim() !== '') completenessScore +=1;
      if (authUser.email) completenessScore += 1;
      if (authUser.bio && authUser.bio.trim() !== '') completenessScore +=1;
      if (authUser.profileImage || authUser.avatar) completenessScore +=1;
      setProfileCompleteness(Math.round((completenessScore / maxScore) * 100));
    }
  }, [authUser]);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please select an image file (PNG, JPG, GIF, etc.)"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please select an image smaller than 5MB"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setProfilePicDataUrl(dataUrl);
      toast({
        title: "Photo Selected",
        description: "Your new profile picture will be saved when you update your profile."
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const mockEvent = { target: { files: [file] } } as any;
        handleProfilePicChange(mockEvent);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please drop an image file"
        });
      }
    }
  };

  const handleProfilePicClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveProfilePic = () => {
    setProfilePicDataUrl(null);
    toast({
      title: "Photo Removed",
      description: "Profile picture will be removed when you save changes."
    });
  };

  const uploadProfilePic = async (): Promise<string | null> => {
    if (!profilePicDataUrl || !authUser) return null;
    
    try {
      setIsUploadingPicture(true);
      
      // Import validate function for quick check before sending
      const { validateImageSize } = await import('@/lib/imageUtils');
      const sizeCheck = validateImageSize(profilePicDataUrl);
      
      if (!sizeCheck.valid) {
        toast({
          variant: "destructive",
          title: "Image Too Large",
          description: sizeCheck.message || `Image size (${sizeCheck.size.toFixed(1)} KB) exceeds the maximum allowed.`
        });
        return null;
      }
      
      console.log("Uploading profile picture for user:", authUser.id);
      const downloadURL = await updateProfilePicture(authUser.id, profilePicDataUrl);
      console.log("Profile picture uploaded successfully, URL:", downloadURL);
      
      // Note: We will NOT update AuthContext here - this will be done in handleSave
      // to avoid double updates, which can cause infinite render loops
      
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been uploaded successfully."
      });
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      
      const errorMessage = error instanceof Error
        ? error.message
        : "Could not upload profile picture. Please try again.";
      
      toast({ 
        variant: "destructive", 
        title: "Upload Failed", 
        description: errorMessage
      });
      return null;
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const validateUsername = (uname: string): { isValid: boolean, message?: string } => {
    if (uname.length < 3) return { isValid: false, message: "Username must be at least 3 characters." };
    if (uname.length > 20) return { isValid: false, message: "Username must be no more than 20 characters." };
    if (uname !== uname.toLowerCase()) return { isValid: false, message: "Username must be all lowercase." };
    if (uname.includes(' ')) return { isValid: false, message: "Username cannot contain spaces." };
    if (!/^[a-z0-9_.]+$/.test(uname)) return { isValid: false, message: "Username can only contain lowercase letters, numbers, '.', and '_'." };
    return { isValid: true };
  };

  const handleSave = async () => {
    if (!authUser) return;

    const usernameValidationResult = validateUsername(username);
    if (!usernameValidationResult.isValid) {
      toast({ variant: "destructive", title: "Invalid Username", description: usernameValidationResult.message });
      return;
    }

    setIsSaving(true);

    if (username !== authUser.username) {
      const isTaken = await isUsernameTaken(username);
      if (isTaken) {
        toast({ variant: "destructive", title: "Username Taken", description: "This username is already in use. Please choose another." });
        setIsSaving(false);
        return;
      }
    }

    // Handle profile picture upload if changed
    let profileImageUrl: string | null = null;
    if (profilePicDataUrl && profilePicDataUrl !== authUser.profileImage && profilePicDataUrl !== authUser.avatar) {
      console.log("Profile picture changed, uploading...");
      profileImageUrl = await uploadProfilePic();
      console.log("Profile picture upload result:", profileImageUrl);
    }

    let passwordChangeSuccessful = false;
    if (currentPassword && newPassword && confirmPassword) {
      // Validate password fields
      if (newPassword !== confirmPassword) {
        toast({ 
          variant: "destructive", 
          title: "Password Mismatch", 
          description: "New password and confirmation password do not match." 
        });
        setIsSaving(false);
        return;
      }
      
      if (newPassword.length < 6) {
        toast({ 
          variant: "destructive", 
          title: "Password Too Short", 
          description: "Password must be at least 6 characters long." 
        });
        setIsSaving(false);
        return;
      }

      try {
        // Import Firebase Auth functions
        const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase/client');
        
        const user = auth.currentUser;
        if (!user || !user.email) {
          throw new Error('No authenticated user found');
        }

        // Re-authenticate user with current password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Update password
        await updatePassword(user, newPassword);
        
        passwordChangeSuccessful = true;
        toast({ 
          title: "Password Updated", 
          description: "Your password has been successfully changed." 
        });
      } catch (error: any) {
        console.error('Password change error:', error);
        let errorMessage = "Failed to change password. Please try again.";
        
        if (error.code === 'auth/wrong-password') {
          errorMessage = "Current password is incorrect.";
        } else if (error.code === 'auth/weak-password') {
          errorMessage = "New password is too weak. Please choose a stronger password.";
        } else if (error.code === 'auth/requires-recent-login') {
          errorMessage = "Please log out and log back in before changing your password.";
        }
        
        toast({ 
          variant: "destructive", 
          title: "Password Change Failed", 
          description: errorMessage 
        });
        setIsSaving(false);
        return;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedUserData: Partial<MockUser> = {
        username,
        fullName,
        email,
        bio,
        isPrivate: isPrivateAccount,
    };

    if (profileImageUrl) {
        console.log("Setting profileImage in user data:", profileImageUrl);
        updatedUserData.profileImage = profileImageUrl;
        updatedUserData.avatar = profileImageUrl;
    } else if (profilePicDataUrl === null) {
        console.log("Clearing profile image");
        updatedUserData.profileImage = '';
        updatedUserData.avatar = '';
    } else if (profilePicDataUrl && profilePicDataUrl !== authUser.profileImage) {
        console.log("Using profile image from data URL");
        updatedUserData.profileImage = profilePicDataUrl;
        updatedUserData.avatar = profilePicDataUrl || '';
    }
    
    await updateAuthUser(updatedUserData); 

    setIsSaving(false);
    toast({ 
      title: "Profile Updated Successfully!",
      description: "Your changes have been saved."
    });
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    
    // Instead of navigating which causes CORS issues, just refresh the component state
    // Add a small delay to ensure all updates are processed
    setTimeout(() => {
      // Force a re-render by updating the profile picture data URL if it was uploaded
      if (profileImageUrl) {
        setProfilePicDataUrl(profileImageUrl);
      }
    }, 1000);
  };

  if (authLoading) {
     return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
          <div className="absolute inset-0 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/20 animate-ping" />
        </div>
        <p className="mt-4 text-muted-foreground animate-pulse">Loading Profile Editor...</p>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4 space-y-6">
        <div className="relative">
          <UserCircle className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground" />
          <div className="absolute -top-1 -right-1 h-6 w-6 bg-destructive rounded-full flex items-center justify-center">
            <X className="h-3 w-3 text-destructive-foreground" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground max-w-sm">
            You need to be logged in to view and edit your profile.
          </p>
        </div>
        <ShineBorder borderRadius={8} borderWidth={1} duration={3}>
          <Button asChild size="lg">
            <a href="/">Go to Login</a>
          </Button>
        </ShineBorder>
      </div>
    );
  }

  return (
    <div className="relative">   

      {/* Particle Background */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleCount={40}
          particleSpread={10}
          speed={0.04}
          particleColors={particleColors}
          moveParticlesOnHover={true}
          particleHoverFactor={2}
          alphaParticles={true}
          particleBaseSize={90}
          sizeRandomness={0.5}
          cameraDistance={18}
          disableRotation={false}
          className="w-full h-full"
        />
      </div>
      <div className="relative z-10">
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:py-6 sm:px-4 md:py-8 md:px-6">
          <div className="space-y-6 sm:space-y-8">
            {/* Header Section */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4">
              <div>
                <h1 className="font-headline text-2xl sm:text-3xl font-bold flex items-center mb-2">
                  <div className="relative mr-3">
                    <UserCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-primary animate-pulse" />
                  </div>
                  Edit Your Profile
                </h1>
                <p className="text-muted-foreground text-sm">
                  Customize your profile to make it uniquely yours
                </p>
              </div>
              <ShineBorder borderRadius={8} borderWidth={1} duration={5} color={"hsl(var(--secondary))"} className="w-full xs:w-auto">
                <Button onClick={() => router.push(`/chat/profile/${authUser.id}`)} variant={"secondary"} className="w-full xs:w-auto text-xs sm:text-sm">
                  <ArrowLeft className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> View Profile
                </Button>
              </ShineBorder>
            </div>
            
            {/* Profile Completeness */}
            <div className="flex justify-center">
              <div className="text-center space-y-2">
                <AnimatedCircularProgressBar 
                  value={profileCompleteness} 
                  label="Profile Completeness" 
                  circleWidth={120} 
                  strokeWidth={10} 
                  gaugePrimaryColor="stroke-primary" 
                  gaugeSecondaryColor="stroke-muted" 
                />
                <Badge variant={profileCompleteness >= 80 ? "default" : "secondary"} className="text-xs">
                  {profileCompleteness >= 80 ? "Great Profile!" : "Keep Building"}
                </Badge>
              </div>
            </div>

            {/* Profile Picture Section */}
            <Card className="shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl bg-gradient-to-r from-card via-card to-card/90 border-2 border-muted">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl flex items-center">
                  <ImageIcon className="mr-2 h-5 w-5 text-primary" />
                  Profile Picture
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Upload a photo to help others recognize you
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Profile Picture Display */}
                    <div className="relative">
                      <UserAvatar 
                        user={profilePicDataUrl ? { profileImage: profilePicDataUrl } : authUser} 
                        size="xl" 
                      className="ring-4 ring-primary/20 ring-offset-4 ring-offset-background transition-all duration-300"
                      />
                      {isUploadingPicture && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                  </div>

                  {/* Upload Area */}
                  <div className="flex-1 w-full">
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer ${
                        isDragOver 
                          ? 'border-primary bg-primary/5 scale-105' 
                          : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={handleProfilePicClick}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <div className="relative">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            {isDragOver && (
                              <div className="absolute inset-0 h-8 w-8 bg-primary/20 rounded-full animate-ping" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {isDragOver ? "Drop your image here" : "Click to upload or drag and drop"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleProfilePicClick} 
                        disabled={isSaving || isUploadingPicture}
                        className="flex-1 sm:flex-none"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        {profilePicDataUrl ? "Change Photo" : "Upload Photo"}
                      </Button>
                      {profilePicDataUrl && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleRemoveProfilePic} 
                          disabled={isSaving || isUploadingPicture}
                          className="flex-1 sm:flex-none"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                      className="hidden"
                    />

                    {profilePicDataUrl && profilePicDataUrl !== authUser?.profileImage && profilePicDataUrl !== authUser?.avatar && (
                      <div className="mt-3 p-2 bg-primary/10 rounded-md">
                        <p className="text-xs text-primary">
                          ✨ New photo selected! Save your profile to apply changes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl bg-gradient-to-r from-card via-card to-card/90 border-2 border-muted">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Update your profile details below. Usernames must be lowercase, without spaces, and can only contain letters, numbers, '.', or '_'.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm sm:text-base flex items-center">
                      <span className="mr-2">@</span> Username
                    </Label>
                    <Input 
                      id="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      disabled={isSaving} 
                      className="mt-1 text-sm sm:text-base" 
                      placeholder="your_username"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lowercase, no spaces, only letters, numbers, '.', '_'. Min 3, max 20 chars.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm sm:text-base flex items-center">
                      <User className="mr-2 h-4 w-4" /> Full Name
                    </Label>
                    <Input 
                      id="fullName" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      disabled={isSaving} 
                      className="mt-1 text-sm sm:text-base" 
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base flex items-center">
                    <Mail className="mr-2 h-4 w-4" /> Email Address
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    disabled={isSaving} 
                    className="mt-1 text-sm sm:text-base" 
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm sm:text-base flex items-center">
                    <FileText className="mr-2 h-4 w-4" /> Bio
                  </Label>
                  <ProfileTextarea 
                    id="bio" 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    disabled={isSaving} 
                    className="mt-1 text-sm sm:text-base min-h-[100px] sm:min-h-[120px]" 
                    placeholder="Tell us a little about yourself... What makes you unique?"
                  />
                  <p className="text-xs text-muted-foreground">
                    {bio.length}/500 characters
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-primary" />
                    Privacy Settings
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {isPrivateAccount ? <Lock className="h-5 w-5 text-primary"/> : <Unlock className="h-5 w-5 text-muted-foreground"/>}
                      <div>
                        <Label htmlFor="private-account-toggle" className="text-sm sm:text-base font-medium">
                          {isPrivateAccount ? "Private Account" : "Public Account"}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {isPrivateAccount ? "Only followers can see your posts and profile" : "Anyone can see your posts and profile"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="private-account-toggle"
                      checked={isPrivateAccount}
                      onCheckedChange={setIsPrivateAccount}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Password Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-medium flex items-center">
                      <KeyRound className="mr-2 h-5 w-5 text-primary" />
                      Security
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowPasswordFields(!showPasswordFields)}
                      className="text-xs sm:text-sm"
                    >
                      {showPasswordFields ? "Hide" : "Change Password"}
                    </Button>
                  </div>
                  
                  {showPasswordFields && (
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <PasswordInput 
                          id="currentPassword" 
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)} 
                          disabled={isSaving} 
                          className="text-sm sm:text-base" 
                          placeholder="Enter your current password" 
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <PasswordInput 
                            id="newPassword" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            disabled={isSaving} 
                            className="text-sm sm:text-base" 
                            placeholder="Min. 8 characters" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <PasswordInput 
                            id="confirmPassword" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            disabled={isSaving} 
                            className="text-sm sm:text-base" 
                            placeholder="Confirm new password" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3">
                <ShineBorder borderRadius={8} borderWidth={2} duration={3} color="hsl(var(--primary))" className="w-full sm:flex-1">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="w-full text-sm sm:text-base h-11"
                    size="lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </ShineBorder>
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/chat/profile/${authUser.id}`)}
                  className="w-full sm:w-auto text-sm sm:text-base h-11"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}