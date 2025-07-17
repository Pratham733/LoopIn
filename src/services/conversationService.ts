// conversationService.ts - Handle conversation and message persistence
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc,
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { ChatMessage, Conversation as ConversationType, MockUser } from '@/types';
import { executeWithRetry, checkFirebaseConnectivity } from '@/lib/network';
import { queueOfflineAction } from '@/lib/offlineQueue';
import { getUserProfile } from './userService';
import { addNotification } from './notificationService';

// Collections
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

/**
 * Create a new conversation between users
 */
export async function createConversation(
    participantIds: string[], 
    isGroup: boolean = false, 
    groupName?: string
): Promise<string> {
    return executeWithRetry(async () => {
        const isConnected = await checkFirebaseConnectivity();
        if (!isConnected) {
            queueOfflineAction('createConversation', { participantIds, isGroup, groupName });
            return 'queued-offline';
        }

        const conversationData = {
            participantIds,
            isGroup,
            name: groupName || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: null,
            lastMessageTime: null,
            unreadCounts: participantIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
            isMuted: false,
            isPinned: false,
            adminIds: isGroup ? [participantIds[0]] : [],
            coAdminIds: []
        };

        const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversationData);
        console.log('Conversation created with ID:', docRef.id);
        
        // Check for non-follower messaging notifications (only for direct messages)
        if (!isGroup && participantIds.length === 2) {
            try {
                const [user1, user2] = await Promise.all([
                    getUserProfile(participantIds[0]),
                    getUserProfile(participantIds[1])
                ]);
                
                if (user1 && user2) {
                    // Check if user1 follows user2 (the conversation initiator follows the recipient)
                    const user1FollowsUser2 = user1.following.includes(user2.id);
                    
                    if (!user1FollowsUser2) {
                        // Send notification to user2 that someone who doesn't follow them is trying to message
                        await addNotification(user2.id, {
                            category: 'message_request',
                            title: 'New Message Request',
                            message: `${user1.username} wants to send you a message but doesn't follow you.`,
                            actor: user1,
                            link: `/chat/conversations/${docRef.id}`,
                            icon: undefined
                        });
                    }
                }
            } catch (notificationError) {
                console.error('Error sending message request notification:', notificationError);
                // Don't throw here as the main conversation creation succeeded
            }
        }
        
        return docRef.id;
    }, 3, 1000, 'Failed to create conversation');
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<ConversationType[]> {
    return executeWithRetry(async () => {
        const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
        const q = query(
            conversationsRef,
            where('participantIds', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const conversations: ConversationType[] = [];
        
        for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();
              // Convert Firestore timestamps to dates
            const conversation: ConversationType = {
                id: docSnapshot.id,
                participants: [], // Will be populated separately if needed
                participantIds: data.participantIds || [], // Include participantIds for direct access
                lastMessage: data.lastMessage ? {
                    ...data.lastMessage,
                    timestamp: data.lastMessage.timestamp?.toDate ? data.lastMessage.timestamp.toDate() : new Date(data.lastMessage.timestamp || Date.now())
                } : undefined,
                unreadCount: data.unreadCounts?.[userId] || 0,
                name: data.name,
                isGroup: data.isGroup || false,
                isMuted: data.isMuted || false,
                isPinned: data.isPinned || false,
                adminIds: data.adminIds || [],
                coAdminIds: data.coAdminIds || []
            };
            
            conversations.push(conversation);
        }
        
        return conversations;
    }, 3, 1000, 'Failed to fetch conversations');
}

/**
 * Get a specific conversation by ID
 */
export async function getConversation(conversationId: string): Promise<ConversationType | null> {
    return executeWithRetry(async () => {
        const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
        const conversationSnap = await getDoc(conversationRef);
        
        if (!conversationSnap.exists()) {
            return null;
        }
          const data = conversationSnap.data();
        return {
            id: conversationSnap.id,
            participants: [], // Will be populated separately if needed
            participantIds: data.participantIds || [], // Include participantIds for direct access
            lastMessage: data.lastMessage ? {
                ...data.lastMessage,
                timestamp: data.lastMessage.timestamp?.toDate ? data.lastMessage.timestamp.toDate() : new Date(data.lastMessage.timestamp || Date.now())
            } : undefined,
            unreadCount: 0, // Will be calculated based on current user
            name: data.name,
            isGroup: data.isGroup || false,
            isMuted: data.isMuted || false,
            isPinned: data.isPinned || false,
            adminIds: data.adminIds || [],
            coAdminIds: data.coAdminIds || []
        };
    }, 3, 1000, 'Failed to fetch conversation');
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    content: string | any,
    messageType: 'text' | 'image' | 'file' | 'profile_share' | 'location_share' = 'text'
): Promise<string> {
    return executeWithRetry(async () => {
        const isConnected = await checkFirebaseConnectivity();
        if (!isConnected) {
            queueOfflineAction('sendMessage', { conversationId, senderId, content, messageType });
            return 'queued-offline';
        }

        // Create message document
        const messageData = {
            conversationId,
            senderId,
            content: messageType === 'text' ? content : content,
            timestamp: serverTimestamp(),
            isRead: false,
            type: messageType
        };

        // Add message to messages collection
        const messageRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);
        
        // Update conversation with last message info
        const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
        await updateDoc(conversationRef, {
            lastMessage: {
                id: messageRef.id,
                content: messageType === 'text' ? content : `[${messageType}]`,
                senderId,
                timestamp: serverTimestamp()
            },
            lastMessageTime: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        console.log('Message sent with ID:', messageRef.id);
        return messageRef.id;
    }, 3, 1000, 'Failed to send message');
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
    conversationId: string, 
    limitCount: number = 50
): Promise<ChatMessage[]> {
    return executeWithRetry(async () => {
        const messagesRef = collection(db, MESSAGES_COLLECTION);
        const q = query(
            messagesRef,
            where('conversationId', '==', conversationId),
            orderBy('timestamp', 'asc'),
            limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const messages: ChatMessage[] = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const message: ChatMessage = {
                id: doc.id,
                senderId: data.senderId,
                conversationId: data.conversationId,
                content: data.content,
                timestamp: data.timestamp?.toDate() || new Date(),
                isRead: data.isRead || false
            };
            messages.push(message);
        });
        
        return messages;
    }, 3, 1000, 'Failed to fetch messages');
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    return executeWithRetry(async () => {
        const isConnected = await checkFirebaseConnectivity();
        if (!isConnected) {
            console.warn('Cannot mark messages as read while offline');
            return;
        }

        // Update unread count in conversation
        const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
        await updateDoc(conversationRef, {
            [`unreadCounts.${userId}`]: 0
        });
    }, 3, 1000, 'Failed to mark messages as read');
}

/**
 * Listen to real-time messages for a conversation
 */
export function subscribeToMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void,
    errorCallback?: (error: Error) => void
) {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, 
        (querySnapshot) => {
            const messages: ChatMessage[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const message: ChatMessage = {
                    id: doc.id,
                    senderId: data.senderId,
                    conversationId: data.conversationId,
                    content: data.content,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    isRead: data.isRead || false
                };
                messages.push(message);
            });
            callback(messages);
        },
        (error) => {
            console.error('Error listening to messages:', error);
            if (errorCallback) {
                errorCallback(error);
            }
        }
    );
}

