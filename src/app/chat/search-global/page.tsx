
"use client";

import { SearchInput, type SearchSuggestion } from "@/components/common/SearchInput";
import { Search as SearchIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockUsers } from "@/lib/mockData"; // For generating mock suggestions
import { DEFAULT_AVATAR } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { getAllUsers } from "@/services/userService";
import { getFeedPostsForUser } from "@/services/postService";
import type { MockUser, Post } from "@/types";
import { AnimatedList } from '@/components/magicui/animated-list';
import UserAvatar from '@/components/common/UserAvatar';

export default function GlobalSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const router = useRouter();

  // Load data on client side only
  useEffect(() => {
    // Use fallback data for initial render and during SSR
    if (typeof window !== 'undefined') {
      // Client-side: try to fetch real data
      getAllUsers().then(setUsers).catch(() => {
        // Fallback to mock data if real data fails
        setUsers(mockUsers || []);
      });
      
      // For posts, we'd need a user ID, so just use empty array for now
      // In a real app, you might fetch recent public posts or trending posts
      setPosts([]);
    } else {
      // Server-side: use mock data or empty arrays
      setUsers(mockUsers || []);
      setPosts([]);
    }
  }, []);

  const allSearchableUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) {
      return [];
    }
    return users.map(u => {
      // Safely handle missing username, displayName, or fullName
      const username = u.username || u.displayName || u.fullName || u.email?.split('@')[0] || 'Unknown';
      const displayLabel = u.displayName || u.fullName || username;
      
      return {
        id: u.id,
        label: displayLabel,
        imageUrl: u.profileImage || u.avatar || DEFAULT_AVATAR,
        fallbackText: username.charAt(0).toUpperCase(),
        type: 'user' as 'user',
        href: `/chat/profile/${u.id}`,
        // Add searchable fields for better matching
        searchableFields: {
          username: username.toLowerCase(),
          displayName: (u.displayName || '').toLowerCase(),
          fullName: (u.fullName || '').toLowerCase(),
          email: (u.email || '').toLowerCase(),
          bio: (u.bio || '').toLowerCase()
        }
      };
    });
  }, [users]);

  const allSearchablePosts = useMemo(() => {
    if (!posts || !Array.isArray(posts)) {
      return [];
    }
    return posts.map(p => ({
      id: p.id,
      label: p.content.substring(0, 50) + (p.content.length > 50 ? '...' : ''),
      imageUrl: DEFAULT_AVATAR, // Could be user's avatar or post media
      fallbackText: "P",
      type: 'post' as 'post',
      href: `/chat/post/${p.id}` // Assuming a route for individual post view
    }));
  }, [posts]);


  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      return;
    }

    const termLC = searchTerm.toLowerCase();
    
    // Enhanced user search - search through multiple fields
    const userResults = allSearchableUsers
      .filter(u => {
        // Search through all searchable fields
        const fields = u.searchableFields;
        return (
          u.label.toLowerCase().includes(termLC) ||
          fields.username.includes(termLC) ||
          fields.displayName.includes(termLC) ||
          fields.fullName.includes(termLC) ||
          fields.email.includes(termLC) ||
          fields.bio.includes(termLC)
        );
      })
      .slice(0, 5); // Increase limit for user results

    const postResults = allSearchablePosts
      .filter(p => p.label.toLowerCase().includes(termLC))
      .slice(0, 2);
    
    // Prioritize user results over post results
    setSuggestions([...userResults, ...postResults].slice(0, 7)); // Increase total limit

  }, [searchTerm, allSearchableUsers, allSearchablePosts]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.href) {
      router.push(suggestion.href);
    } else if (suggestion.type === 'post') {
      // Potentially navigate to feed and scroll to post, or open post modal
      console.log("Clicked post suggestion:", suggestion.id);
    }
    setSearchTerm(''); // Clear search term after selection
    setSuggestions([]);
  };

  const handleActualSearch = (term: string) => {
    console.log(`Performing global search for: "${term}"`);
    // Placeholder: In a real app, this would trigger a full search results view
    // For now, suggestions act as the primary search interaction on this page.
    setSuggestions([]); // Clear suggestions as a full search might be different
  };


  return (
    <div className="flex flex-col h-full items-center p-2 sm:p-4 md:p-6">
      <Card className="w-full max-w-2xl shadow-xl bg-card/80 dark:bg-card/70 backdrop-blur-sm">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-xl sm:text-2xl font-bold flex items-center">
            <SearchIcon className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" /> Global Search
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Search for people, posts, and more across LoopIn.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={handleActualSearch} 
            placeholder="Search users, posts..."
            inputClassName="text-sm sm:text-base h-11 sm:h-12" // Make input taller
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            isLoadingSuggestions={false} // Set true for async loading
          />
          {/* Animated user list when not searching */}
          {searchTerm.trim() === '' && allSearchableUsers.length > 0 && (
            <div className="mt-6">
              <AnimatedList delay={80} className="space-y-2">
                {allSearchableUsers.map(user => (
                  <button
                    key={user.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    onClick={() => router.push(`/chat/profile/${user.id}`)}
                  >
                    <UserAvatar
                      user={{ profileImage: user.imageUrl, username: user.label }}
                      size="sm"
                      className="h-8 w-8 rounded-full object-cover border border-muted"
                      fallbackClassName="text-base"
                    />
                    <span className="text-base text-foreground truncate">{user.label}</span>
                  </button>
                ))}
              </AnimatedList>
            </div>
          )}
          <div className="mt-6 sm:mt-8 text-center text-muted-foreground">
            <p className="text-xs sm:text-sm">
              {searchTerm ? `Showing suggestions for "${searchTerm}".` : "Start typing to search."}
            </p>
            {/* This area would display full search results if onSearch populated a different list */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
