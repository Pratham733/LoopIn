import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, setDoc, getDoc, documentId, orderBy as firestoreOrderBy, limit as firestoreLimit, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { Conversation, Message, mockConversation } from '@/models/Chat';
import { User } from '@/models/User';
import { executeWithRetry, checkFirebaseConnectivity } from '@/lib/network';
import { queueOfflineAction } from '@/lib/offlineQueue';

/**
 * Creates a new conversation between users
 * @param participants Array of user IDs
 * @param type 'direct' for 1-1 chats, 'group' for group chats
 * @param name Optional name for group chats
 * @param avatar Optional avatar for group chats
 * @param createdBy User ID who created the conversation
 */
export async function createConversation(
  participants: string[],
  type: 'direct' | 'group',
  name?: string,
  avatar?: string,
  createdBy?: string
) {
  return executeWithRetry(async () => {
    // Check connectivity
    const isConnected = await checkFirebaseConnectivity();
    if (!isConnected) {
      queueOfflineAction('createConversation', { participants, type, name, avatar, createdBy });
      return 'queued-offline';
    }
    
    // For direct messages, check if conversation already exists
    if (type === 'direct' && participants.length === 2) {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('type', '==', 'direct'),
        where('participants', 'array-contains', participants[0])
      );
      
      const querySnapshot = await getDocs(q);
      let existingConversation: { id: string; [key: string]: any } | null = null;
      
      // Manually check for both participants since Firestore can't do multiple array-contains queries
      querySnapshot.forEach((doc) => {
        const convo = doc.data();
        if (convo.participants.includes(participants[1])) {
          existingConversation = { id: doc.id, ...convo };
        }
      });

      if (existingConversation) {
        return existingConversation;
      }
    }
    
    // Create new conversation
    const newConversationRef = doc(collection(db, 'conversations'));
    const now = new Date().toISOString();
    const conversationData: Omit<Conversation, 'id'> = {
      type,
    participants,
    name: type === 'group' ? name : undefined,
    avatar: type === 'group' ? avatar : undefined,
    createdBy: createdBy || participants[0],
    admins: type === 'group' ? [createdBy || participants[0]] : [],
    createdAt: now,
    updatedAt: now
  };
  
  await setDoc(newConversationRef, conversationData);
    return {
    id: newConversationRef.id,
    ...conversationData
  };
  }, 3, 1000, 'Cannot create conversation: Please check your internet connection');
}

/**
 * Gets all conversations for a specific user
 * @param userId The user ID to get conversations for
 */
