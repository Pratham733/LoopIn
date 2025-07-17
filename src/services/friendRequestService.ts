/**
 * Friend request service for handling follow requests for private accounts
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { executeWithRetry } from '@/lib/network';
import type { MockUser } from '@/types';
import { addNotification } from './notificationService';
import { getUserProfile } from './userService';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const FRIEND_REQUESTS_COLLECTION = 'friendRequests';
const USERS_COLLECTION = 'users';

/**
 * Send a friend request to a private account
 */
export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
  return executeWithRetry(async () => {
    const requestId = `${fromUserId}_${toUserId}`;
    
    // Check if request already exists
    const existingRequestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    const existingRequest = await getDoc(existingRequestRef);
    
    if (existingRequest.exists()) {
      throw new Error('Friend request already sent');
    }
    
    // Get the sender's profile for the notification
    const fromUser = await getUserProfile(fromUserId);
    if (!fromUser) {
      throw new Error('Sender profile not found');
    }
    
    // Create new friend request
    await setDoc(existingRequestRef, {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Add to user's pending requests
    const toUserRef = doc(db, USERS_COLLECTION, toUserId);
    await updateDoc(toUserRef, {
      pendingFollowRequests: arrayUnion(fromUserId)
    });
    
    // Create notification for the recipient
    await addNotification(toUserId, {
      category: 'follow_request',
      title: 'New Follow Request',
      message: `${fromUser.username} has requested to follow you.`,
      actor: fromUser,
      link: `/chat/profile/${fromUserId}`,
      icon: undefined // Will be set by the notification component
    });
    
    return true;
  }, 3, 1000, 'Failed to send friend request');
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
  return executeWithRetry(async () => {
    const requestId = `${fromUserId}_${toUserId}`;
    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    
    // Get both users' profiles for notifications
    const [fromUser, toUser] = await Promise.all([
      getUserProfile(fromUserId),
      getUserProfile(toUserId)
    ]);
    
    if (!fromUser || !toUser) {
      throw new Error('User profiles not found');
    }
    
    // Update request status
    await updateDoc(requestRef, {
      status: 'accepted',
      updatedAt: serverTimestamp()
    });
    
    // Update both users' follower/following lists
    const fromUserRef = doc(db, USERS_COLLECTION, fromUserId);
    const toUserRef = doc(db, USERS_COLLECTION, toUserId);
    
    await Promise.all([
      updateDoc(fromUserRef, {
        following: arrayUnion(toUserId)
      }),
      updateDoc(toUserRef, {
        followers: arrayUnion(fromUserId),
        pendingFollowRequests: arrayRemove(fromUserId)
      })
    ]);
    
    // Create notification for the sender that their request was accepted
    await addNotification(fromUserId, {
      category: 'follow',
      title: 'Follow Request Accepted',
      message: `${toUser.username} accepted your follow request.`,
      actor: toUser,
      link: `/chat/profile/${toUserId}`,
      icon: undefined
    });
    
    return true;
  }, 3, 1000, 'Failed to accept friend request');
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
  return executeWithRetry(async () => {
    const requestId = `${fromUserId}_${toUserId}`;
    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    
    // Get both users' profiles for notifications
    const [fromUser, toUser] = await Promise.all([
      getUserProfile(fromUserId),
      getUserProfile(toUserId)
    ]);
    
    if (!fromUser || !toUser) {
      throw new Error('User profiles not found');
    }
    
    // Update request status
    await updateDoc(requestRef, {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });
    
    // Remove from pending requests
    const toUserRef = doc(db, USERS_COLLECTION, toUserId);
    await updateDoc(toUserRef, {
      pendingFollowRequests: arrayRemove(fromUserId)
    });
    
    // Create notification for the sender that their request was rejected
    await addNotification(fromUserId, {
      category: 'follow',
      title: 'Follow Request Declined',
      message: `${toUser.username} declined your follow request.`,
      actor: toUser,
      link: `/chat/profile/${toUserId}`,
      icon: undefined
    });
    
    return true;
  }, 3, 1000, 'Failed to reject friend request');
}

/**
 * Cancel a friend request
 */
export async function cancelFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
  return executeWithRetry(async () => {
    const requestId = `${fromUserId}_${toUserId}`;
    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    
    // Delete the request
    await deleteDoc(requestRef);
    
    // Remove from pending requests
    const toUserRef = doc(db, USERS_COLLECTION, toUserId);
    await updateDoc(toUserRef, {
      pendingFollowRequests: arrayRemove(fromUserId)
    });
    
    return true;
  }, 3, 1000, 'Failed to cancel friend request');
}

/**
 * Get pending friend requests for a user
 */
export async function getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
  return executeWithRetry(async () => {
    const q = query(
      collection(db, FRIEND_REQUESTS_COLLECTION),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    const requests: FriendRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return requests;
  }, 3, 1000, 'Failed to get friend requests');
}

/**
 * Check if a friend request exists between two users
 */
export async function checkFriendRequestStatus(fromUserId: string, toUserId: string): Promise<'none' | 'pending' | 'accepted' | 'rejected'> {
  return executeWithRetry(async () => {
    const requestId = `${fromUserId}_${toUserId}`;
    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      return 'none';
    }
    
    return requestSnap.data().status;
  }, 3, 1000, 'Failed to check friend request status');
}
