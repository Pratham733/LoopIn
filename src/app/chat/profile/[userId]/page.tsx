"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare, Grid3X3, Tag as TagIcon, Loader2, EyeOff, ShieldCheck, UserPlus, UserCheck, MoreVertical, Bookmark as BookmarkIcon, Repeat, Share2 as Share2Icon, ListX as ListXIcon, QrCode, Settings, /*Music,*/ UserCircle, Camera, Upload, X, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getUserProfile, getAllUsers, updateUserAvatar } from '@/services/userService';
import { getPostsByUserId, getPostsByIds } from '@/services/postService';
import { updateUserFollowStatus } from '@/services/followService';
import { addNotification } from '@/services/notificationService';
import { sendFriendRequest, cancelFriendRequest, checkFriendRequestStatus } from '@/services/friendRequestService';
import { blockUser, unblockUser, isUserBlocked } from '@/services/blockService';
import { mockFollowRequests, cancelFollowRequest as apiCancelFollowRequest } from '@/lib/mockData';
import type { MockUser, Post } from '@/types';
import { UserListModal } from '@/components/chat/UserListModal';
import { PostGridItem } from '@/components/chat/PostGridItem';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EditProfileModal } from '@/components/chat/EditProfileModal';
import { useCustomTheme } from '@/contexts/CustomThemeContext';
import Particles from '@/components/magicui/particles';

