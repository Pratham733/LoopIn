import { db, storage } from '@/lib/firebase/client';
import type { Post, PostComment, MockUser } from '@/types';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc,
  writeBatch,
  documentId,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getUserProfile } from './userService';
import { executeWithRetry, checkFirebaseConnectivity } from '@/lib/network';
import { addNotification } from './notificationService';


export async function addPost(postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>): Promise<Post> {
  return executeWithRetry(async () => {
    try {
      // 1. Upload media files to Cloudinary if they exist
      const mediaWithUrls = await Promise.all(
        (postData.media || []).map(async (mediaItem) => {
          if (mediaItem.url.startsWith('data:')) { // It's a data URL that needs uploading
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ file: mediaItem.url })
            });
            const data = await res.json();
            if (!data.url) throw new Error(data.error || 'Cloudinary upload failed');
            return { ...mediaItem, url: data.url };
          }
          return mediaItem; // Already a URL, e.g. placeholder
        })
      );

      // 2. Add post document to Firestore
      const postPayload = {
        ...postData,
        media: mediaWithUrls,
        likes: [],
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'posts'), postPayload);
      
      // 3. Send notifications to tagged users
      if (postData.taggedUserIds && postData.taggedUserIds.length > 0) {
        try {
          const [postOwner, taggedUsers] = await Promise.all([
            getUserProfile(postData.userId),
            Promise.all(postData.taggedUserIds.map(id => getUserProfile(id)))
          ]);
          
          if (postOwner) {
            // Send notifications to each tagged user
            for (const taggedUser of taggedUsers) {
              if (taggedUser && taggedUser.id !== postData.userId) { // Don't notify self
                await addNotification(taggedUser.id, {
                  category: 'post_tag',
                  title: 'You were tagged in a post',
                  message: `${postOwner.username} tagged you in their post.`,
                  actor: postOwner,
                  link: `/chat/profile/${postData.userId}/posts`,
                  icon: undefined
                });
              }
            }
          }
        } catch (notificationError) {
          console.error('Error sending tag notifications:', notificationError);
          // Don't throw here as the main post creation succeeded
        }
      }

      return {
        id: docRef.id,
        ...postPayload,
        timestamp: new Date(),
        comments: [], // New posts have no comments
      } as Post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }, 3, 1000, 'Cannot create post: Please check your internet connection');
}

// Fetch posts for the main feed (user's own posts + posts from people they follow)
export async function getFeedPostsForUser(userId: string, followingIds: string[]): Promise<Post[]> {
  return executeWithRetry(async () => {
    const userIdsForFeed = [...new Set([userId, ...followingIds])];

    if (userIdsForFeed.length === 0) {
      return [];
    }
    
    // Firestore 'in' queries are limited to 30 elements. For a real app, this would need pagination or a different data model.
    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', 'in', userIdsForFeed.slice(0, 30)),
      orderBy('timestamp', 'desc')
    );

    try {
      const isConnected = await checkFirebaseConnectivity();
      if (!isConnected) {
        console.log('Fetching feed posts in offline mode');
      }

      const querySnapshot = await getDocs(postsQuery);
      const posts: Post[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        // Fetch comments for each post
        const commentsSnapshot = await getDocs(query(collection(db, 'posts', docSnap.id, 'comments'), orderBy('timestamp', 'asc')));
        const comments = commentsSnapshot.docs.map(commentDoc => {
            const commentData = commentDoc.data();
            return { 
                id: commentDoc.id, 
                ...commentData,
                timestamp: commentData.timestamp?.toDate() || new Date(),
            } as PostComment
        });
        
        // Process media URLs to ensure they have valid tokens
        let media = data.media || [];
        if (media && media.length > 0) {
          // We'll store them as is for now, but when displaying we can refresh the URLs
          media = media.map((item: {url: string, type: 'image' | 'video', dataAiHint?: string}) => ({
            ...item,
            // Add a cache-busting timestamp to force reload
            url: item.url + (item.url.includes('?') ? '&' : '?') + '_t=' + Date.now()
          }));
        }

        // Get user info for the post author
        try {
          const userProfile = await getUserProfile(data.userId);
          
          posts.push({
            id: docSnap.id,
            ...data,
            media,
            timestamp: data.timestamp?.toDate() || new Date(),
            comments,
            username: userProfile?.username || data.username || 'unknown',
            userProfileImage: userProfile?.profileImage || null,
            // Ensure required fields exist
            userId: data.userId,
            content: data.content || '',
            likes: data.likes || [],
            visibility: data.visibility || 'public',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          } as unknown as Post);
        } catch (userError) {
          console.error('Error fetching user profile for post:', userError);
          
          // Add the post without user profile data
          posts.push({
            id: docSnap.id,
            ...data,
            media,
            timestamp: data.timestamp?.toDate() || new Date(),
            comments,
          } as unknown as Post);
        }
      }
      return posts;
    } catch (error) {
      console.error('Error fetching feed posts:', error);
      // Re-throw to allow the retry mechanism to handle it
      throw error;
    }
  });
}

