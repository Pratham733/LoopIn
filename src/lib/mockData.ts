
import type { MockUser, Conversation, ChatMessage, NotificationType, Post, PostComment, FollowRequest } from '@/types';
import { MessageCircle, UserPlus, AlertTriangle } from 'lucide-react';


export let mockUsers: MockUser[] = [
  { id: 'user-2', username: 'alice.w', fullName: 'Alice L. Wonderland', email: 'alice@example.com', status: 'online', followers: ['user-3'], following: ['user-4'], bio: 'Curiouser and curiouser! Exploring the digital rabbit hole. Avid reader and tea enthusiast.', isPrivate: true, savedPosts: [], showCurrentlyPlaying: true },
  { id: 'user-3', username: 'bob_the_builder', fullName: 'Robert "Bob" Builder', email: 'bob@example.com', status: 'offline', followers: [], following: ['user-2', 'user-5'], bio: 'Can we fix it? Yes, we can! Building connections one chat at a time. Love DIY projects.', isPrivate: false, savedPosts: [], showCurrentlyPlaying: false },
  { id: 'user-4', username: 'charlie.brown', fullName: 'Charles "Charlie" Brown', email: 'charlie@example.com', status: 'away', followers: ['user-2'], following: [], bio: 'Good grief! Just trying to kick the football. Often found contemplating life with my dog.', isPrivate: true, savedPosts: [], showCurrentlyPlaying: true },
  { id: 'user-5', username: 'diana_prince', fullName: 'Diana of Themyscira', email: 'diana@example.com', status: 'online', followers: ['user-3'], following: [], bio: 'Working for a world where love and justice reign. Sometimes I chat too. Advocate for peace.', isPrivate: true, savedPosts: [], showCurrentlyPlaying: false },
  { id: 'user-6', username: 'edward.s', fullName: 'Edward S.', email: 'edward@example.com', status: 'offline', followers: [], following: [], bio: 'A bit shy, but my messages are sharp. Artist and topiary enthusiast.', isPrivate: false, savedPosts: [], showCurrentlyPlaying: true },
].map(u => ({ ...u, fullName: u.fullName || u.username, isPrivate: u.isPrivate || false, username: u.username.toLowerCase().replace(/\s+/g, '_'), savedPosts: u.savedPosts || [], showCurrentlyPlaying: u.showCurrentlyPlaying ?? true } as MockUser));


export let mockFollowRequests: FollowRequest[] = [
  {
    id: 'req-example-1',
    fromUser: mockUsers.find(u => u.id === 'user-6')!, 
    toUserId: 'user-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), 
    status: 'pending',
  },
];

export const updateUserFollowStatus = (currentUserId: string, targetUserId: string, action: 'follow' | 'unfollow'): 'user_not_found' | 'request_sent' | 'request_already_pending' | 'updated' | 'already_following' => {
  console.warn("updateUserFollowStatus in mockData is deprecated. Use the one from followService instead.");
  return 'user_not_found';
};

export const acceptFollowRequest = (requestId: string, currentUserId: string): boolean => {
  console.warn("acceptFollowRequest in mockData is deprecated. Use the one from followService instead.");
  return false;
};

export const declineFollowRequest = (requestId: string, currentUserId: string): boolean => {
   console.warn("declineFollowRequest in mockData is deprecated. Use the one from followService instead.");
   return false;
};

export const cancelFollowRequest = (currentUserId: string, targetUserId: string): boolean => {
    const requestIndex = mockFollowRequests.findIndex(
        req => req.fromUser.id === currentUserId && req.toUserId === targetUserId && req.status === 'pending'
    );
    if (requestIndex === -1) {
        console.log("No pending request found to cancel.");
        return false;
    }
    mockFollowRequests.splice(requestIndex, 1);
    console.log(`Follow request from ${currentUserId} to ${targetUserId} cancelled.`);
    return true;
};


const generateMessages = (convoId: string, user1: MockUser, user2: MockUser): ChatMessage[] => [
  { id: `${convoId}-msg1`, conversationId: convoId, senderId: user1.id, content: 'Hey there!', timestamp: new Date(Date.now() - 1000 * 60 * 5), isRead: true },
  { id: `${convoId}-msg2`, conversationId: convoId, senderId: user2.id, content: 'Hello! How are you?', timestamp: new Date(Date.now() - 1000 * 60 * 4), isRead: true },
  { id: `${convoId}-msg3`, conversationId: convoId, senderId: user1.id, content: 'Doing great, thanks for asking!', timestamp: new Date(Date.now() - 1000 * 60 * 3) },
  { id: `${convoId}-msg4`, conversationId: convoId, senderId: user2.id, content: { name: "landscape.jpg", url: "https://placehold.co/300x200/A2D2FF/000000.png", type: "image", dataAiHint: "landscape" } , timestamp: new Date(Date.now() - 1000 * 60 * 2) },
  { id: `${convoId}-msg5`, conversationId: convoId, senderId: user1.id, content: { name: "project-specs.pdf", url: "#", type: "file" } , timestamp: new Date(Date.now() - 1000 * 60 * 1) },
];

