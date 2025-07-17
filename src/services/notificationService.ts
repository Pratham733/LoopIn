import { db } from '@/lib/firebase/client';
import type { NotificationType } from '@/types';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, writeBatch, doc, updateDoc, onSnapshot } from 'firebase/firestore';

/**
 * NOTIFICATION SYSTEM OVERVIEW
 * 
 * This service handles all notifications in the application. The following notification types are supported:
 * 
 * 1. FOLLOW_REQUEST - When someone sends a friend/follow request to a private account
 *    - Triggered by: sendFriendRequest() in friendRequestService.ts
 *    - Recipient: The private account owner
 * 
 * 2. FOLLOW - When someone follows you or accepts your follow request
 *    - Triggered by: updateUserFollowStatus() in followService.ts (new followers)
 *    - Triggered by: acceptFriendRequest() in friendRequestService.ts (request accepted)
 *    - Triggered by: rejectFriendRequest() in friendRequestService.ts (request declined)
 *    - Recipient: The person being followed or the request sender
 * 
 * 3. POST_LIKE - When someone likes your post
 *    - Triggered by: togglePostLike() in postService.ts
 *    - Recipient: The post owner (not triggered for own posts)
 * 
 * 4. POST_COMMENT - When someone comments on your post
 *    - Triggered by: addComment() in postService.ts
 *    - Recipient: The post owner (not triggered for own comments)
 * 
 * 5. POST_TAG - When someone tags you in their post
 *    - Triggered by: addPost() in postService.ts
 *    - Recipient: The tagged user (not triggered for self-tagging)
 * 
 * 6. MESSAGE - When someone shares a post with you via DM
 *    - Triggered by: SendPostInDMDialog component
 *    - Recipient: The person receiving the shared post
 * 
 * 7. MESSAGE_REQUEST - When someone who doesn't follow you tries to send you a message
 *    - Triggered by: createConversation() in conversationService.ts
 *    - Recipient: The person being messaged
 * 
 * 8. SYSTEM - For system-wide notifications (not currently used)
 * 
 * All notifications include:
 * - Actor: The user who triggered the notification
 * - Link: Where to navigate when clicking the notification
 * - Timestamp: When the notification was created
 * - Read status: Whether the user has seen the notification
 */

// Add a new notification for a specific user
export async function addNotification(
  userId: string,
  notificationData: Omit<NotificationType, 'id' | 'timestamp' | 'isRead'>
): Promise<void> {
  const notificationsColRef = collection(db, 'users', userId, 'notifications');

  // Remove undefined fields (e.g., icon)
  const cleanData = Object.fromEntries(
    Object.entries(notificationData).filter(([_, v]) => v !== undefined)
  );

  await addDoc(notificationsColRef, {
    ...cleanData,
    isRead: false,
    timestamp: serverTimestamp(),
  });
}

// Fetch all notifications for a specific user
export async function getNotificationsForUser(userId: string): Promise<NotificationType[]> {
  const notificationsColRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsColRef, orderBy('timestamp', 'desc'));
  
  const querySnapshot = await getDocs(q);
  
  const notifications: NotificationType[] = querySnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
    } as NotificationType;
  });

  return notifications;
}

// Get count of unread notifications for a user
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const notificationsColRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsColRef, where('isRead', '==', false));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

// Mark a specific notification as read
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
  await updateDoc(notificationRef, { isRead: true });
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notificationsColRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsColRef, where('isRead', '==', false));
  
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  querySnapshot.docs.forEach(docSnap => {
    batch.update(docSnap.ref, { isRead: true });
  });
  
  await batch.commit();
}

// Mark notifications as read by category and actor
export async function markNotificationsAsReadByCategoryAndActor(
  userId: string, 
  category: string, 
  actorId: string
): Promise<void> {
  const notificationsColRef = collection(db, 'users', userId, 'notifications');
  const q = query(
    notificationsColRef, 
    where('category', '==', category),
    where('actor.id', '==', actorId),
    where('isRead', '==', false)
  );
  
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  querySnapshot.docs.forEach(docSnap => {
    batch.update(docSnap.ref, { isRead: true });
  });
  
  await batch.commit();
}

// Subscribe to real-time notifications updates
export function subscribeToNotifications(
  userId: string,
  onUpdate: (notifications: NotificationType[]) => void,
  onError: (error: Error) => void
): () => void {
  const notificationsColRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsColRef, orderBy('timestamp', 'desc'));
  
  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const notifications: NotificationType[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as NotificationType;
      });
      
      onUpdate(notifications);
    },
    (error) => {
      onError(error);
    }
  );
  
  return unsubscribe;
}