export async function getUserConversations(userId: string) {
  return executeWithRetry(async () => {
    // Check connectivity
    const isConnected = await checkFirebaseConnectivity();
    if (!isConnected) {
      console.warn('Fetching conversations in offline mode - using cached data');
    }
    
    // Query Firestore for conversations
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef, 
      where('participants', 'array-contains', userId),
      // Note: Firestore doesn't support complex sorting in queries
      // If sorting is needed, sort the results in memory after fetching
    );
    
    const querySnapshot = await getDocs(q);
  const conversations: Array<{id: string; [key: string]: any}> = [];
  
  querySnapshot.forEach((doc) => {
    conversations.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  // Get participant details for each conversation
  const populatedConversations = await Promise.all(
    conversations.map(async (conv) => {      // Get user details for each participant
      const usersRef = collection(db, 'users');
      const participantQueries = conv.participants.map((pid: string) => getDoc(doc(usersRef, pid)));
      const participantSnapshots = await Promise.all(participantQueries);
      
      const participantDetails = participantSnapshots
        .filter(snap => snap.exists())
        .map(snap => ({
          id: snap.id,
          ...snap.data()
        }));
      
      // If there's a lastMessage, fetch it
      let lastMessageData: any = null;
      if (conv.lastMessage) {
        const messageDoc = await getDoc(doc(db, 'messages', conv.lastMessage));
        if (messageDoc.exists()) {
          lastMessageData = {
            id: messageDoc.id,
            ...messageDoc.data()
          };
        }
      }
      
      if (typeof conv === 'object' && conv !== null) {
        return {
          ...conv,
          participants: participantDetails,
          lastMessageData: lastMessageData || undefined
        };
      }
    })
  );
  // Sort by updatedAt (most recent first)
  populatedConversations.sort((a: any, b: any) => {
    return new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime();
  });
  
  return populatedConversations;
  }, 3, 1000, 'Unable to load conversations: Please check your internet connection');
}

/**
 * Sends a message in a conversation
 * @param conversationId The conversation ID
 * @param senderId The sender's user ID
 * @param content The message content
 * @param attachments Optional attachments
 * @param replyTo Optional message ID being replied to
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  attachments?: Array<{
    type: 'image' | 'video' | 'file' | 'audio';
    url: string;
    thumbnail?: string;
    size?: number;
    name?: string;
    mimeType?: string;
  }>,
  replyTo?: string
) {
  return executeWithRetry(async () => {
    // Check connectivity first
    const isConnected = await checkFirebaseConnectivity();
    if (!isConnected) {
      queueOfflineAction('sendMessage', { conversationId, senderId, content, attachments, replyTo });
      return 'queued-offline';
    }
    
    // Check if the conversation exists
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      throw new Error('Conversation not found');
    }
    
    const conversation = conversationSnap.data();
    
    // Check if the sender is a participant in this conversation
    if (!conversation.participants.includes(senderId)) {
      throw new Error('User is not a participant in this conversation');
    }
    
    // Create the new message
    const newMessageRef = doc(collection(db, 'messages'));
    const now = new Date().toISOString();
    
    const messageData: Omit<Message, 'id'> = {
      conversationId,
      senderId,
      content,
      attachments,
      replyTo,
      readBy: [senderId], // Mark as read by the sender
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(newMessageRef, messageData);
    
    // Update the conversation's lastMessage and updatedAt
    await setDoc(conversationRef, {
      lastMessage: newMessageRef.id,
      updatedAt: now
    }, { merge: true });
    
    // Return the created message with its ID
    return {
      id: newMessageRef.id,
      ...messageData
    };
  }, 3, 1000, 'Cannot send message: Please check your internet connection');
}

/**
 * Gets messages from a conversation
 * @param conversationId The conversation ID
 * @param limit Number of messages to return
 * @param before Message ID to get messages before (for pagination)
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  before?: string
) {
  // Get reference to messages collection
  const messagesRef = collection(db, 'messages');
  let q;
  
  // If we're paginating using a 'before' message ID
  if (before) {
    const beforeMessageRef = doc(db, 'messages', before);
    const beforeMessageSnap = await getDoc(beforeMessageRef);
    
    if (beforeMessageSnap.exists()) {
      const beforeMessageData = beforeMessageSnap.data();
        // Query messages before this timestamp
      q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('createdAt', '<', beforeMessageData.createdAt),
        // Note: orderBy must include all fields used in inequality filters
        // like the 'where createdAt < x' above
        firestoreOrderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
    } else {      // If the before message doesn't exist, just get the most recent messages
      q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        firestoreOrderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
    }
  } else {    // No pagination, just get the most recent messages
    q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      firestoreOrderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );
  }
  
  const messageSnapshots = await getDocs(q);
  const messages: Array<{id: string; [key: string]: any}> = [];
  
  messageSnapshots.forEach(doc => {
    messages.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  // Get sender details for each message
  const populatedMessages = await Promise.all(
    messages.map(async (message) => {
      // Get sender info
      if (message.senderId) {
        const senderDoc = await getDoc(doc(db, 'users', message.senderId));
        if (senderDoc.exists()) {
          message.sender = {
            id: senderDoc.id,
            ...senderDoc.data()
          };
        }
      }
      
      // Get reply-to message if it exists
      if (message.replyTo) {
        const replyDoc = await getDoc(doc(db, 'messages', message.replyTo));
        if (replyDoc.exists()) {
          message.replyToMessage = {
            id: replyDoc.id,
            ...replyDoc.data()
          };
        }
      }
      
      return message;
    })
  );
  
  // Reverse to get chronological order (oldest first)
  return populatedMessages.reverse();
}

/**
 * Marks messages as read for a user
 * @param conversationId The conversation ID
 * @param userId The user ID marking messages as read
 */
export async function markMessagesAsRead(conversationId: string, userId: string) {
  // Get all unread messages in the conversation
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    where('senderId', '!=', userId)
  );
  
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  let updateCount = 0;
  
  // For each message that doesn't have the user in readBy, add them
  querySnapshot.forEach(messageDoc => {
    const messageData = messageDoc.data();
    const readBy = messageData.readBy || [];
    
    if (!readBy.includes(userId)) {
      const messageRef = doc(db, 'messages', messageDoc.id);
      batch.update(messageRef, {
        readBy: [...readBy, userId],
        updatedAt: new Date().toISOString()
      });
      updateCount++;
    }
  });
  
  // Only commit batch if we have updates
  if (updateCount > 0) {
    await batch.commit();
  }
  
  return { success: true, messagesMarkedRead: updateCount };
}

