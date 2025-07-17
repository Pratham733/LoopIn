"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Users, MessageSquareOff } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { ConversationItem } from '@/components/chat/ConversationItem';
import { SearchInput } from '@/components/common/SearchInput';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { AnimatedList } from '@/components/magicui/animated-list';
import type { Conversation } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getUserConversations } from '@/services/conversationService';

export default function ConversationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // Load conversations from Firebase
  useEffect(() => {
    async function loadConversations() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Loading conversations for user:', currentUser.id);
        const firebaseConversations = await getUserConversations(currentUser.id);
        console.log('Raw conversations from Firebase:', firebaseConversations.length);
        
        // Load participant data for each conversation
        const conversationsWithParticipants = await Promise.all(
          firebaseConversations.map(async (conv) => {
            try {
              if (!conv.isGroup) {
                // For direct conversations, load participant details
                if (conv.participantIds && Array.isArray(conv.participantIds)) {
                  const { getUserProfile } = await import('@/services/userService');
                  const participants = await Promise.all(
                    conv.participantIds.map((id: string) => getUserProfile(id))
                  );
                  conv.participants = participants.filter(p => p !== null);
                } else {
                  // Fallback: initialize empty participants array
                  conv.participants = [];
                }
              }
              return conv;
            } catch (error) {
              console.error('Error loading conversation participants:', error);
              // Return conversation with empty participants if there's an error
              conv.participants = [];
              return conv;
            }
          })
        );

        console.log('Processed conversations:', conversationsWithParticipants.length);
        setConversations(conversationsWithParticipants);
      } catch (error) {
        console.error('Error loading conversations:', error);
        setError('Failed to load conversations. Please try again.');
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadConversations();
  }, [currentUser]);

  // Filter and sort conversations
  const filteredAndSortedConversations = useMemo(() => {
    if (!conversations || conversations.length === 0) {
      return [];
    }
    
    let filtered = conversations;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = conversations.filter(convo => {
        const name = convo.isGroup 
          ? convo.name 
          : convo.participants?.find(p => p?.id !== currentUser?.id)?.username;
        
        const messageContent = typeof convo.lastMessage?.content === 'string' 
          ? convo.lastMessage.content 
          : '';
        
        return name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               messageContent.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // Sort conversations
    return filtered.sort((a, b) => {
      // Pinned conversations first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then by last message timestamp (most recent first)
      let timeA = 0;
      let timeB = 0;
      
      if (a.lastMessage?.timestamp) {
        const dateA = new Date(a.lastMessage.timestamp);
        timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
      }
      
      if (b.lastMessage?.timestamp) {
        const dateB = new Date(b.lastMessage.timestamp);
        timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
      }
      
      return timeB - timeA;
    });
  }, [conversations, searchTerm, currentUser]);

  // Create conversation items for the animated list
  const conversationItems = useMemo(() => {
    return filteredAndSortedConversations.map(convo => (
      <ConversationItem key={convo.id} conversation={convo} />
    ));
  }, [filteredAndSortedConversations]);



  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Loader size="lg" showText={true} text="Loading conversations..." />
        <p className="text-muted-foreground">Loading conversations...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <MessageSquareOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Error Loading Conversations</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-2 sm:p-4">
      {/* Header */}
      <div className="px-1 sm:px-2 mb-4">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold mb-4">Conversations</h1>
        
        {/* Action Buttons */}
        <div className="flex flex-row gap-4 mb-4">
          <InteractiveHoverButton href="/chat/friends">
            <PlusCircle className="mr-2 h-5 w-5" /> New Chat
          </InteractiveHoverButton>
          <InteractiveHoverButton href="/chat/conversations/new-group">
            <Users className="mr-2 h-5 w-5" /> New Group
          </InteractiveHoverButton>
        </div>
        
        {/* Search Input */}
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search conversations..."
          className="mb-4"
          inputClassName="text-sm sm:text-base"
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-hidden relative">
        {filteredAndSortedConversations.length > 0 ? (
          <>
            <AnimatedList
              className="h-full space-y-3 p-2"
              delay={150}
            >
              {conversationItems}
            </AnimatedList>
            {/* Gradient overlay at bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
            <MessageSquareOff className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              {searchTerm ? "No Conversations Found" : "No Conversations Yet"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              {searchTerm 
                ? "Try a different search term or start a new conversation."
                : "You don't have any conversations yet. Start chatting with friends!"
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link 
                href="/chat/friends" 
                className="text-primary hover:underline text-sm"
              >
                Start a new chat
              </Link>
              <span className="hidden sm:inline text-muted-foreground">or</span>
              <Link 
                href="/chat/conversations/new-group" 
                className="text-primary hover:underline text-sm"
              >
                Create a group chat
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 