export default function UserProfilePage() {
  const router = useRouter();
  const { userId: targetUserId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentTheme } = useCustomTheme();

  const { user: authUser, updateUser: updateAuthUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [targetUser, setTargetUser] = useState<MockUser | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
  const [savedPostsData, setSavedPostsData] = useState<Post[]>([]);
  const [allUsers, setAllUsers] = useState<MockUser[]>([]); 

  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [userListModalTitle, setUserListModalTitle] = useState("");
  const [usersForModal, setUsersForModal] = useState<MockUser[]>([]);
  
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedBy, setIsBlockedBy] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  // const [isCurrentlyPlayingOpen, setIsCurrentlyPlayingOpen] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Avatar upload states
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const particleColor = useMemo(() => {
    if (currentTheme && currentTheme.palette.primary) {
      // Make the color darker. This is a simple approach.
      // A more sophisticated method might involve color manipulation libraries.
      const color = currentTheme.palette.primary;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      // Reduce brightness by a factor
      const factor = 0.5;
      const darkR = Math.floor(r * factor);
      const darkG = Math.floor(g * factor);
      const darkB = Math.floor(b * factor);
      return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
    }
    return '#000000'; // Default to black if theme color is not available
  }, [currentTheme]);

  useEffect(() => {
    async function fetchPageData() {
        if (!targetUserId || !authUser) return;
        setIsLoadingProfile(true);

        try {
            const [
                targetUserProfile,
                posts,
                allUsersData,
                friendRequestStatus,
                blockedStatus,
                blockedByStatus
            ] = await Promise.all([
                getUserProfile(targetUserId as string),
                getPostsByUserId(targetUserId as string),
                getAllUsers(),
                checkFriendRequestStatus(authUser.id, targetUserId as string),
                isUserBlocked(authUser.id, targetUserId as string),
                isUserBlocked(targetUserId as string, authUser.id)
            ]);

            setTargetUser(targetUserProfile);
            setUserPosts(posts);
            setAllUsers(allUsersData);
            setHasPendingRequest(friendRequestStatus === 'pending');
            setIsBlocked(blockedStatus);
            setIsBlockedBy(blockedByStatus);
            
            if (targetUserProfile?.id === authUser.id && authUser.savedPosts && authUser.savedPosts.length > 0) {
              const savedPosts = await getPostsByIds(authUser.savedPosts);
              setSavedPostsData(savedPosts);
            } else {
              setSavedPostsData([]);
            }
            
            // Note: tagged posts would need a more complex query in a real backend
            setTaggedPosts([]);

        } catch (error) {
            console.error("Error fetching profile data:", error);
            toast({ title: "Error", description: "Could not load profile.", variant: "destructive" });
        } finally {
            setIsLoadingProfile(false);
        }
    }
    fetchPageData();
}, [targetUserId, authUser, toast]);

  // Refresh target user data when authUser is updated (for profile image changes)
  useEffect(() => {
    if (targetUser && authUser && targetUser.id === authUser.id) {
      // If viewing own profile and authUser data has been updated, refresh the target user
      setTargetUser(authUser);
    }
  }, [authUser, targetUser]);

  const handleFollowToggle = useCallback(async (profileUserIdToToggle: string) => {
    if (!authUser || authUser.id === profileUserIdToToggle || !targetUser) return;
    
    setIsProcessingAction(true);
    
    try {
      const isCurrentlyFollowing = authUser.following.includes(profileUserIdToToggle);
      
      if (targetUser.isPrivate && !isCurrentlyFollowing) {
        // For private accounts, send friend request instead
        await sendFriendRequest(authUser.id, profileUserIdToToggle);
        setHasPendingRequest(true);
        toast({
          title: "Follow Request Sent",
          description: `Your follow request has been sent to ${targetUser.username}.`
        });
      } else {
        // For public accounts or when already following, use normal follow/unfollow
        const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
        await updateUserFollowStatus(authUser.id, profileUserIdToToggle, action);
        
        const updatedAuthData = await getUserProfile(authUser.id);
        const updatedTargetData = await getUserProfile(profileUserIdToToggle);

        if (updatedAuthData) updateAuthUser(updatedAuthData);
        if (updatedTargetData) setTargetUser(updatedTargetData);

        toast({
          title: action === 'follow' ? "Followed" : "Unfollowed",
          description: `You ${action === 'follow' ? 'are now following' : 'unfollowed'} ${updatedTargetData?.username}.`
        });
      }
    } catch (error) {
      console.error("Error handling follow action:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAction(false);
    }
  }, [authUser, targetUser, toast, updateAuthUser]);

  const handleCancelFollowRequest = useCallback(async (profileUserIdToCancel: string) => {
    if (!authUser) return;
    
    setIsProcessingAction(true);
    
    try {
      await cancelFriendRequest(authUser.id, profileUserIdToCancel);
      setHasPendingRequest(false);
      toast({ title: "Follow Request Cancelled" });
    } catch (error) {
      console.error("Error cancelling follow request:", error);
      toast({ title: "Failed to Cancel Request", variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  }, [authUser, toast]);

  const openUserListModal = (type: 'followers' | 'following') => {
    if (!targetUser) return;
    const ids = type === 'followers' ? targetUser.followers : targetUser.following;
    const users = ids.map((id: string) => allUsers.find((u: MockUser) => u.id === id)).filter(Boolean) as MockUser[];

    setUsersForModal(users);
    setUserListModalTitle(type === 'followers' ? `${targetUser.username}'s Followers` : `${targetUser.username} is Following`);
    setIsUserListModalOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile || !authUser) return;

    setIsUploadingAvatar(true);
    try {
      // In a real app, you'd upload to a cloud storage service
      // For now, we'll create a mock URL and update the user profile
      const mockAvatarUrl = URL.createObjectURL(selectedFile);
      
      const updatedUser = await updateUserAvatar(authUser.id, mockAvatarUrl);
      if (updatedUser) {
        updateAuthUser(updatedUser);
        setTargetUser(updatedUser);
        toast({ title: "Profile Picture Updated", description: "Your profile picture has been updated successfully!" });
        setIsAvatarModalOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({ title: "Upload Failed", description: "Could not update profile picture. Please try again.", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!authUser) return;

    setIsUploadingAvatar(true);
    try {
      const updatedUser = await updateUserAvatar(authUser.id, null);
      if (updatedUser) {
        updateAuthUser(updatedUser);
        setTargetUser(updatedUser);
        toast({ title: "Profile Picture Removed", description: "Your profile picture has been removed." });
        setIsAvatarModalOpen(false);
      }
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast({ title: "Remove Failed", description: "Could not remove profile picture. Please try again.", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const closeAvatarModal = () => {
    setIsAvatarModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProfileUpdated = (updated: Partial<MockUser>) => {
    if (!authUser) return;
    updateAuthUser({ ...authUser, ...updated });
    setTargetUser((prev: MockUser | null) => prev ? { ...prev, ...updated } : prev);
  };

  const isCurrentUserProfile = targetUser?.id === authUser?.id;
  const isFollowingTarget = authUser?.following.includes(targetUser?.id || '') || false;
  const isFollowingCurrentUser = targetUser?.following.includes(authUser?.id || '') || false;
  const canViewFullProfile = !targetUser?.isPrivate || isFollowingTarget || isCurrentUserProfile;

  // If user is blocked by the target, they can't see anything
  if (isBlockedBy && !isCurrentUserProfile) {
    return (
      <div className="p-4 sm:p-8 text-center flex flex-col items-center justify-center h-screen">
        <ShieldCheck className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-destructive mb-4 sm:mb-6" />
        <h1 className="text-xl sm:text-3xl font-bold">Profile Not Available</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">You cannot view this profile.</p>
        <Button onClick={() => router.push('/chat')} className="mt-6 sm:mt-8 text-sm sm:text-base">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Home
        </Button>
      </div>
    );
  }

  const handleShareProfile = () => {
    if (!targetUser) return;
    const profileUrl = `${window.location.origin}/chat/profile/${targetUser.id}`;
    navigator.clipboard.writeText(profileUrl)
      .then(() => {
        toast({ title: "Profile Link Copied!", description: "Link to this profile copied to clipboard." });
      })
      .catch(() => {
        toast({ title: "Failed to Copy Link", variant: "destructive" });
      });
  };

  const handleReportUser = async () => {
    if (!targetUser) return;
    
    setIsProcessingAction(true);
    
    try {
      // In a real app, you would send this to a reporting service
      toast({
        title: "User Reported",
        description: `You have reported ${targetUser.username}. We will review this report.`,
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error reporting user:", error);
      toast({
        title: "Error",
        description: "Failed to report user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleBlockUser = async () => {
    if (!targetUser || !authUser) return;
    
    setIsProcessingAction(true);
    
    try {
      await blockUser(authUser.id, targetUser.id);
      setIsBlocked(true);
      
      // Remove from following/followers lists locally
      const updatedAuthData = await getUserProfile(authUser.id);
      if (updatedAuthData) updateAuthUser(updatedAuthData);
      
      toast({
        title: "User Blocked",
        description: `You have blocked ${targetUser.username}. They will no longer be able to see your profile or contact you.`,
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        title: "Error",
        description: "Failed to block user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!targetUser || !authUser) return;
    
    setIsProcessingAction(true);
    
    try {
      await unblockUser(authUser.id, targetUser.id);
      setIsBlocked(false);
      
      toast({
        title: "User Unblocked",
        description: `You have unblocked ${targetUser.username}.`,
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        title: "Error",
        description: "Failed to unblock user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRemoveFollower = async () => {
    if (!targetUser || !authUser) return;
    
    setIsProcessingAction(true);
    
    try {
      // Remove the target user from current user's followers
      await updateUserFollowStatus(targetUser.id, authUser.id, 'unfollow');
      
      // Refresh user data
      const updatedAuthData = await getUserProfile(authUser.id);
      const updatedTargetData = await getUserProfile(targetUser.id);
      
      if (updatedAuthData) updateAuthUser(updatedAuthData);
      if (updatedTargetData) setTargetUser(updatedTargetData);
      
      toast({
        title: "Follower Removed",
        description: `${targetUser.username} has been removed from your followers.`,
      });
    } catch (error) {
      console.error("Error removing follower:", error);
      toast({
        title: "Error",
        description: "Failed to remove follower. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Profile...</p>
      </div>
    );
  }

  if (!targetUser || !authUser) {
    return (
      <div className="p-4 sm:p-8 text-center flex flex-col items-center justify-center h-screen">
        <ShieldCheck className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-destructive mb-4 sm:mb-6" />
        <h1 className="text-xl sm:text-3xl font-bold">Profile Not Found</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">The user profile you are looking for does not exist or could not be loaded.</p>
        <Button onClick={() => router.push('/chat')} className="mt-6 sm:mt-8 text-sm sm:text-base">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Home
        </Button>
      </div>
    );
  }

  let followButtonContent;
  if (!isCurrentUserProfile && !isBlocked) {
    if (targetUser.isPrivate) {
      if (isFollowingTarget) {
        followButtonContent = (
          <Button 
            onClick={() => handleFollowToggle(targetUser.id)} 
            variant="outline" 
            size="sm" 
            className="text-xs px-3 py-1.5 sm:text-sm"
            disabled={isProcessingAction}
          >
            <UserCheck className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4"/> Following
          </Button>
        );
      } else if (hasPendingRequest) {
        followButtonContent = (
          <Button 
            onClick={() => handleCancelFollowRequest(targetUser.id)} 
            variant="outline" 
            size="sm" 
            className="text-xs px-3 py-1.5 sm:text-sm"
            disabled={isProcessingAction}
          >
            {isProcessingAction ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
            Requested
          </Button>
        );
      } else {
        followButtonContent = (
          <Button 
            onClick={() => handleFollowToggle(targetUser.id)} 
            variant="default" 
            size="sm" 
            className="text-xs px-3 py-1.5 sm:text-sm"
            disabled={isProcessingAction}
          >
            {isProcessingAction ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4"/>}
            Request
          </Button>
        );
      }
    } else { 
      if (isFollowingTarget) {
        followButtonContent = (
          <Button 
            onClick={() => handleFollowToggle(targetUser.id)} 
            variant="outline" 
            size="sm" 
            className="text-xs px-3 py-1.5 sm:text-sm"
            disabled={isProcessingAction}
          >
            <UserCheck className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4"/> Following
          </Button>
        );
      } else {
        followButtonContent = (
          <Button 
            onClick={() => handleFollowToggle(targetUser.id)} 
            variant="default" 
            size="sm" 
            className="text-xs px-3 py-1.5 sm:text-sm"
            disabled={isProcessingAction}
          >
            {isProcessingAction ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4"/>}
            Follow
          </Button>
        );
      }
    }
  }

  return (
    <div className="relative bg-background">

      <Particles
        className="absolute inset-0 -z-10"
        particleCount={100}
        particleColors={[particleColor]}
      />
      {/* <CurrentlyPlayingModal isOpen={isCurrentlyPlayingOpen} onOpenChange={setIsCurrentlyPlayingOpen} /> */}

      <UserListModal
        isOpen={isUserListModalOpen}
        onOpenChange={setIsUserListModalOpen}
        title={userListModalTitle}
        users={usersForModal}
        currentUser={authUser}
        onFollowToggle={handleFollowToggle}
      />
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onOpenChange={setIsEditProfileModalOpen}
        user={authUser}
        onProfileUpdated={handleProfileUpdated}
      />
      <div className="w-full max-w-4xl mx-auto pt-0 px-2 sm:pt-0 sm:px-4 md:pt-0 md:px-6">
        <header className="flex flex-col md:flex-row items-center md:items-center gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
          <div className="shrink-0 md:w-1/4 flex flex-col items-center md:items-start animate-fade-in-down relative" style={{animationDelay: '0.1s'}}>
            <div className="relative group">
              <Avatar className="h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32 ring-2 ring-border transition-all duration-300">
                <AvatarImage 
                  src={targetUser.profileImage || targetUser.avatar} 
                  alt={`${targetUser.username}'s profile picture`}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl sm:text-2xl md:text-3xl font-medium bg-gradient-to-br from-primary/20 to-secondary/20">
                  {targetUser.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isCurrentUserProfile && (
                <button
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-grow space-y-2 md:space-y-3 w-full md:w-3/4 text-center md:text-left animate-fade-in-down" style={{animationDelay: '0.2s'}}>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-light text-foreground order-1 sm:order-none">{targetUser.username}</h1>
              <div className="flex items-center gap-2 order-2 sm:order-none">
                {isCurrentUserProfile ? (
                  <Button variant="secondary" size="sm" className="text-xs px-3 py-1.5 sm:text-sm" onClick={() => setIsEditProfileModalOpen(true)}>
                    <Settings className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Edit Profile
                  </Button>
                ) : (
                  <>
                    {followButtonContent}
                    <Button asChild variant="outline" size="sm" className="text-xs px-3 py-1.5 sm:text-sm">
                      <Link href={`/chat/conversations/new?userId=${targetUser.id}`}>Message</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-4 text-sm sm:text-base">
              <span>{userPosts.length} posts</span>
              <span>{targetUser.followers.length} followers</span>
              <span>{targetUser.following.length} following</span>
            </div>
            <div className="font-semibold text-base sm:text-lg text-foreground mt-1">{targetUser.fullName}</div>
            <div className="text-muted-foreground text-sm sm:text-base">{targetUser.bio || 'Welcome to LoopIn!'}</div>
          </div>
        </header>

        <Separator className="mb-6 sm:mb-8 animate-fade-in" style={{animationDelay: '0.3s'}} />

        {canViewFullProfile ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-6 sm:mb-8 text-xs">
              <TabsTrigger value="posts" className="flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5"><Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5"/>POSTS</TabsTrigger>
              {isCurrentUserProfile && ( 
                   <TabsTrigger value="saved" className="flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5"><BookmarkIcon className="h-4 w-4 sm:h-5 sm:w-5"/>SAVED</TabsTrigger>
              )}
              <TabsTrigger value="tagged" className={cn("flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5", !isCurrentUserProfile && "col-start-3")}>
                  <TagIcon className="h-4 w-4 sm:h-5 sm:w-5"/>TAGGED
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
              {userPosts.length > 0 ? (
                <div className="cards-container-3d">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
                    {userPosts.map((post: any) => (
                      <PostGridItem key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 sm:py-16 text-muted-foreground">
                  <EyeOff className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold">No Posts Yet</h3>
                  {isCurrentUserProfile && <p className="text-xs sm:text-sm">Start sharing your moments!</p>}
                </div>
              )}
            </TabsContent>
            {isCurrentUserProfile && (
              <TabsContent value="saved">
                  {savedPostsData.length > 0 ? (
                      <div className="cards-container-3d">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
                          {savedPostsData.map((post: any) => (
                              <PostGridItem key={`saved-${post.id}`} post={post} />
                          ))}
                          </div>
                      </div>
                      ) : (
                      <div className="text-center py-12 sm:py-16 text-muted-foreground">
                          <BookmarkIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4" />
                          <h3 className="text-lg sm:text-xl font-semibold">No Saved Posts</h3>
                          <p className="text-xs sm:text-sm">Save posts you want to see again later.</p>
                      </div>
                  )}
              </TabsContent>
             )}
             <TabsContent value="tagged">
               {taggedPosts.length > 0 ? (
                  <div className="cards-container-3d">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
                      {taggedPosts.map((post: any) => (
                          <PostGridItem key={`tagged-${post.id}`} post={post} />
                      ))}
                      </div>
                  </div>
                  ) : (
                  <div className="text-center py-12 sm:py-16 text-muted-foreground">
                      <TagIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-lg sm:text-xl font-semibold">No Tagged Posts</h3>
                      <p className="text-xs sm:text-sm">This user hasn't been tagged in any posts yet.</p>
                  </div>
               )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 sm:py-16 border rounded-lg bg-card animate-fade-in-up">
            <ShieldCheck className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold">This Account is Private</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">Follow {targetUser.username} to see their posts.</p>
          </div>
        )}
      </div>

      {/* Avatar Upload Modal */}
      <Dialog open={isAvatarModalOpen} onOpenChange={closeAvatarModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Profile Picture</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-32 w-32 ring-2 ring-border">
                <AvatarImage 
                  src={previewUrl || targetUser?.avatar} 
                  alt="Profile preview"
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-medium bg-gradient-to-br from-primary/20 to-secondary/20">
                  {targetUser?.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
                disabled={isUploadingAvatar}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Photo
              </Button>

              {targetUser?.avatar && (
                <Button
                  onClick={handleRemoveAvatar}
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  disabled={isUploadingAvatar}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove Current Photo
                </Button>
              )}
            </div>

            {selectedFile && (
              <div className="text-sm text-muted-foreground text-center">
                Selected: {selectedFile.name}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={closeAvatarModal} variant="outline" disabled={isUploadingAvatar}>
              Cancel
            </Button>
            <Button
              onClick={handleAvatarUpload}
              disabled={!selectedFile || isUploadingAvatar}
              className="w-full sm:w-auto"
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Update Picture
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}