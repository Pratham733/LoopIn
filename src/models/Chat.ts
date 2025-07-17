/**
 * This file previously contained a Mongoose model for Message and Conversation.
 * Now it provides type definitions for Firebase data structure.
 */

// Define types for attachments
export interface MessageAttachment {
  type: 'image' | 'video' | 'file' | 'audio';
  url: string;
  thumbnail?: string;
  size?: number;
  name?: string;
  mimeType?: string;
}

// Define types for reactions
export interface MessageReaction {
  userId: string;
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
}

// Define Message interface
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  readBy: string[];
  replyTo?: string;
  deletedAt?: string;
  deletedFor?: string[];
  createdAt: string;
  updatedAt: string;
}

// Define mute settings interface
export interface MuteSettings {
  userId: string;
  until: string; // ISO date string
}

// Define Conversation interface
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  name?: string; // Required for group chats
  avatar?: string;
  lastMessage?: string; // ID of the last message
  admins?: string[];
  pinned?: string[]; // User IDs who pinned this conversation
  muted?: MuteSettings[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Mock objects for testing
export const mockMessage: Message = {
  id: 'test-message-id',
  conversationId: 'test-conversation-id',
  senderId: 'test-user-id',
  content: 'Hello world!',
  readBy: ['test-user-id'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const mockConversation: Conversation = {
  id: 'test-conversation-id',
  type: 'direct',
  participants: ['test-user-id', 'test-user-id-2'],
  createdBy: 'test-user-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
