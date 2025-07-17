"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'; 
import Link from 'next/link';
import Image from 'next/image';
import type { Post, MockUser, PostComment } from '@/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea as CommentTextarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormattedTimestamp } from '@/components/common/FormattedTimestamp';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MoreHorizontal, SendHorizonal, MessageSquareReply, Smile, Image as ImageIcon, MessageSquare, Bookmark, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from '@/components/common/UserAvatar';
import { useToast } from '@/hooks/use-toast';
import { updateUserFollowStatus } from '@/services/followService';
import { addNotification } from '@/services/notificationService';
import { SendPostInDMDialog } from './SendPostInDMDialog';
import { SocialShareClock } from './SocialShareClock';
import { UserListModal } from '@/components/chat/UserListModal';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { refreshStorageUrl } from '@/lib/firebase';
import { CommentUserAvatar } from '@/components/chat/CommentUserAvatar';
import StarBorder from '@/components/magicui/StarBorder';
import { ShareTooltipButton } from './ShareTooltipButton';


interface PostCardProps {
  post: Post;
  currentUser: MockUser;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onToggleSave: (postId: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
}

export function PostCard({ post, currentUser, onToggleLike, onAddComment, onToggleSave, onToggleCommentLike }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);
  
  const hasLiked = post.likes.includes(currentUser.id);
  const hasSaved = currentUser.savedPosts?.includes(post.id) || false;

  const isOwnPost = post.userId === currentUser.id;
  const [isSendDmDialogOpen, setIsSendDmDialogOpen] = useState(false);

  const [isLikersModalOpen, setIsLikersModalOpen] = useState(false);
  const [usersForModal, setUsersForModal] = useState<MockUser[]>([]);

  const likersDetails = useMemo(() => {
    // In a real implementation, we'd fetch user data for each ID in post.likes
    // For now, just return an empty array to avoid using mock data
    return [] as MockUser[];
  }, [post.likes]); 

  const handleOpenLikersModal = () => {
    setUsersForModal(likersDetails);
    setIsLikersModalOpen(true);
  };