// Fetch all posts by a specific user
export async function getPostsByUserId(userId: string): Promise<Post[]> {
  return executeWithRetry(async () => {
    try {
      // Check connectivity
      const isConnected = await checkFirebaseConnectivity();
      if (!isConnected) {
        console.log('Fetching user posts in offline mode - using cached data');
      }
      const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(postsQuery);
      
      // Get user profile once outside the loop since all posts have the same userId
      const userProfile = await getUserProfile(userId).catch(err => {
        console.error('Error fetching user profile:', err);
        return null;
      });
      
      return Promise.all(querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const commentsSnapshot = await getDocs(query(collection(db, 'posts', docSnap.id, 'comments'), orderBy('timestamp', 'asc')));
        const comments = commentsSnapshot.docs.map(commentDoc => {
            const commentData = commentDoc.data();
            return {
                id: commentDoc.id,
                ...commentData,
                timestamp: commentData.timestamp?.toDate() || new Date()
            } as PostComment
        });

        return {
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          comments,
          username: userProfile?.username || data.username || 'unknown',
          userProfileImage: userProfile?.profileImage || null,
        } as unknown as Post;
      }));
    } catch (error) {
      console.error('Error fetching posts by user ID:', error);
      throw error;
    }
  });
}

// Fetch specific posts by their IDs (for saved posts)
export async function getPostsByIds(postIds: string[]): Promise<Post[]> {
  return executeWithRetry(async () => {
    try {
      if (postIds.length === 0) return [];
      
      // Check connectivity
      const isConnected = await checkFirebaseConnectivity();
      if (!isConnected) {
        console.log('Fetching saved posts in offline mode - using cached data');
      }
      
      // Firestore 'in' query limitation applies here too
      const postsQuery = query(collection(db, 'posts'), where(documentId(), 'in', postIds.slice(0, 30)));
      const querySnapshot = await getDocs(postsQuery);
      
      return Promise.all(querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const commentsSnapshot = await getDocs(query(collection(db, 'posts', docSnap.id, 'comments'), orderBy('timestamp', 'asc')));
        const comments = commentsSnapshot.docs.map(commentDoc => {
            const commentData = commentDoc.data();
            return {
                id: commentDoc.id,
                ...commentData,
                timestamp: commentData.timestamp?.toDate() || new Date(),
            } as PostComment
        });

        return {
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          comments,
        } as Post;
      }));
    } catch (error) {
      console.error('Error fetching posts by IDs:', error);
      throw error;
    }
  }, 3, 1000, 'Cannot load saved posts: Please check your internet connection');
}


// Toggle like on a post
export async function togglePostLike(postId: string, userId: string): Promise<void> {
  return executeWithRetry(async () => {
    try {
      // Check connectivity
      const isConnected = await checkFirebaseConnectivity();
      if (!isConnected) {
        console.log('Toggling post like in offline mode - will sync when online');
      }
      
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const postData = postSnap.data();
        const likes = postData.likes || [];
        const isLiking = !likes.includes(userId);
        
        if (isLiking) {
          await updateDoc(postRef, { likes: arrayUnion(userId) });
          
          // Add notification for post like (only if not liking own post)
          if (postData.userId !== userId) {
            try {
              const [likerUser, postOwner] = await Promise.all([
                getUserProfile(userId),
                getUserProfile(postData.userId)
              ]);
              
              if (likerUser && postOwner) {
                await addNotification(postData.userId, {
                  category: 'post_like',
                  title: 'New Like',
                  message: `${likerUser.username} liked your post.`,
                  actor: likerUser,
                  link: `/chat/profile/${postData.userId}/posts`,
                  icon: undefined
                });
              }
            } catch (notificationError) {
              console.error('Error adding like notification:', notificationError);
              // Don't throw here as the main like operation succeeded
            }
          }
        } else {
          await updateDoc(postRef, { likes: arrayRemove(userId) });
        }
      }
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  }, 3, 1000, 'Cannot like post: Please check your internet connection');
}

// Add a comment to a post
export async function addComment(postId: string, commentData: Omit<PostComment, 'id' | 'postId' | 'timestamp' | 'likes'>): Promise<void> {
  return executeWithRetry(async () => {
    try {
      // Check connectivity
      const isConnected = await checkFirebaseConnectivity();
      if (!isConnected) {
        console.log('Adding comment in offline mode - will sync when online');
      }
      
      // Get post data first to check if commenter is not the post owner
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postSnap.data();
      
      const commentsColRef = collection(db, 'posts', postId, 'comments');
      await addDoc(commentsColRef, {
        ...commentData,
        timestamp: serverTimestamp(),
        likes: [],
      });
      
      // Add notification for post comment (only if not commenting on own post)
      if (postData.userId !== commentData.userId) {
        try {
          const [commenterUser, postOwner] = await Promise.all([
            getUserProfile(commentData.userId),
            getUserProfile(postData.userId)
          ]);
          
          if (commenterUser && postOwner) {
            await addNotification(postData.userId, {
              category: 'post_comment',
              title: 'New Comment',
              message: `${commenterUser.username} commented on your post.`,
              actor: commenterUser,
              link: `/chat/profile/${postData.userId}/posts`,
              icon: undefined
            });
          }
        } catch (notificationError) {
          console.error('Error adding comment notification:', notificationError);
          // Don't throw here as the main comment operation succeeded
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, 3, 1000, 'Cannot add comment: Please check your internet connection');
}

// Toggle like on a comment
export async function toggleCommentLike(postId: string, commentId: string, userId: string): Promise<void> {
  return executeWithRetry(async () => {
    try {
      // Check connectivity
      const isConnected = await checkFirebaseConnectivity();
      if (!isConnected) {
        console.log('Toggling comment like in offline mode - will sync when online');
      }
      
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);

      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        const likes = commentData.likes || [];
        if (likes.includes(userId)) {
          await updateDoc(commentRef, { likes: arrayRemove(userId) });
        } else {
          await updateDoc(commentRef, { likes: arrayUnion(userId) });
        }
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }, 3, 1000, 'Cannot like comment: Please check your internet connection');
}
