/**
 * Block list service for managing blocked users
 */

import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { executeWithRetry } from '@/lib/network';
import type { MockUser } from '@/types';

const USERS_COLLECTION = 'users';

/**
 * Block a user
 */
export async function blockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  return executeWithRetry(async () => {
    const currentUserRef = doc(db, USERS_COLLECTION, currentUserId);
    const targetUserRef = doc(db, USERS_COLLECTION, targetUserId);
    
    // Add to current user's blocked list
    await updateDoc(currentUserRef, {
      blockedUsers: arrayUnion(targetUserId)
    });
    
    // Remove from following/followers if they were connected
    await Promise.all([
      updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
      }),
      updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId),
        following: arrayRemove(currentUserId)
      }),
      updateDoc(currentUserRef, {
        followers: arrayRemove(targetUserId)
      })
    ]);
    
    return true;
  }, 3, 1000, 'Failed to block user');
}

/**
 * Unblock a user
 */
export async function unblockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  return executeWithRetry(async () => {
    const currentUserRef = doc(db, USERS_COLLECTION, currentUserId);
    
    // Remove from blocked list
    await updateDoc(currentUserRef, {
      blockedUsers: arrayRemove(targetUserId)
    });
    
    return true;
  }, 3, 1000, 'Failed to unblock user');
}

/**
 * Get list of blocked users
 */
export async function getBlockedUsers(currentUserId: string): Promise<string[]> {
  return executeWithRetry(async () => {
    const userRef = doc(db, USERS_COLLECTION, currentUserId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return [];
    }
    
    const userData = userSnap.data();
    return userData.blockedUsers || [];
  }, 3, 1000, 'Failed to get blocked users');
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(currentUserId: string, targetUserId: string): Promise<boolean> {
  return executeWithRetry(async () => {
    const blockedUsers = await getBlockedUsers(currentUserId);
    return blockedUsers.includes(targetUserId);
  }, 3, 1000, 'Failed to check if user is blocked');
}