/**
 * Find or create a direct conversation between two users
 */
export async function findOrCreateDirectConversation(user1Id: string, user2Id: string, options?: { findOnly?: boolean }): Promise<string | null> {
    return executeWithRetry(async () => {
        console.log('=== FIND OR CREATE CONVERSATION ===');
        console.log('Looking for conversation between:', user1Id, 'and', user2Id);
        
        // Look for existing conversation between these two users
        const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
        const q = query(
            conversationsRef,
            where('participantIds', 'array-contains', user1Id),
            where('isGroup', '==', false)
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Found', querySnapshot.size, 'conversations with user1Id:', user1Id);
        
        // Check if any conversation includes both users
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            console.log('Checking conversation', doc.id, 'with participants:', data.participantIds);
            if (data.participantIds.includes(user2Id)) {
                console.log('Found existing conversation:', doc.id);
                return doc.id;
            }
        }
        
        // If findOnly, do not create a new conversation
        if (options && options.findOnly) {
            return null;
        }
        // No existing conversation found, create a new one
        console.log('No existing conversation found, creating new one');
        const newConversationId = await createConversation([user1Id, user2Id], false);
        console.log('Created new conversation:', newConversationId);
        return newConversationId;
    }, 3, 1000, 'Failed to find or create conversation');
}

/**
 * Delete a message (soft delete by marking as deleted)
 */
export async function deleteMessage(messageId: string): Promise<void> {
    return executeWithRetry(async () => {
        const isConnected = await checkFirebaseConnectivity();
        if (!isConnected) {
            throw new Error('Cannot delete message while offline');
        }

        const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
        await updateDoc(messageRef, {
            content: '[Message deleted]',
            isDeleted: true,
            deletedAt: serverTimestamp()
        });
    }, 3, 1000, 'Failed to delete message');
}

/**
 * Update conversation settings
 */
export async function updateConversationSettings(
    conversationId: string,
    settings: {
        isMuted?: boolean;
        isPinned?: boolean;
        name?: string;
    }
): Promise<void> {
    return executeWithRetry(async () => {
        const isConnected = await checkFirebaseConnectivity();
        if (!isConnected) {
            throw new Error('Cannot update conversation settings while offline');
        }

        const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
        await updateDoc(conversationRef, {
            ...settings,
            updatedAt: serverTimestamp()
        });
    }, 3, 1000, 'Failed to update conversation settings');
}
