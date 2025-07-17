"use client";

import { useState, useEffect } from 'react';
import { SearchInput, type SearchSuggestion } from "@/components/common/SearchInput";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import type { MockUser } from '@/types';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PeopleSearchProps {
  onUserSelected?: (user: MockUser) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function PeopleSearch({ 
  onUserSelected, 
  placeholder = "Search users by username...", 
  autoFocus = false,
  className 
}: PeopleSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullResults, setFullResults] = useState<MockUser[]>([]);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSuggestions([]);
        setFullResults([]);
        return;
      }

      try {
        setIsLoading(true);
        
        // Add current user ID to exclude list if logged in
        const excludeIds = user ? [user.id] : [];
        const queryParams = new URLSearchParams({
          q: searchTerm,
          exclude: excludeIds.join(','),
          limit: '10'
        });
        
        const response = await fetch(`/api/users/search?${queryParams}`);
        
        if (!response.ok) {
          throw new Error('Search request failed');
        }
        
        const data = await response.json();
        const users = data.users as MockUser[];
        
        setFullResults(users);
          // Create suggestions for dropdown
        const userSuggestions = users.map(user => {
          // Create a more descriptive label
          let label = user.username;
          if (user.displayName && user.displayName !== user.username) {
            label = `${user.displayName} (@${user.username})`;
          } else if (user.fullName && user.fullName !== user.username) {
            label = `${user.fullName} (@${user.username})`;
          }
          
          return {
            id: user.id,
            label: label,
            type: 'user' as 'user',
            href: `/chat/profile/${user.id}`,
            imageUrl: user.profileImage || user.avatar,
            fallbackText: (user.displayName || user.fullName || user.username).charAt(0).toUpperCase()
          };
        });
        
        setSuggestions(userSuggestions);
      } catch (error) {
        console.error("Error searching users:", error);
        toast({
          title: "Search failed",
          description: "Could not complete the search. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search requests
    const timer = setTimeout(searchUsers, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, user, toast]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // Find the full user object from the results
    const selectedUser = fullResults.find(u => u.id === suggestion.id);
    
    // If onUserSelected is provided, call it with the selected user
    if (selectedUser && onUserSelected) {
      onUserSelected(selectedUser);
    }
    // If no callback provided, navigate to the user's profile
    else if (suggestion.href) {
      router.push(suggestion.href);
    }
    
    // Reset the search
    setSearchTerm('');
    setSuggestions([]);
  };

  return (
    <div className={className}>
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder={placeholder}
        className="w-full"
        autoFocus={autoFocus}
        suggestions={suggestions}
        onSuggestionClick={handleSuggestionClick}
        isLoadingSuggestions={isLoading}
        onClear={() => {
          setSearchTerm('');
          setSuggestions([]);
        }}
      />
      {isLoading && (
        <div className="flex items-center mt-2 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}
    </div>
  );
}
