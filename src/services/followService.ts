import { db } from '@/lib/firebase/client';
import { doc, updateDoc, arrayUnion, arrayRemove, writeBatch, getDoc } from 'firebase/firestore';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { sendFriendRequest } from './friendRequestService';
import { addNotification } from './notificationService';
import { getUserProfile } from './userService';

export async function updateUserFollowStatus(currentUserId: string, targetUserId: string, action: 'follow' | 'unfollow'): Promise<void> {
    if (currentUserId === targetUserId) {
        throw new Error("Users cannot follow themselves.");
    }
    
    // Check if the target user is private
    const targetUserRef = doc(db, 'users', targetUserId);
    const targetUserSnap = await getDoc(targetUserRef);
    
    if (!targetUserSnap.exists()) {
        throw new Error("Target user not found.");
    }
    
    const targetUserData = targetUserSnap.data();
    
    // For private accounts, we should not use this function directly
    // Instead, use the friend request system
    if (targetUserData.isPrivate && action === 'follow') {
        throw new Error("Cannot follow private account directly. Use sendFriendRequest instead.");
    }
    
    const currentUserRef = doc(db, 'users', currentUserId);
    const batch = writeBatch(db);

    if (action === 'follow') {
        // Current user starts following the target user
        batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
        // Target user gains a follower
        batch.update(targetUserRef, { followers: arrayUnion(currentUserId) });
        
        // Add notification for new follower
        try {
            const [followerUser, targetUser] = await Promise.all([
                getUserProfile(currentUserId),
                getUserProfile(targetUserId)
            ]);
            
            if (followerUser && targetUser) {
                await addNotification(targetUserId, {
                    category: 'follow',
                    title: 'New Follower',
                    message: `${followerUser.username} started following you.`,
                    actor: followerUser,
                    link: `/chat/profile/${currentUserId}`,
                    icon: undefined
                });
            }
        } catch (notificationError) {
            console.error('Error adding follow notification:', notificationError);
            // Don't throw here as the main follow operation succeeded
        }
    } else { // unfollow
        // Current user unfollows the target user
        batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
        // Target user loses a follower
        batch.update(targetUserRef, { followers: arrayRemove(currentUserId) });
    }

    await batch.commit();
}

/**
 * Send a follow request to another user
 */
export async function sendFollowRequest(fromUserId: string, toUserId: string): Promise<void> {
  if (fromUserId === toUserId) {
    throw new Error("Users cannot send follow requests to themselves.");
  }

  const requestsRef = collection(db, 'followRequests');
  
  // Check if request already exists
  const q = query(
    requestsRef,
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', toUserId)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    throw new Error("Follow request already sent.");
  }
  
  // Create the request
  await addDoc(requestsRef, {
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: serverTimestamp()
  });
}

/**
 * Get a count of pending follow requests for a user
 */
export async function getPendingRequestsCount(userId: string): Promise<number> {
  const requestsRef = collection(db, 'followRequests');
  const q = query(
    requestsRef,
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}
