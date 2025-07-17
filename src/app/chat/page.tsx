
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Post, PostComment } from '@/types';
import { PostCard } from '@/components/chat/PostCard';
import { MessageSquare, Edit3, UserCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { getFeedPostsForUser, addComment, togglePostLike, toggleCommentLike } from '@/services/postService';
import { toggleSavePost } from '@/services/userService';

export default function FeedPage() {
  const { user: currentUser, isLoading: authLoading, updateUser: updateAuthUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const fetchFeedPosts = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingPosts(true);
    try {
      const feedPosts = await getFeedPostsForUser(currentUser.id, currentUser.following);
      setPosts(feedPosts);
    } catch (error) {
      console.error("Error fetching feed posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchFeedPosts();
    } else if (!authLoading) {
      setIsLoadingPosts(false);
    }
  }, [currentUser, authLoading, fetchFeedPosts]);


  const handleToggleLike = async (postId: string) => {
    if (!currentUser) return;
    
    // Optimistic update
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          const hasLiked = post.likes.includes(currentUser.id);
          return {
            ...post,
            likes: hasLiked 
              ? post.likes.filter(id => id !== currentUser.id)
              : [...post.likes, currentUser.id]
          };
        }
        return post;
      })
    );
    
    // Backend update
    try {
      await togglePostLike(postId, currentUser.id);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const hasLiked = post.likes.includes(currentUser.id);
            return {
              ...post,
              likes: hasLiked 
                ? post.likes.filter(id => id !== currentUser.id)
                : [...post.likes, currentUser.id]
            };
          }
          return post;
        })
      );
    }
  };

  const handleToggleCommentLike = async (postId: string, commentId: string) => {
    if (!currentUser) return;
    
    // Optimistic update
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map(comment => {
              if (comment.id === commentId) {
                const hasLiked = comment.likes?.includes(currentUser.id) || false;
                return {
                  ...comment,
                  likes: hasLiked 
                    ? (comment.likes || []).filter(id => id !== currentUser.id)
                    : [...(comment.likes || []), currentUser.id]
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
      await toggleCommentLike(postId, commentId, currentUser.id);
    } catch (error) {
      console.error("Error toggling comment like:", error);
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => {
                if (comment.id === commentId) {
                  const hasLiked = comment.likes?.includes(currentUser.id) || false;
                  return {
                    ...comment,
                    likes: hasLiked 
                      ? (comment.likes || []).filter(id => id !== currentUser.id)
                      : [...(comment.likes || []), currentUser.id]
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
    if (!currentUser) return;
    
    const newComment: PostComment = {
      id: `temp-${Date.now()}`, // Temporary ID
      postId: postId,
      userId: currentUser.id,
      username: currentUser.username,
      content: commentText,
      timestamp: new Date(), // Use Date object instead of string
      likes: []
    };
    
    // Optimistic update
    setPosts(prevPosts => 
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
        userId: currentUser.id,
        username: currentUser.username,
        content: commentText,
      });
      // TODO: Optionally refresh only this post's comments from backend if needed
      // fetchFeedPosts(); // Removed to prevent full page re-render
    } catch (error) {
      console.error("Error adding comment:", error);
      // Revert optimistic update on error
      setPosts(prevPosts => 
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
    if (!currentUser) return;
    const isSavedNow = await toggleSavePost(currentUser.id, postId);
    // Update local user context to reflect save state immediately
    updateAuthUser({ savedPosts: isSavedNow 
        ? [...(currentUser.savedPosts || []), postId] 
        : (currentUser.savedPosts || []).filter(id => id !== postId) 
    });
  };

  if (authLoading || isLoadingPosts) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Loader size="lg" showText={true} text="Loading posts..." />
        <p className="mt-4 text-muted-foreground">Loading Feed...</p>
      </div>
    );
  }

  if (!currentUser) {
     return (
      <div className="flex flex-col h-full items-center justify-center p-4 space-y-4">
        <UserCircle className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground text-center">Please log in to see your feed and connect with others.</p>
        <Button asChild>
          <Link href="/">Go to Login</Link>
        </Button>
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
       <div className="flex flex-col h-full items-center justify-center text-center p-4 sm:p-8 space-y-3 sm:space-y-4">
            <MessageSquare className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground" />
            <h2 className="text-xl sm:text-2xl font-semibold">No posts available</h2>
            <p className="text-muted-foreground max-w-sm sm:max-w-md text-sm sm:text-base">
              Your feed is currently empty. Start by creating a post or finding people to follow to see their updates here.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-3 sm:mt-4">
                <Button asChild size="sm" className="text-xs sm:text-sm">
                    <Link href="/chat/create-post"><Edit3 className="mr-2 h-4 w-4" />Create Post</Link>
                </Button>
                <Button variant="outline" asChild size="sm" className="text-xs sm:text-sm">
                    <Link href="/chat/friends"><UserCircle className="mr-2 h-4 w-4" />Find People</Link>
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-2 sm:py-4 md:py-8 px-4 sm:px-6">
      <div className="relative">
        {/* The timeline line */}
        <div className="absolute left-5 top-0 h-full w-0.5 bg-border/40 -z-10" aria-hidden="true"></div>
        <div className="space-y-12">
          {posts.map(post => (
            <div key={post.id} className="relative pl-12">
              {/* The dot on the timeline */}
              <div className="absolute left-5 top-4 -translate-x-1/2 w-4 h-4 bg-background border-2 border-primary rounded-full" aria-hidden="true"></div>
              <PostCard
                post={post}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onAddComment={handleAddComment}
                onToggleSave={handleToggleSave}
                onToggleCommentLike={handleToggleCommentLike}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
