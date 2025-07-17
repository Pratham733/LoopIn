
"use client";

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { getPostsByUserId, togglePostLike, addComment, toggleCommentLike } from '@/services/postService';
import { getUserProfile, toggleSavePost } from '@/services/userService';
import type { MockUser, Post } from '@/types';
import { PostCard } from '@/components/chat/PostCard';
import { ArrowLeft, Loader2, UserCircle, ShieldAlert } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

export default function UserAllPostsPage() {
  const router = useRouter();
  const { userId: targetUserId } = useParams<{ userId: string }>();

  const { user: authUser, isLoading: authLoading, updateUser: updateAuthUser } = useAuth();
  
  const [targetUser, setTargetUser] = useState<MockUser | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const fetchPageData = useCallback(async () => {
    if (!targetUserId) return;
    setIsLoadingPage(true);
    try {
        const [user, posts] = await Promise.all([
            getUserProfile(targetUserId),
            getPostsByUserId(targetUserId),
        ]);
        setTargetUser(user);
        setUserPosts(posts);
    } catch(error) {
        console.error("Failed to load page data:", error);
        setTargetUser(null);
        setUserPosts([]);
    } finally {
        setIsLoadingPage(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleToggleLike = async (postId: string) => {
    if (!authUser || !targetUserId) return;
    
    // Optimistic update
    setUserPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          const hasLiked = post.likes.includes(authUser.id);
          return {
            ...post,
            likes: hasLiked 
              ? post.likes.filter(id => id !== authUser.id)
              : [...post.likes, authUser.id]
          };
        }
        return post;
      })
    );
    
    // Backend update
    try {
      await togglePostLike(postId, authUser.id);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
      setUserPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const hasLiked = post.likes.includes(authUser.id);
            return {
              ...post,
              likes: hasLiked 
                ? post.likes.filter(id => id !== authUser.id)
                : [...post.likes, authUser.id]
            };
          }
          return post;
        })
      );
    }
  };

  const handleToggleCommentLike = async (postId: string, commentId: string) => {
    if (!authUser) return;
    
    // Optimistic update
    setUserPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map(comment => {
              if (comment.id === commentId) {
                const hasLiked = comment.likes?.includes(authUser.id) || false;
                return {
                  ...comment,
                  likes: hasLiked 
                    ? (comment.likes || []).filter(id => id !== authUser.id)
                    : [...(comment.likes || []), authUser.id]
                };
              }
              return comment;
            })
          };
        }
        return post;
      })
    );
    
    // Backend update
    try {
      await toggleCommentLike(postId, commentId, authUser.id);
    } catch (error) {
      console.error("Error toggling comment like:", error);
      // Revert optimistic update on error
      setUserPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => {
                if (comment.id === commentId) {
                  const hasLiked = comment.likes?.includes(authUser.id) || false;
                  return {
                    ...comment,
                    likes: hasLiked 
                      ? (comment.likes || []).filter(id => id !== authUser.id)
                      : [...(comment.likes || []), authUser.id]
                  };
                }
                return comment;
              })
            };
          }
          return post;
        })
      );
    }
  };

  const handleAddComment = async (postId: string, commentText: string) => {
    if (!authUser || !targetUserId) return;
    
    const newComment = {
      id: `temp-${Date.now()}`, // Temporary ID
      postId: postId,
      userId: authUser.id,
      username: authUser.username,
      content: commentText,
      timestamp: new Date(),
      likes: []
    };
    
    // Optimistic update
    setUserPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment]
          };
        }
        return post;
      })
    );
    
    // Backend update
    try {
      await addComment(postId, {
        userId: authUser.id,
        username: authUser.username,
        content: commentText,
      });
      
      // Comment was successfully added, the optimistic update should remain
    } catch (error) {
      console.error("Error adding comment:", error);
      // Revert optimistic update on error
      setUserPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.filter(comment => comment.id !== newComment.id)
            };
          }
          return post;
        })
      );
    }
  };

  const handleToggleSave = async (postId: string) => {
    if (!authUser) return;
    const isSavedNow = await toggleSavePost(authUser.id, postId);
    updateAuthUser({ savedPosts: isSavedNow 
        ? [...(authUser.savedPosts || []), postId] 
        : (authUser.savedPosts || []).filter(id => id !== postId) 
    });
  };


  if (authLoading || isLoadingPage) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading User Posts...</p>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="p-4 sm:p-8 text-center flex flex-col items-center justify-center h-screen">
        <ShieldAlert className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-destructive mb-4 sm:mb-6" />
        <h1 className="text-xl sm:text-3xl font-bold">User Not Found</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">The user you are looking for does not exist.</p>
        <Button onClick={() => router.push('/chat')} className="mt-6 sm:mt-8 text-sm sm:text-base">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Home
        </Button>
      </div>
    );
  }

  const canViewPosts = !targetUser.isPrivate || (authUser && authUser.following.includes(targetUser.id)) || targetUser.id === authUser?.id;

  if (!canViewPosts && targetUser.id !== authUser?.id) { 
     return (
      <div className="p-4 sm:p-8 text-center flex flex-col items-center justify-center h-screen">
        <ShieldAlert className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-primary mb-4 sm:mb-6" />
        <h1 className="text-xl sm:text-3xl font-bold">Private Account</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          This account is private. Follow {targetUser.username} to see their posts.
        </p>
        <Button onClick={() => router.back()} className="mt-6 sm:mt-8 text-sm sm:text-base">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:py-6 sm:px-4 md:py-8 md:px-6">
      <div className="mb-6 sm:mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
        </Button>
        <div className="flex items-center gap-3 sm:gap-4 p-3 bg-card rounded-lg shadow">
           <Link href={`/chat/profile/${targetUser.id}`}>
            <UserCircle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
           </Link>
           <div>
            <p className="text-xs text-muted-foreground">Posts by</p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">{targetUser.username}</h1>
           </div>
        </div>
      </div>

      {userPosts.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {userPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={authUser!} 
              onToggleLike={handleToggleLike}
              onAddComment={handleAddComment}
              onToggleSave={handleToggleSave}
              onToggleCommentLike={handleToggleCommentLike}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 text-muted-foreground bg-card rounded-lg shadow">
          <UserCircle className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-4 text-primary/50" />
          <h3 className="text-lg sm:text-xl font-semibold">No Posts Yet</h3>
          <p className="text-sm">{targetUser.username} hasn't shared any posts.</p>
        </div>
      )}
    </div>
  );
}
