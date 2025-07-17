"use client";

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { mockConversations, mockMessages, mockUsers, updateUserFollowStatus, removeUserFromGroup, updateUserRoleInGroup, deleteGroup } from '@/lib/mockData';
import { addNotification } from '@/services/notificationService';
import { 
  sendMessage, 
  getConversationMessages, 
  createConversation, 
  subscribeToMessages,
  getConversation,
  markMessagesAsRead,
  findOrCreateDirectConversation
} from '@/services/conversationService';
import type { ChatMessage, Conversation as ConversationType, MockUser } from '@/types';
import { ArrowLeft, /* Phone, Video, */ Paperclip, Send, Smile, Zap, Loader2, MessageSquareOff, MessageSquarePlus, MoreVertical, Bell, BellOff, Search as SearchIcon, UserX, AlertOctagon, Pin, PinOff, Crown, Users, Edit, Trash2, Image as ImageIcon, FileText, UserCircle, /* MapPin, */ X, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// Remove direct AI imports
// import { generateSmartReplies, SmartReplyInput } from '@/ai/flows/smart-reply-suggestions';
// import { searchChat, type SearchChatInput, type SearchChatOutput } from '@/ai/flows/search-chat-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserListModal } from '@/components/chat/UserListModal';
import { format } from 'date-fns';
import { ToastAction } from '@/components/ui/toast';
import { ShareProfileModal } from '@/components/chat/ShareProfileModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AddGroupMembersModal } from '@/components/chat/AddGroupMembersModal';
import { EditGroupInfoModal } from '@/components/chat/EditGroupInfoModal';
// Comment out call functionality
// import { CallingModal } from '@/components/chat/CallingModal';
import { Card, CardContent } from '@/components/ui/card';
import { getProfileImageUrl } from '@/lib/firebase/storageUtils';
import Image from 'next/image';
import Particles from '@/components/magicui/particles';
import { useCustomTheme } from '@/contexts/CustomThemeContext';

const EMOJI_LIST = ['😀', '😂', '😊', '😍', '🤔', '👍', '🙏', '🎉', '🚀', '❤️', '👋', '😢', '🔥', '✨', '💀'];

export default function ChatDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [currentChatId, setCurrentChatId] = useState<string>(params.chatId as string);
  
  const searchParams = useSearchParams();
  const newChatTargetUserIdFromUrl = searchParams.get('userId');
  const { toast } = useToast();
  
  const { user: currentUser, updateUser: updateAuthUser } = useAuth();

  const [conversation, setConversation] = useState<ConversationType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatPartner, setChatPartner] = useState<MockUser | null>(null); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [userListModalTitle, setUserListModalTitle] = useState("");
  const [usersForModal, setUsersForModal] = useState<MockUser[]>([]);
  const [isShareProfileModalOpen, setIsShareProfileModalOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  // Comment out call functionality
  // const [isCallingModalOpen, setIsCallingModalOpen] = useState(false);
  // const [callType, setCallType] = useState<'audio' | 'video'>('audio');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]); // Changed to any[] as SearchChatOutput is removed
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Add state for temporary media viewing
  const [viewedMedia, setViewedMedia] = useState<Set<string>>(new Set());

  // Clear viewed media when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      setViewedMedia(new Set());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Function to mark media as viewed
  const markMediaAsViewed = (messageId: string) => {
    setViewedMedia(prev => new Set([...prev, messageId]));
  };

  // Function to check if media has been viewed
  const isMediaViewed = (messageId: string) => {
    return viewedMedia.has(messageId);
  };


  const isAdmin = !!(currentUser && conversation?.isGroup && conversation.adminIds?.includes(currentUser.id));
  const isCoAdmin = !!(currentUser && conversation?.isGroup && conversation.coAdminIds?.includes(currentUser.id));

  const { currentTheme } = useCustomTheme();
  const isLightMode = currentTheme?.palette?.background === '#ffffff' || currentTheme?.name?.toLowerCase().includes('light');

  // Update currentChatId when params change
  useEffect(() => {
    setCurrentChatId(params.chatId as string);
  }, [params.chatId]);

  const fetchConversationData = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      if (currentChatId && currentChatId !== 'new') {
        // Load real conversation and messages from Firebase
        const [conversationData, messagesData] = await Promise.all([
          getConversation(currentChatId as string),
          getConversationMessages(currentChatId as string)
        ]);

        if (conversationData) {
          // Load participant data for the conversation
          if (!conversationData.isGroup) {
            // For direct conversations, we need to load participant data from Firebase
            // The conversation document stores participant IDs, we need to fetch the user objects
            if (conversationData.participantIds && Array.isArray(conversationData.participantIds)) {
              const { getUserProfile } = await import('@/services/userService');
              const participants = await Promise.all(
                conversationData.participantIds.map((id: string) => getUserProfile(id))
              );
              conversationData.participants = participants.filter((p): p is MockUser => p !== null);
            } else if (!conversationData.participants || conversationData.participants.length === 0) {
              // Fallback: if no participantIds, initialize empty participants array
              conversationData.participants = [];
            }
          }
          
          setConversation(conversationData);
          setMessages(messagesData);

          if (!conversationData.isGroup) {
            const partner = conversationData.participants?.find(p => p?.id !== currentUser.id);
            setChatPartner(partner || null);
            
            // Generate smart replies for the last message if it exists
            if (messagesData.length > 0) {
              const lastMessage = messagesData[messagesData.length - 1];
              if (lastMessage.senderId !== currentUser.id && typeof lastMessage.content === 'string') {
                fetchSmartReplies(lastMessage.content);
              }
            }
          } else {
            setChatPartner(null);
            setSmartReplies([]);
          }
          
          // Mark messages as read
          await markMessagesAsRead(currentChatId as string, currentUser.id);
        }
      } else if (currentChatId === 'new') {
        // Handle new conversation setup
        if (newChatTargetUserIdFromUrl) {
          try {
            // Get the target user from Firebase instead of mockUsers
            const { getUserProfile } = await import('@/services/userService');
            const partner = await getUserProfile(newChatTargetUserIdFromUrl);
            setChatPartner(partner);
          } catch (error) {
            console.error('Error loading target user:', error);
            setChatPartner(null);
          }
        } else {
          setChatPartner(null);
        }
        setConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching conversation data:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, currentUser, newChatTargetUserIdFromUrl, toast]);

  useEffect(() => {
    fetchConversationData();
  }, [fetchConversationData]);

  // Real-time message subscription
  useEffect(() => {
    if (!currentChatId || currentChatId === 'new' || !currentUser) return;

    console.log('Setting up real-time message subscription for:', currentChatId);
    
    const unsubscribe = subscribeToMessages(
      currentChatId as string,
      (newMessages) => {
        console.log('Received real-time messages:', newMessages.length);
        setMessages(newMessages);
        
        // Generate smart replies for the latest message if it's not from current user
        if (newMessages.length > 0 && !conversation?.isGroup) {
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.senderId !== currentUser.id && typeof lastMessage.content === 'string') {
            fetchSmartReplies(lastMessage.content);
          }
        }
      },
      (error) => {
        console.error('Real-time message subscription error:', error);
      }
    );

    // Cleanup subscription on unmount or when currentChatId changes
    return () => {
      console.log('Cleaning up message subscription');
      unsubscribe();
    };
  }, [currentChatId, currentUser, conversation?.isGroup]);

  useEffect(() => {
    if (highlightedMessageId === null) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, highlightedMessageId]);

  // Add this function to call the smart replies API
  const fetchSmartReplies = async (messageContent: string) => {
    if (!messageContent.trim() || conversation?.isGroup) return;
    setIsLoadingReplies(true);
    try {
      const response = await fetch('/api/smart-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent }),
      });
      if (!response.ok) throw new Error('Failed to generate smart replies');
      const result = await response.json();
      setSmartReplies(result.suggestions || []);
    } catch (error) {
      setSmartReplies([]);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const handleSearchChat = async (query: string) => {
    if (!messages.length) return [];
    
    try {
      const response = await fetch('/api/search-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          messages: messages.map(msg => ({
            role: msg.senderId === currentUser?.id ? 'user' : 'assistant',
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search chat');
      }

      const result = await response.json();
      return result.results || [];
    } catch (error) {
      console.error('Error searching chat:', error);
      return [];
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) {
      console.log('handleSendMessage: No message or user.');
      return;
    }

    const messageContent = newMessage;
    setNewMessage('');
    setSmartReplies([]);

    try {
      let conversationId = currentChatId as string;
      let isNewChat = false;

      // If we are in a 'new' chat state, we must first establish a conversation.
      if (conversationId === 'new') {
        if (newChatTargetUserIdFromUrl) {
          // This will either find an existing conversation or create a new one.
          const newConversationId = await findOrCreateDirectConversation(currentUser.id, newChatTargetUserIdFromUrl);
          if (newConversationId) {
            conversationId = newConversationId;
            setCurrentChatId(conversationId);
            isNewChat = true;
          } else {
            toast({
              title: "Error",
              description: "Could not create or find a conversation with the user.",
              variant: "destructive"
            });
            setNewMessage(messageContent); // Restore message
            console.log('handleSendMessage: Failed to create/find conversation.');
            return;
          }
        } else {
          toast({
            title: "Error",
            description: "Cannot send message: No target user for this new chat.",
            variant: "destructive"
          });
          setNewMessage(messageContent); // Restore message
          console.log('handleSendMessage: No target user for new chat.');
          return;
        }
      }

      // At this point, conversationId should be valid, whether it was pre-existing or just created.
      if (!conversationId || conversationId === 'new') {
        toast({
          title: "Error",
          description: "Cannot send message: No valid conversation.",
          variant: "destructive"
        });
        setNewMessage(messageContent); // Restore message
        console.log('handleSendMessage: No valid conversationId.');
        return;
      }

      // Send the message to the determined conversation.
      console.log('handleSendMessage: Sending message', { conversationId, senderId: currentUser.id, messageContent });
      await sendMessage(conversationId, currentUser.id, messageContent, 'text');
      console.log('handleSendMessage: Message sent!');
      
      // Only replace route if we just created a new chat
      if (isNewChat) {
        router.replace(`/chat/conversations/${conversationId}`);
      }
      
      // Do NOT reset conversation/chatPartner state here!
      // The real-time subscription will update messages automatically.
      // No need to re-fetch conversation or setChatPartner.
      
    } catch (error) {
      console.error('handleSendMessage: Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      // Restore the message if sending failed
      setNewMessage(messageContent);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev: string) => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  const handleAttachFileClick = (acceptType: string) => {
    // Comment out file attachment functionality for now
    /*
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
    setIsAttachmentMenuOpen(false);
    */
    toast({
      title: "Feature Disabled",
      description: "File sharing is temporarily disabled.",
      variant: "destructive"
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Comment out file upload functionality for now
    /*
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    let conversationId = currentChatId;

    try {
      // Check if this is a new conversation and create it if needed
      if (conversationId === 'new' && newChatTargetUserIdFromUrl) {
        const newConversationId = await findOrCreateDirectConversation(currentUser.id, newChatTargetUserIdFromUrl);
        if (newConversationId) {
          conversationId = newConversationId;
          setCurrentChatId(newConversationId);
        } else {
          toast({ title: "Error", description: "Could not create conversation to send file.", variant: "destructive" });
          return;
        }
      }

      if (!conversationId || conversationId === 'new') {
        toast({ title: "Error", description: "Invalid conversation.", variant: "destructive" });
        return;
      }
      
      let fileToUpload = file;
      const fileTypeIsImage = file.type.startsWith('image/');
      const fileTypeIsVideo = file.type.startsWith('video/');
      
      // Compress image before upload
      if (fileTypeIsImage) {
        const { compressImage } = await import('@/lib/mediaCompression');
        try {
          fileToUpload = await compressImage(file, {
            maxWidth: 1080,
            maxHeight: 1080,
            quality: 0.8,
            maxSizeInMB: 2 // 2MB limit for chat images
          });
        } catch (err) {
          console.warn('Image compression failed, uploading original file.', err);
          fileToUpload = file;
        }
      }
      
      // Generate storage path
      const timestamp = Date.now();
      const sanitizedFileName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `chat-files/${conversationId}/${timestamp}_${sanitizedFileName}`;

      // Show loading message first
      const messageId = `msg-file-${Date.now()}`;
      const loadingMessage: ChatMessage = {
        id: messageId,
        senderId: currentUser.id,
        conversationId: conversationId,
        content: { 
          name: fileToUpload.name, 
          url: '#loading', 
          type: fileTypeIsImage ? 'image' : fileTypeIsVideo ? 'video' : 'file',
          size: fileToUpload.size 
        },
        timestamp: new Date(),
      };
      setMessages((prev: ChatMessage[]) => [...prev, loadingMessage]);

      // Upload file to Firebase Storage
      const { uploadFile } = await import('@/services/storageService');
      const fileUrl = await uploadFile(fileToUpload, storagePath);

      // Create the final message with the file URL
      const fileMessage: ChatMessage = {
        id: messageId,
        senderId: currentUser.id,
        conversationId: conversationId,
        content: { 
          name: fileToUpload.name,
          url: fileUrl, 
          type: fileTypeIsImage ? 'image' : fileTypeIsVideo ? 'video' : 'file',
          size: fileToUpload.size 
        },
        timestamp: new Date(),
      };

      // Send message to Firebase
      await sendMessage(
        conversationId, 
        currentUser.id, 
        fileMessage.content,
        fileTypeIsImage ? 'image' : fileTypeIsVideo ? 'file' : 'file' // Firebase service doesn't have 'video' type yet
      );

      toast({
        title: "File Uploaded",
        description: `${fileToUpload.name} has been sent successfully.`,
      });

      // After successfully sending the file, redirect to the actual conversation URL
      if (currentChatId === 'new' && conversationId !== 'new') {
        router.replace(`/chat/conversations/${conversationId}`);
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      // Remove loading message and show error
      setMessages((prev: ChatMessage[]) => prev.filter((msg: ChatMessage) => msg.id !== `msg-file-${Date.now()}`));
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    */
    toast({
      title: "Feature Disabled",
      description: "File sharing is temporarily disabled.",
      variant: "destructive"
    });
  };
  
  const getSenderDetails = (senderId: string): MockUser | undefined => {
    if (senderId === 'system') { 
        return { 
          id: 'system', 
          username: 'System', 
          email: 'system@loopin.app', 
          status: 'online', 
          followers: [], 
          following: [], 
          bio: 'System notifications',
          isPrivate: false,
          savedPosts: []
        };
    }
    return mockUsers.find((u: MockUser) => u.id === senderId);
  }

  const handleToggleMute = () => {
    if (!conversation) return;
    const newMutedState = !conversation.isMuted;
    
    setConversation((prev: ConversationType | null) => prev ? { ...prev, isMuted: newMutedState } : null);

    const convoIndex = mockConversations.findIndex(c => c.id === conversation.id);
    if (convoIndex !== -1) {
        mockConversations[convoIndex].isMuted = newMutedState;
    }
    toast({
        duration: 3000,
        title: newMutedState ? "Chat Muted" : "Chat Unmuted",
        description: `Notifications for this chat are now ${newMutedState ? 'off' : 'on'}.`,
    });
  };

  const handleTogglePin = () => {
    if (!conversation) return;
    const newPinnedState = !conversation.isPinned;

    setConversation((prev: ConversationType | null) => prev ? { ...prev, isPinned: newPinnedState } : null);

    const convoIndex = mockConversations.findIndex(c => c.id === conversation.id);
    if (convoIndex !== -1) {
        mockConversations[convoIndex].isPinned = newPinnedState;
    }
    toast({
        duration: 3000,
        title: newPinnedState ? "Chat Pinned" : "Chat Unpinned",
        description: `This chat will now appear at the top of your conversations.`,
    });
  };

  const handleUnfollowUser = () => {
    if (!currentUser || !chatPartner) return;
    
    updateUserFollowStatus(currentUser.id, chatPartner.id, 'unfollow');
    
    const updatedAuthUser = {
        ...currentUser,
        following: currentUser.following.filter(id => id !== chatPartner.id)
    };
    updateAuthUser(updatedAuthUser);
    
    toast({
        duration: 3000,
        title: "Unfollowed",
        description: `You are no longer following ${chatPartner.username}.`
    });
  };
  
  const handleReportChat = () => {
    const targetName = conversation?.isGroup ? conversation.name : chatPartner?.username;
    toast({ 
        duration: 3000,
        title: "Report Submitted (Mock)", 
        description: `Your report concerning ${targetName || 'this chat'} has been noted.`,
        variant: "destructive"
    });
  };

  const handleOpenGroupMembersModal = () => {
    if (conversation?.isGroup) {
      setUserListModalTitle("Group Members");
      setUsersForModal(conversation.participants);
      setIsUserListModalOpen(true);
    }
  };

  const handleFollowToggleInModal = (targetUserId: string) => {
    if (!currentUser) return;

    const isCurrentlyFollowing = currentUser.following.includes(targetUserId);
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
    
    updateUserFollowStatus(currentUser.id, targetUserId, action);
    
    const updatedFollowing = action === 'follow'
        ? [...currentUser.following, targetUserId]
        : currentUser.following.filter((id: string) => id !== targetUserId);
    
    updateAuthUser({ ...currentUser, following: updatedFollowing });
    
    const targetUser = mockUsers.find((u: MockUser) => u.id === targetUserId);
    if (targetUser) {
        toast({
            duration: 3000,
            title: action === 'follow' ? "Followed" : "Unfollowed",
            description: `You are now ${action === 'follow' ? 'following' : 'no longer following'} ${targetUser.username}.`
        });
        if (action === 'follow') {
            addNotification(targetUserId, {
                category: 'follow',
                title: 'New Follower',
                message: `${currentUser.username} started following you.`,
                actor: currentUser,
                link: `/chat/profile/${currentUser.id}`
            });
        }
    }
    fetchConversationData();
  };

  const handleRemoveUser = (targetUserId: string) => {
    if (!currentChatId || !isAdmin) return;
    const success = removeUserFromGroup(currentChatId as string, targetUserId);
    if (success) {
      toast({ duration: 3000, title: "User Removed", description: "The user has been removed from the group." });
      fetchConversationData();
    } else {
      toast({ duration: 3000, title: "Error", description: "Failed to remove user.", variant: "destructive" });
    }
  };

  const handleUpdateRole = (targetUserId: string, newRole: 'admin' | 'coAdmin' | 'member') => {
    if (!currentChatId || !isAdmin) return;
    const success = updateUserRoleInGroup(currentChatId as string, targetUserId, newRole);
    if (success) {
      toast({ duration: 3000, title: "Role Updated", description: `User's role has been updated to ${newRole}.` });
      fetchConversationData();
    } else {
      toast({ duration: 3000, title: "Error", description: "Failed to update role.", variant: "destructive" });
    }
  };

  const handleAddUsers = () => {
    setIsAddMembersModalOpen(true);
  };
  
  const handleDeleteGroup = () => {
    if (!conversation) return;
    const success = deleteGroup(conversation.id);
    if (success) {
        toast({ duration: 3000, title: "Group Deleted", description: "The group has been deleted." });
        router.push('/chat/conversations');
    } else {
        toast({ duration: 3000, title: "Error", description: "Failed to delete group.", variant: "destructive" });
    }
  };
  
  const handleEditGroup = () => {
    setIsEditGroupModalOpen(true);
  };

  const getSenderRole = (senderId: string): 'admin' | 'coAdmin' | undefined => {
    if (conversation?.adminIds?.includes(senderId)) return 'admin';
    if (conversation?.coAdminIds?.includes(senderId)) return 'coAdmin';
    return undefined;
  };

  const handleShareLocation = () => {
    // Comment out location sharing functionality
    /*
    setIsAttachmentMenuOpen(false);
    if (!currentUser || !currentChatId) return;
    const location = { latitude: 34.052235, longitude: -118.243683 };
    const messageToSend: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUser.id,
        conversationId: currentChatId as string,
        content: { type: 'location_share', ...location },
        timestamp: new Date(),
    };
    setMessages((prev: ChatMessage[]) => [...prev, messageToSend]);
    toast({ duration: 3000, title: "Location Shared", description: "Your location has been sent in the chat." });
    */
    toast({ 
      duration: 3000, 
      title: "Feature Disabled", 
      description: "Location sharing is currently disabled." 
    });
  };
  
  const handleProfileShareSelect = (userToShare: MockUser) => {
    if (!currentUser || !currentChatId) return;
    const messageToSend: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUser.id,
        conversationId: currentChatId as string,
        content: { 
            type: 'profile_share', 
            userId: userToShare.id, 
            username: userToShare.username,
            fullName: userToShare.fullName
        },
        timestamp: new Date(),
    };
    setMessages((prev: ChatMessage[]) => [...prev, messageToSend]);
    toast({ duration: 3000, title: "Profile Shared", description: `You shared ${userToShare.username}'s profile.` });
  };

  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    const searchableMessages = messages.map((msg: ChatMessage) => {
      let textContent = '';
      if (typeof msg.content === 'string') {
        textContent = msg.content;
      } else if (msg.content.type === 'image') {
        textContent = `[Image: ${msg.content.name || 'image'}]`;
      } else if (msg.content.type === 'file') {
        textContent = `[File: ${msg.content.name || 'file'}]`;
      } else if (msg.content.type === 'profile_share') {
        textContent = `[Profile Share: ${msg.content.username}]`;
      } else if (msg.content.type === 'location_share') {
        textContent = '[Location Share]';
      }
      return { id: msg.id, senderId: msg.senderId, textContent };
    });

    try {
        const results = await handleSearchChat(searchQuery);
        
        if (results && results.length > 0) {
            setSearchResults(results);
            toast({ title: "Search Complete", description: `Found ${results.length} relevant message(s).` });
        } else {
            toast({ title: "No Results", description: "No messages matched your search query." });
        }
    } catch (error) {
        console.error("AI search error:", error);
        toast({ title: "Search Failed", description: "Could not perform search at this time.", variant: "destructive" });
    } finally {
        setIsSearching(false);
    }
  };
  
  const handleSearchResultClick = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setHighlightedMessageId(null);
  };

  useEffect(() => {
    // Only run if we're on a 'new' chat and have a target user
    if (
      currentChatId === 'new' &&
      newChatTargetUserIdFromUrl &&
      currentUser
    ) {
      (async () => {
        // Try to find an existing conversation
        const existingConversationId = await findOrCreateDirectConversation(
          currentUser.id,
          newChatTargetUserIdFromUrl,
          { findOnly: true }
        );
        if (existingConversationId && existingConversationId !== 'new') {
          router.replace(`/chat/conversations/${existingConversationId}`);
        }
      })();
    }
  }, [currentChatId, newChatTargetUserIdFromUrl, currentUser, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  const displayName = conversation?.isGroup ? conversation.name : chatPartner?.username;
  const displayStatus = conversation?.isGroup ? `${conversation.participants.length} members` : chatPartner?.status;
  
  const singleAvatarFallback = displayName ? displayName.charAt(0).toUpperCase() : '?';

  const isFollowingChatPartner = !!(currentUser && chatPartner && currentUser.following.includes(chatPartner.id));

  return (
    <div className="flex flex-col h-full w-full bg-card rounded-lg shadow-md">
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b">
          <Button variant="ghost" size="icon" className="mr-1 sm:mr-2 md:hidden" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {/* Chat Partner Info - Left Side */}
          {chatPartner && !conversation?.isGroup && (
            <div className="flex items-center gap-2 sm:gap-3 mr-4">
              <Link href={`/chat/profile/${chatPartner.id}`} className="flex items-center gap-2 hover:bg-accent/50 rounded-md p-1 -m-1 transition-colors">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {chatPartner.profileImage || chatPartner.avatar ? (
                    <Image
                      src={getProfileImageUrl(chatPartner, 36)}
                      alt={`${chatPartner.username}'s profile`}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <UserCircle className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs sm:text-sm font-medium truncate max-w-20">{chatPartner.username}</p>
                </div>
              </Link>
            </div>
          )}
          
          {conversation?.isGroup ? (
            <button
              onClick={handleOpenGroupMembersModal}
              className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0 text-left p-1 -m-1 rounded-md hover:bg-accent/50 transition-colors"
              aria-label="View group members"
            >
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <h2 className="font-semibold text-sm sm:text-base md:text-lg truncate">{displayName}</h2>
                    {isAdmin && <Crown className="h-4 w-4 text-amber-400 shrink-0" />}
                    {conversation?.isMuted && <BellOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />}
                    {conversation?.isPinned && <Pin className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />}
                  </div>
                  {displayStatus && <p className="text-xs text-muted-foreground capitalize truncate">{displayStatus}</p>}
              </div>
            </button>
          ) : null}
          
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 ml-2 ">
            {/* Comment out call functionality */}
            {/* <Button
              variant="ghost"
              size="icon"
              aria-label="Call"
              className="h-8 w-8 sm:h-9 sm:w-9"
              disabled={conversation?.isGroup}
              onClick={() => {
                if (conversation?.isGroup) return;
                setCallType('audio');
                setIsCallingModalOpen(true);
              }}
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Video call"
              className="h-8 w-8 sm:h-9 sm:w-9"
              disabled={conversation?.isGroup}
              onClick={() => {
                if (conversation?.isGroup) return;
                setCallType('video');
                setIsCallingModalOpen(true);
              }}
            >
              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More options" className="h-8 w-8 sm:h-9 sm:w-9">
                  <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {conversation?.isGroup && (isAdmin || isCoAdmin) && (
                  <>
                    <DropdownMenuItem onClick={handleAddUsers}>
                      <Users className="mr-2 h-4 w-4" /> Add Members
                    </DropdownMenuItem>
                  </>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={handleEditGroup}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Group
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Group
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the group and all its messages.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteGroup}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleTogglePin}>
                  {conversation?.isPinned ? (
                    <><PinOff className="mr-2 h-4 w-4" /> Unpin Chat</>
                  ) : (
                    <><Pin className="mr-2 h-4 w-4" /> Pin Chat</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleMute}>
                  {conversation?.isMuted ? (
                    <><Bell className="mr-2 h-4 w-4" /> Unmute Notifications</>
                  ) : (
                    <><BellOff className="mr-2 h-4 w-4" /> Mute Notifications</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsSearchOpen(true)}>
                  <SearchIcon className="mr-2 h-4 w-4" /> Search in Chat
                </DropdownMenuItem>
                {!conversation?.isGroup && chatPartner && isFollowingChatPartner && (
                  <DropdownMenuItem onClick={handleUnfollowUser}>
                    <UserX className="mr-2 h-4 w-4 text-destructive" /> 
                    <span className="text-destructive">Unfollow {chatPartner.username}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReportChat}>
                  <AlertOctagon className="mr-2 h-4 w-4 text-destructive" /> 
                  <span className="text-destructive">Report</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
         {isSearchOpen && (
          <div className="relative p-2 border-b bg-muted/30">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <SearchIcon className="h-5 w-5 text-muted-foreground ml-2"/>
              <Input
                placeholder="Search messages with AI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 text-sm"
                disabled={isSearching}
                autoFocus
              />
              {isSearching && <Loader2 className="h-5 w-5 animate-spin"/>}
              <Button type="button" variant="ghost" size="icon" onClick={handleCloseSearch} className="h-7 w-7">
                <X className="h-5 w-5"/>
              </Button>
            </form>
             {searchResults.length > 0 && (
              <Card className="absolute top-full left-2 right-2 mt-1 z-10 shadow-lg max-h-80 overflow-y-auto">
                <CardContent className="p-2">
                  {searchResults.map((result: any) => {
                    const originalMessage = messages.find((m: ChatMessage) => m.id === result.messageId);
                    if (!originalMessage) return null;
                    const sender = getSenderDetails(originalMessage.senderId);
                    return (
                        <button
                          key={result.messageId}
                          onClick={() => handleSearchResultClick(result.messageId)}
                          className="w-full text-left p-2 rounded-md hover:bg-accent flex items-start gap-3"
                        >
                            <div className="h-9 w-9 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                              {sender?.profileImage ? (
                                <Image
                                  src={getProfileImageUrl(sender.profileImage)}
                                  alt={`${sender.username}'s avatar`}
                                  width={36}
                                  height={36}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UserCircle className="h-9 w-9 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between">
                                    <p className="font-semibold text-sm truncate">{sender?.username}</p>
                                     <p className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(originalMessage.timestamp), "MMM d")}</p>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{result.contentSnippet}</p>
                            </div>
                        </button>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Particles Background */}
        <div className="absolute inset-0 z-0">
          <Particles
            particleCount={50}
            particleSpread={8}
            speed={0.05}
            particleColors={isLightMode ? ['#1a1a1a', '#2d2d2d', '#404040', '#525252'] : ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981']}
            moveParticlesOnHover={true}
            particleHoverFactor={2}
            alphaParticles={true}
            particleBaseSize={80}
            sizeRandomness={0.5}
            cameraDistance={15}
            disableRotation={false}
            className="w-full h-full"
          />
        </div>
        
        <ScrollArea className="flex-1 p-2 sm:p-3 md:p-4 bg-muted/20 dark:bg-background/50 relative z-10">
          {messages.length === 0 && currentChatId !== 'new' && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
              <MessageSquareOff className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base">No messages yet in this conversation.</p>
              <p className="text-xs sm:text-sm">Send a message to start chatting!</p>
            </div>
          )}
          {currentChatId === 'new' && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
              <MessageSquarePlus className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base">Starting a new chat with {chatPartner?.username || 'someone'}.</p>
              <p className="text-xs sm:text-sm">Send your first message!</p>
            </div>
          )}
          {messages.map((msg: ChatMessage) => (
            <div key={msg.id} id={`message-${msg.id}`}>
                <MessageBubble 
                    message={msg} 
                    senderDetails={getSenderDetails(msg.senderId)} 
                    senderRole={getSenderRole(msg.senderId)}
                    isHighlighted={highlightedMessageId === msg.id}
                    onMediaView={markMediaAsViewed}
                    isMediaViewed={isMediaViewed}
                />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        {!conversation?.isGroup && (smartReplies.length > 0 || isLoadingReplies) && (
          <div className="p-2 border-t bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Smart Replies:</span>
            </div>
            {isLoadingReplies ? (
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
              </div>
            ) : (
              <ScrollArea className="pb-2 w-full">
                <div className="flex gap-2 whitespace-nowrap">
                  {smartReplies.map((reply: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="rounded-full h-auto py-1 px-3 text-xs"
                      onClick={() => {
                        setNewMessage(reply);
                        setSmartReplies([]); 
                      }}
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-2 sm:p-3 border-t bg-card">
        <div className="flex items-end gap-1.5 sm:gap-2">
          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" type="button" aria-label="Emoji" className="h-9 w-9 sm:h-10 sm:w-10">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 border shadow-lg rounded-md bg-popover mb-2">
              <div className="grid grid-cols-5 gap-1">
                {EMOJI_LIST.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="icon"
                    className="text-lg sm:text-xl hover:bg-accent rounded-md"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as unknown as FormEvent);
              }
            }}
            rows={1}
            className="flex-1 resize-none min-h-[40px] max-h-28 text-sm py-2"
          />
          <Popover open={isAttachmentMenuOpen} onOpenChange={setIsAttachmentMenuOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" type="button" aria-label="Attach file" className="h-9 w-9 sm:h-10 sm:w-10">
                <Paperclip className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 mb-2" align="end">
                <div className="grid grid-cols-3 gap-2">
                    {/* Comment out file sharing buttons for now */}
                    {/*
                    <button className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-accent h-20 w-20 text-center" onClick={() => handleAttachFileClick('image/*')}>
                        <ImageIcon className="h-6 w-6 mb-1 text-primary" />
                        <span className="text-xs font-medium">Image</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-accent h-20 w-20 text-center" onClick={() => handleAttachFileClick('video/*')}>
                        <Video className="h-6 w-6 mb-1 text-primary" />
                        <span className="text-xs font-medium">Video</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-accent h-20 w-20 text-center" onClick={() => handleAttachFileClick('.pdf,.doc,.docx')}>
                        <FileText className="h-6 w-6 mb-1 text-primary" />
                        <span className="text-xs font-medium">Document</span>
                    </button>
                    */}
                    <button className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-accent h-20 w-20 text-center" onClick={() => { setIsShareProfileModalOpen(true); setIsAttachmentMenuOpen(false); }}>
                        <UserCircle className="h-6 w-6 mb-1 text-primary" />
                        <span className="text-xs font-medium">Share Profile</span>
                    </button>
                    {/* Comment out location sharing functionality */}
                    {/* <button className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-accent h-20 w-20 text-center" onClick={handleShareLocation}>
                        <MapPin className="h-6 w-6 mb-1 text-primary" />
                        <span className="text-xs font-medium">Location</span>
                    </button> */}
                </div>
            </PopoverContent>
          </Popover>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            // Comment out file input for now
            disabled
          />
          <Button type="submit" size="icon" aria-label="Send message" disabled={!newMessage.trim()} className="h-9 w-9 sm:h-10 sm:w-10">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>

      <UserListModal
        isOpen={isUserListModalOpen}
        onOpenChange={setIsUserListModalOpen}
        title={userListModalTitle}
        users={usersForModal}
        currentUser={currentUser}
        conversation={conversation}
        onFollowToggle={handleFollowToggleInModal}
        onRemoveUser={handleRemoveUser}
        onUpdateRole={handleUpdateRole}
        onAddUsers={handleAddUsers}
      />

      {currentUser && (
        <ShareProfileModal
          isOpen={isShareProfileModalOpen}
          onOpenChange={setIsShareProfileModalOpen}
          currentUser={currentUser}
          onShareProfile={handleProfileShareSelect}
        />
      )}
      
      {currentUser && conversation?.isGroup && (
        <>
            <AddGroupMembersModal
                isOpen={isAddMembersModalOpen}
                onOpenChange={setIsAddMembersModalOpen}
                conversation={conversation}
                currentUser={currentUser}
                onMembersAdded={fetchConversationData}
            />
            <EditGroupInfoModal
                isOpen={isEditGroupModalOpen}
                onOpenChange={setIsEditGroupModalOpen}
                conversation={conversation}
                onGroupInfoUpdated={fetchConversationData}
            />
        </>
      )}

      {/* Comment out call functionality */}
      {/* <CallingModal
        isOpen={isCallingModalOpen}
        onOpenChange={setIsCallingModalOpen}
        targetUser={chatPartner}
        callType={callType}
      /> */}

    </div>
  );
}