  const handleFollowToggleInModal = async (targetUserId: string) => {
    if (!currentUser) return;
    const isCurrentlyFollowing = currentUser.following.includes(targetUserId);
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';

    try {
      // Use the follow service
      await updateUserFollowStatus(currentUser.id, targetUserId, action);
      
      // Display toast notification
      toast({
          title: action === 'follow' ? "Followed" : "Unfollowed",
          description: `You ${action === 'follow' ? 'are now following' : 'unfollowed'} this user.`
      });
      
      // Add notification when following
      if (action === 'follow' && currentUser) {
          await addNotification(targetUserId, {
              category: 'follow',
              title: 'New Follower',
              message: `${currentUser.username} started following you.`, 
              actor: currentUser,
              link: `/chat/profile/${currentUser.id}`
            }); 
        }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive"
      });
    }
    
    // Update likes modal with current post likes
    // We should use actual user data instead of mock data
    setUsersForModal([]); // Reset first, actual data should come from a proper user fetch call
    
    // In a real implementation, we'd fetch user data for each ID in post.likes
  };


  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(post.id, newComment.trim());
      setNewComment("");
      if (!showComments) {
        setShowComments(true);
      }
    }
  };

  const handleOpenSendInDMDialog = () => {
    // Use post details directly
    if (!post.username || !post.userId) {
      toast({ title: "Error", description: "Post owner information not found.", variant: "destructive" });
      return;
    }

    // Since Post type doesn't have isPrivate property, 
    // assume post owner is not private or check based on available data
    const postOwner = {
      id: post.userId,
      username: post.username,
      isPrivate: false // Default to false since it's not in the Post type
    };

    if (postOwner.isPrivate && postOwner.id !== currentUser.id && !currentUser.following.includes(postOwner.id)) {
      toast({
        title: "Cannot Share Post",
        description: "This account is private. You need to follow them to share their posts in a DM.",
        variant: "destructive",
      });
    } else {
      setIsSendDmDialogOpen(true);
    }
  };

  const handleLikeComment = (commentId: string) => {
    onToggleCommentLike(post.id, commentId);
  };

  const handleReplyToComment = (commentId: string, username: string) => {
    if (!showComments) {
        setShowComments(true);
    }
    setNewComment(`@${username} `);
    
    setTimeout(() => {
        if (commentInputRef.current) {
            commentInputRef.current.focus();
            const len = commentInputRef.current.value.length;
            commentInputRef.current.selectionStart = len;
            commentInputRef.current.selectionEnd = len;
        }
    }, 0);
  };

  const handleToggleSavePost = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSave(post.id);
    toast({
        title: hasSaved ? "Post Unsaved" : "Post Saved",
        description: hasSaved ? "Removed from your saved posts." : "Added to your saved posts.",
    });
  }, [post.id, hasSaved, onToggleSave, toast]);

  const handleToggleLike = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleLike(post.id);
  }, [post.id, onToggleLike]);

  const handleToggleComments = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(!showComments);
  }, [showComments]);

  const [processedMedia, setProcessedMedia] = useState(post.media);
  
  // Process media URLs to ensure they have valid tokens
  useEffect(() => {
    if (post.media && post.media.length > 0) {
      const processUrls = async () => {
        try {
          const updatedMedia = await Promise.all(post.media.map(async (item) => {
            // Only refresh Firebase Storage URLs
            if (item.url.includes('firebasestorage.googleapis.com') || 
                item.url.includes('firebase') || 
                item.url.includes('localhost:9199')) {
              // We first try to use the URL as is
              return { ...item };
            }
            return item;
          }));
          
          setProcessedMedia(updatedMedia);
        } catch (error) {
          console.error('Error processing media URLs:', error);
        }
      };
      
      processUrls();
    }
  }, [post.media]);

  useEffect(() => {
    setProcessedMedia(post.media);
  }, [post.media]);


  return (
    <>
      <StarBorder as="div" className="mb-6" color="cyan" speed="5s">
    <Card 
      ref={cardRef} 
      className={cn(
        "w-full bg-card dark:bg-card/90 rounded-xl transition-all duration-300 ease-in-out hover:shadow-xl",
        isVisible ? "animate-card-fly-in" : "opacity-0"
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 pb-3 p-4">
        <Link href={`/chat/profile/${post.userId}`}>
          <UserAvatar 
            user={{ 
              id: post.userId, 
                  username: post.username,
                  profileImage: post.userProfileImage // Use userProfileImage if available
            }} 
            size="md" 
          />
        </Link>
        <div className="flex-grow">
          <Link href={`/chat/profile/${post.userId}`} className="font-semibold hover:underline">{post.username}</Link>
          <FormattedTimestamp timestamp={post.timestamp} className="text-xs text-muted-foreground block" />
        </div>
        {isOwnPost && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-5 w-5"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={() => toast({ title: "Delete Post (Mock)", description: "This post would be deleted."})}
                        className="text-red-600 focus:text-red-600 focus:bg-red-500/10"
                    >
                        Delete Post (Mock)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )}
      </CardHeader>

      {processedMedia && processedMedia.length > 0 && (
        <div 
          className="relative w-full aspect-video bg-black overflow-hidden"
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
        >
          {processedMedia.length === 1 ? (
            processedMedia[0].type === 'image' ? (
              <Image
                src={processedMedia[0].url}
                alt={post.content.substring(0,30) || "Post media"}
                layout="fill" 
                objectFit="cover" 
                className="absolute inset-0 w-full h-full"
                data-ai-hint={processedMedia[0].url.includes('placehold.co') ? "placeholder image" : "post image content"}
                onError={(e) => { e.currentTarget.src = '/logo.png'; }}
              />
            ) : (
              <video 
                src={processedMedia[0].url} 
                controls 
                className="absolute inset-0 w-full h-full object-cover outline-none" 
                data-ai-hint="post video content"
              >
                Your browser does not support the video tag.
              </video>
            )
          ) : (
            <Carousel setApi={setCarouselApi} className="w-full h-full" opts={{ loop: true }}>
              <CarouselContent>
                {processedMedia.map((mediaItem, index) => (
                  <CarouselItem key={index} className="bg-black">
                    {mediaItem.type === 'image' ? (
                      <Image
                        src={mediaItem.url}
                        alt={`Post media ${index + 1}`}
                        layout="fill"
                        objectFit="contain"
                        className="w-full h-full"
                        data-ai-hint={mediaItem.url.includes('placehold.co') ? "placeholder image" : "post image content"}
                      />
                    ) : (
                      <video 
                        src={mediaItem.url} 
                        controls 
                        className="w-full h-full object-contain outline-none"
                        data-ai-hint="post video content"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious 
                className={cn(
                  "absolute h-8 w-8 rounded-full top-1/2 -translate-y-1/2 left-2 text-white bg-black/40 hover:bg-black/60 border-none transition-opacity",
                  isCarouselHovered ? "opacity-100" : "opacity-0"
                )} 
              />
              <CarouselNext 
                className={cn(
                  "absolute h-8 w-8 rounded-full top-1/2 -translate-y-1/2 right-2 text-white bg-black/40 hover:bg-black/60 border-none transition-opacity",
                  isCarouselHovered ? "opacity-100" : "opacity-0"
                )} 
              />
            </Carousel>
          )}
        </div>
      )}

      <CardContent className="space-y-3 pt-4 pb-3 px-4">
        <div className="flex items-center gap-3 pt-2 pb-1 px-1">
            <button 
              onClick={handleToggleLike}
              aria-label={hasLiked ? "Unlike post" : "Like post"} 
              className="p-1.5 rounded-full transition-all duration-150 ease-in-out active:scale-90 group focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <div
                className={cn(
                  "transition-all duration-150 ease-in-out",
                  hasLiked 
                    ? "text-red-600" 
                    : "text-muted-foreground group-hover:text-pink-500"
                )}
              >
                <Heart
                  className={cn(
                    "size-7 transition-transform duration-150",
                    !hasLiked && "group-hover:scale-110"
                  )}
                  fill={hasLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
              </div>
            </button>

            <div className="group relative">
              <button 
                onClick={handleToggleComments}
                aria-label="View comments" 
                className="p-1.5 rounded-full hover:bg-accent active:scale-95 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <MessageSquare
                  className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors"
                />
              </button>
            </div>

            <ShareTooltipButton />

            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOpenSendInDMDialog();
              }}
              aria-label="Send in DM" 
              className="p-1.5 rounded-full hover:bg-accent active:scale-95 transition-colors"
            >
                <SendHorizonal className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors" />
            </button>
            
            <button 
              onClick={handleToggleSavePost}
              aria-label={hasSaved ? "Unsave post" : "Save post"}
              className="cursor-pointer group ml-auto p-1.5 rounded-full transition-all duration-150 ease-in-out active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <div
                className={cn(
                  "transition-all duration-150 ease-in-out",
                  hasSaved
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-primary"
                )}
              >
                <Bookmark
                  className={cn(
                    "size-7 transition-transform duration-150",
                    !hasSaved && "group-hover:scale-110"
                  )}
                  fill={hasSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
              </div>
            </button>
        </div>
        
        {likersDetails.length > 0 && (
           <button
            onClick={handleOpenLikersModal}
            className="flex items-center gap-2 mt-2 px-1 text-left hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded-sm"
            aria-label={`View users who liked this post. ${likersDetails.length} likes.`}
          >
            <p className="text-sm font-medium text-foreground">
              {likersDetails.length} like{likersDetails.length !== 1 ? 's' : ''}
            </p>
          </button>
        )}


        {post.content && <p className="text-base leading-relaxed whitespace-pre-line"><Link href={`/chat/profile/${post.userId}`} className="font-semibold hover:underline hover:text-primary transition-colors">{post.username}</Link> {post.content}</p>}
        
        {post.comments.length > 0 && !showComments && (
           <button onClick={() => setShowComments(true)} className="text-sm text-muted-foreground hover:underline hover:text-primary transition-colors">
                View all {post.comments.length} comment{post.comments.length !== 1 && 's'}
           </button>
        )}
      </CardContent>

      {showComments && (
          <CardFooter className="flex flex-col items-start gap-3 pt-3 pb-4 px-4 border-t">
            <ScrollArea className="w-full max-h-72 pr-2 -mr-2 mb-3">
              <div className="space-y-4 py-2">
                {post.comments.length > 0 ? post.comments.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(comment => {
                  const hasLikedComment = (comment.likes || []).includes(currentUser.id);
                  return (
                  <div key={comment.id} className="flex items-start gap-2.5 text-sm">
                    <CommentUserAvatar userId={comment.userId} size={36} />
                    <div className="flex-grow bg-background p-3 rounded-xl border shadow-sm">
                        <div className="flex items-baseline justify-between">
                            <Link href={`/chat/profile/${comment.userId}`} className="font-semibold hover:underline hover:text-primary text-sm">{comment.username}</Link>
                            <FormattedTimestamp timestamp={comment.timestamp} className="text-[0.7rem] text-muted-foreground/90"/>
                        </div>
                        <p className="text-foreground/90 mt-1 whitespace-pre-line break-words text-sm leading-normal">{comment.content}</p>
                        <div className="flex items-center gap-2 mt-2.5">
                            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-muted-foreground hover:text-pink-500 focus:outline-none focus:ring-2 focus:ring-primary/50" onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleLikeComment(comment.id);
                            }} aria-label="Like comment">
                                <Heart 
                                    className={cn(
                                        "mr-1.5 h-4 w-4 transition-colors",
                                        hasLikedComment ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
                                    )}
                                    fill={hasLikedComment ? 'currentColor' : 'none'}
                                />
                                {(comment.likes || []).length > 0 && <span className={cn("text-xs", hasLikedComment ? 'text-red-500' : 'text-muted-foreground')}>{comment.likes?.length}</span>}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleReplyToComment(comment.id, comment.username);
                            }} aria-label="Reply to comment">
                                <MessageSquareReply className="mr-1.5 h-4 w-4" />
                                <span className="text-xs">Reply</span>
                            </Button>
                        </div>
                    </div>
                  </div>
                )}) : <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first to share your thoughts!</p>}
              </div>
            </ScrollArea>

            <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2 w-full border-t pt-4">
              <div className="flex gap-2.5 items-start">
                <CommentUserAvatar userId={currentUser.id} size={40} />
                <div className="flex-1 relative">
                    <CommentTextarea
                        ref={commentInputRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a thoughtful comment..."
                        className="flex-1 min-h-[44px] max-h-32 text-sm py-2.5 pr-24 rounded-full shadow-inner bg-muted/60 focus-visible:ring-primary/60 border-border hover:border-input focus:border-primary/50 transition-colors"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentSubmit(e as unknown as React.FormEvent);
                            }
                        }}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => toast({title: "Attach Image (Mock)", description: "Feature not yet implemented."})} aria-label="Attach image">
                            <ImageIcon className="h-4.5 w-4.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => toast({title: "Add Emoji/Sticker (Mock)", description: "Feature not yet implemented."})} aria-label="Add emoji or sticker">
                            <Smile className="h-4.5 w-4.5" />
                        </Button>
                    </div>
                </div>
              </div>
              {newComment.trim() && (
                <Button type="submit" size="default" disabled={!newComment.trim()} className="self-end text-xs px-5 py-2 rounded-full bg-primary hover:bg-primary/90 mt-1.5">
                    <SendHorizonal className="mr-2 h-4 w-4" /> Post Comment
                </Button>
              )}
            </form>
          </CardFooter>
        )}
    </Card>
      </StarBorder>
    {currentUser && (
      <SendPostInDMDialog
        isOpen={isSendDmDialogOpen}
        onOpenChange={setIsSendDmDialogOpen}
        postToShare={post}
        currentUser={currentUser}
      />
    )}
    <UserListModal
        isOpen={isLikersModalOpen}
        onOpenChange={setIsLikersModalOpen}
        title="Liked by"
        users={usersForModal}
        currentUser={currentUser}
        onFollowToggle={handleFollowToggleInModal}
      />
    </>
  );
}