export let mockConversations: Conversation[] = [];

export const mockMessages: Record<string, ChatMessage[]> = {};

export const addMockGroupConversation = (groupName: string, participants: MockUser[]): Conversation => {
  console.warn("addMockGroupConversation is deprecated. Use Firebase services instead.");
  const newGroupId = `group-${Date.now()}`;
  const creator = participants[0]; 
  const initialSystemMessage: ChatMessage = {
    id: `${newGroupId}-msg-init`,
    conversationId: newGroupId,
    senderId: 'system', 
    content: `${creator.username} created the group "${groupName}".`,
    timestamp: new Date(),
    isRead: true,
  };
  const newConversation: Conversation = {
    id: newGroupId,
    participants: participants,
    lastMessage: initialSystemMessage,
    unreadCount: 0,
    name: groupName,
    isGroup: true,
    isMuted: false,
    adminIds: [creator.id],
    coAdminIds: [],
  };
  return newConversation;
};

export const updateUserRoleInGroup = (conversationId: string, targetUserId: string, newRole: 'admin' | 'coAdmin' | 'member'): boolean => {
    const convoIndex = mockConversations.findIndex(c => c.id === conversationId);
    if (convoIndex === -1) return false;

    const convo = { ...mockConversations[convoIndex] };
    convo.adminIds = convo.adminIds?.filter(id => id !== targetUserId) || [];
    convo.coAdminIds = convo.coAdminIds?.filter(id => id !== targetUserId) || [];

    if (newRole === 'admin') {
        convo.adminIds.push(targetUserId);
    } else if (newRole === 'coAdmin') {
        convo.coAdminIds.push(targetUserId);
    }
    
    mockConversations[convoIndex] = convo;
    return true;
};

export const removeUserFromGroup = (conversationId: string, targetUserId: string): boolean => {
    const convoIndex = mockConversations.findIndex(c => c.id === conversationId);
    if (convoIndex === -1) return false;

    const convo = { ...mockConversations[convoIndex] };
    convo.participants = convo.participants.filter(p => p.id !== targetUserId);
    convo.adminIds = convo.adminIds?.filter(id => id !== targetUserId);
    convo.coAdminIds = convo.coAdminIds?.filter(id => id !== targetUserId);

    mockConversations[convoIndex] = convo;
    return true;
};


export let mockNotifications: NotificationType[] = [];

export const addMembersToGroup = (conversationId: string, userIdsToAdd: string[]): boolean => {
    const convoIndex = mockConversations.findIndex(c => c.id === conversationId);
    if (convoIndex === -1 || !mockConversations[convoIndex].isGroup) return false;
    
    const usersToAdd = mockUsers.filter(u => userIdsToAdd.includes(u.id));
    if (usersToAdd.length === 0) return false;

    const currentParticipantIds = new Set(mockConversations[convoIndex].participants.map(p => p.id));
    const newParticipants = usersToAdd.filter(u => !currentParticipantIds.has(u.id));

    if (newParticipants.length > 0) {
        mockConversations[convoIndex].participants.push(...newParticipants);
    }
    
    const addedUsernames = newParticipants.map(u => u.username).join(', ');
    const systemMessageContent = `Admin added ${addedUsernames} to the group.`;
    
    const systemMessage: ChatMessage = {
        id: `sys-add-${Date.now()}`,
        conversationId: conversationId,
        senderId: 'system',
        content: systemMessageContent,
        timestamp: new Date(),
    };
    mockMessages[conversationId] = [...(mockMessages[conversationId] || []), systemMessage];
    mockConversations[convoIndex].lastMessage = systemMessage;
    
    return true;
};

export const updateGroupInfo = (conversationId: string, newName: string): boolean => {
    const convoIndex = mockConversations.findIndex(c => c.id === conversationId);
    if (convoIndex === -1 || !mockConversations[convoIndex].isGroup) return false;

    const oldName = mockConversations[convoIndex].name;
    mockConversations[convoIndex].name = newName;
    
    const systemMessageContent = `Admin changed the group name from "${oldName}" to "${newName}".`;
    
    const systemMessage: ChatMessage = {
        id: `sys-rename-${Date.now()}`,
        conversationId: conversationId,
        senderId: 'system',
        content: systemMessageContent,
        timestamp: new Date(),
    };
    mockMessages[conversationId] = [...(mockMessages[conversationId] || []), systemMessage];
    mockConversations[convoIndex].lastMessage = systemMessage;

    return true;
};

export const deleteGroup = (conversationId: string): boolean => {
    const convoIndex = mockConversations.findIndex(c => c.id === conversationId);
    if (convoIndex === -1) return false;
    
    mockConversations.splice(convoIndex, 1);
    delete mockMessages[conversationId];
    
    return true;
};
