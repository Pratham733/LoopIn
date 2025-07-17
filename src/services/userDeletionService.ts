import { 
  doc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  updateDoc, 
  arrayRemove 
} from 'firebase/firestore';
import { deleteUser as deleteAuthUser } from 'firebase/auth';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { db, auth, storage } from '@/lib/firebase';

/**
 * Deletes a user account and all associated data
 * @param userId - The ID of the user to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // 1. Delete user's posts
    const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    
    for (const postDoc of postsSnapshot.docs) {
      // Delete post document
      batch.delete(postDoc.ref);
      
      // Delete post media from storage
      const post = postDoc.data();
      if (post.media) {
        for (const media of post.media) {
          try {
            const mediaRef = ref(storage, media.url);
            await deleteObject(mediaRef);
          } catch (error) {
            console.warn('Failed to delete media:', error);
          }
        }
      }
    }

    // 2. Delete user's comments on other posts
    const commentsQuery = query(collection(db, 'comments'), where('userId', '==', userId));
    const commentsSnapshot = await getDocs(commentsQuery);
    
    for (const commentDoc of commentsSnapshot.docs) {
      batch.delete(commentDoc.ref);
    }

    // 3. Delete user's conversations
    const conversationsQuery = query(
      collection(db, 'conversations'), 
      where('participants', 'array-contains', userId)
    );
    const conversationsSnapshot = await getDocs(conversationsQuery);
    
    for (const conversationDoc of conversationsSnapshot.docs) {
      // Delete all messages in the conversation
      const messagesQuery = query(
        collection(db, 'messages'), 
        where('conversationId', '==', conversationDoc.id)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      
      for (const messageDoc of messagesSnapshot.docs) {
        batch.delete(messageDoc.ref);
      }
      
      // Delete conversation document
      batch.delete(conversationDoc.ref);
    }

    // 4. Delete user's messages
    const messagesQuery = query(collection(db, 'messages'), where('senderId', '==', userId));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    for (const messageDoc of messagesSnapshot.docs) {
      batch.delete(messageDoc.ref);
    }

    // 5. Remove user from other users' following/followers lists
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Remove from following lists
      if (userData.following && userData.following.includes(userId)) {
        batch.update(userDoc.ref, {
          following: arrayRemove(userId)
        });
      }
      
      // Remove from followers lists
      if (userData.followers && userData.followers.includes(userId)) {
        batch.update(userDoc.ref, {
          followers: arrayRemove(userId)
        });
      }
      
      // Remove from blocked users lists
      if (userData.blockedUsers && userData.blockedUsers.includes(userId)) {
        batch.update(userDoc.ref, {
          blockedUsers: arrayRemove(userId)
        });
      }
      
      // Remove from pending follow requests
      if (userData.pendingFollowRequests && userData.pendingFollowRequests.includes(userId)) {
        batch.update(userDoc.ref, {
          pendingFollowRequests: arrayRemove(userId)
        });
      }
    }

    // 6. Delete user's profile images from storage
    try {
      const userProfileRef = ref(storage, `profile-images/${userId}`);
      const profileFiles = await listAll(userProfileRef);
      
      for (const fileRef of profileFiles.items) {
        await deleteObject(fileRef);
      }
    } catch (error) {
      console.warn('Failed to delete profile images:', error);
    }

    // 7. Delete user's notifications
    const notificationsQuery = query(
      collection(db, 'notifications'), 
      where('userId', '==', userId)
    );
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    for (const notificationDoc of notificationsSnapshot.docs) {
      batch.delete(notificationDoc.ref);
    }

    // 8. Delete user's friend requests
    const friendRequestsQuery = query(
      collection(db, 'friendRequests'), 
      where('fromUserId', '==', userId)
    );
    const friendRequestsSnapshot = await getDocs(friendRequestsQuery);
    
    for (const requestDoc of friendRequestsSnapshot.docs) {
      batch.delete(requestDoc.ref);
    }

    // Also delete requests to this user
    const requestsToUserQuery = query(
      collection(db, 'friendRequests'), 
      where('toUserId', '==', userId)
    );
    const requestsToUserSnapshot = await getDocs(requestsToUserQuery);
    
    for (const requestDoc of requestsToUserSnapshot.docs) {
      batch.delete(requestDoc.ref);
    }

    // 9. Delete user document
    const userDocRef = doc(db, 'users', userId);
    batch.delete(userDocRef);

    // Commit all deletions
    await batch.commit();

    // 10. Delete from Firebase Auth (if current user is deleting their own account)
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await deleteAuthUser(auth.currentUser);
    }

    console.log('User account deleted successfully');
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}

/**
 * Soft delete a user account (mark as deleted but keep data)
 * @param userId - The ID of the user to soft delete
 * @returns Promise that resolves when soft deletion is complete
 */
export async function softDeleteUserAccount(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    await updateDoc(userDocRef, {
      deleted: true,
      deletedAt: new Date().toISOString(),
      username: `[deleted_user_${userId.substring(0, 8)}]`,
      email: `deleted_${userId}@deleted.com`,
      profileImage: null,
      avatar: null,
      bio: '[This account has been deleted]',
      fullName: '[Deleted User]'
    });

    console.log('User account soft deleted successfully');
  } catch (error) {
    console.error('Error soft deleting user account:', error);
    throw error;
  }
}

/**
 * Check if a user can be deleted (admin check, etc.)
 * @param userId - The ID of the user to check
 * @param currentUserId - The ID of the current user attempting deletion
 * @returns Promise that resolves to boolean indicating if deletion is allowed
 */
export async function canDeleteUser(userId: string, currentUserId: string): Promise<boolean> {
  try {
    // Users can always delete their own account
    if (userId === currentUserId) {
      return true;
    }

    // Check if current user is an admin
    const currentUserDoc = await getDocs(
      query(collection(db, 'users'), where('id', '==', currentUserId))
    );
    
    if (currentUserDoc.docs.length > 0) {
      const currentUser = currentUserDoc.docs[0].data();
      return currentUser.role === 'admin' || currentUser.isAdmin === true;
    }

    return false;
  } catch (error) {
    console.error('Error checking delete permissions:', error);
    return false;
  }
}