/**
 * Deletes a message
 * @param messageId The message ID to delete
 * @param userId The user ID requesting deletion
 * @param forEveryone If true, marks the message as deleted for all users
 */
export async function deleteMessage(
  messageId: string,
  userId: string,
  forEveryone = false
) {
  // Check if the message exists
  const messageRef = doc(db, 'messages', messageId);
  const messageSnap = await getDoc(messageRef);
  
  if (!messageSnap.exists()) {
    throw new Error('Message not found');
  }
  
  const messageData = messageSnap.data();
  
  if (forEveryone) {
    // Only the sender can delete for everyone
    if (messageData.senderId !== userId) {
      throw new Error('Only the sender can delete a message for everyone');
    }
    
    // Option 1: Mark as deleted with a timestamp
    await updateDoc(messageRef, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Option 2: Actually delete the message (uncomment if preferred)
    // await deleteDoc(messageRef);
  } else {
    // Delete just for this user by adding to deletedFor array
    const deletedFor = messageData.deletedFor || [];
    
    if (!deletedFor.includes(userId)) {
      await updateDoc(messageRef, {
        deletedFor: [...deletedFor, userId],
        updatedAt: new Date().toISOString()
      });
    }
  }
  
  return { success: true };
}

/**
 * Gets the count of unread messages for a user across all conversations
 * @param userId The user ID
 * @returns The number of unread messages
 */
export async function getUnreadMessagesCount(userId: string): Promise<number> {
  // Get all conversations for the user
  const userConversationsRef = collection(db, 'userConversations');
  const q = query(userConversationsRef, where('userId', '==', userId));
  const userConversationsSnapshot = await getDocs(q);
  
  if (userConversationsSnapshot.empty) {
    return 0;
  }

  // Get all conversation IDs the user is part of
  const conversationIds = userConversationsSnapshot.docs.map(doc => doc.data().conversationId);
  
  let totalUnreadCount = 0;
  
  // Process in batches of 10 conversations (Firestore limitation for 'in' query)
  for (let i = 0; i < conversationIds.length; i += 10) {
    const batchIds = conversationIds.slice(i, i + 10);
    
    // Query for unread messages in these conversations
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('conversationId', 'in', batchIds),
      where('senderId', '!=', userId)
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    
    // Count messages where the user is not in readBy
    messagesSnapshot.forEach(messageDoc => {
      const messageData = messageDoc.data();
      const readBy = messageData.readBy || [];
      if (!readBy.includes(userId)) {
        totalUnreadCount++;
      }
    });
  }
  
  return totalUnreadCount;
}
